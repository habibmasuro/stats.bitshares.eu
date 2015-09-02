var host             = "ws://176.9.234.167:8090";
//var host             = "ws://104.200.28.117:8090";

var rpc_id           = 1;
var pending_requests = {};
var api_ids          = {};
var subscriptions    = {};
var subscription_id  = 0;
var connection;

function ws_exec(request,callback) {
 req = {}
 req.method = "call"
 req.id = rpc_id;
 req.params = request
 pending_requests[rpc_id] = callback;
 connection.send(JSON.stringify(req));
 //console.log(JSON.stringify(req));
 rpc_id++;
}

function subscribe_blocks(callback) {
  ws_exec([api_ids["database"], "set_subscribe_callback",[subscription_id, true]]);
  ws_exec([api_ids["database"], "get_objects",[["2.1.0"]]]);
  subscriptions[subscription_id] = onNotice;
  subscription_id++;
}

//$(document).ready(function() {
$(window).on('load', function() {
 connection = new WebSocket(host);
 // When the connection is open, send some data to the server
 connection.onopen = function (e) {
   //console.log('WebSocket open');
   ws_exec([1,"login",["bytemaster","supersecret"]]);
   /*
   ws_exec([1,"network_node",[]], function(res){
             api_ids["network_node"] = res.result;
          });
   */
   ws_exec([1,"network_broadcast",[]], function(res){
             api_ids["network_broadcast"] = res.result;
          });
   ws_exec([1,"history",[]], function(res){
             api_ids["history"] = res.result;
          });
   ws_exec([1,"database",[]], function(res){
             api_ids["database"] = res.result;
             subscribe_blocks();
          });
 };

 // Log errors
 connection.onerror = function (error) {
   console.log('WebSocket Error ' + error);
 };

 // Log messages from the server
 connection.onmessage = function (e) {
   //console.log('Server: ' + e.data);
   d = JSON.parse(e.data)
   if (d[ "method" ] == "notice") {
     callback = subscriptions[d["params"][0]];
     if ( typeof callback === 'function' ) callback(d["params"][1]);
   } else {
    callback = pending_requests[d.id];
    if ( typeof callback === 'function' ) callback(d);
   }
 };
});

$(window).on('beforeunload', function(){
   connection.close();
});
