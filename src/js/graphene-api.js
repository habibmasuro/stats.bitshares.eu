var txtable = require("./rt-datatables.js")
var chart   = require('./graphene-highcharts.js');
var hljs    = require("highlight.js")

var host             = "ws://176.9.234.167:8090";
//var host             = "ws://104.200.28.117:8090";

var rpc_id           = 1;
var pending_requests = {};
var api_ids          = {};
var subscriptions    = {};
var subscription_id  = 0;
var connection;

var stats               = {};
    stats["tps"]        = [0,0,0,0,0,0,0,0,0,0];
    stats["lastnumtxs"] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    stats["lasttxs"]    = [];
    stats["lastops"]    = [];
    stats["feespayed"]  = {};
    stats["transfered"] = {};
    stats["optype"]     = {};


function addtoStats(name, value) {
 stats[name].push(value);
 stats[name].shift();
}

/***********************************************
 * Custom methods
 ***********************************************/
function printBlockJSON(data) {
  $('#blockJson').html(JSON.stringify(data, null, '  '));
  $('#blockJson').each(function(i, block) {
   hljs.highlightBlock(block);
 });
}

function printTxJSON(data) {
  $('#txJson').html(JSON.stringify(data, null, '  '));
  $('#txJson').each(function(i, block) {
   hljs.highlightBlock(block);
 });
}

function onNotice(d) {
   var data = d[0][0];
   if (data === undefined) return;
   if ("head_block_number" in data) {
       var blocknum = data["head_block_number"];
       ws_exec([api_ids["database"], "get_block",[blocknum]], function(res){
       		 onBlock(res,d);
	      });
   }
}

function process_tps(data) {
  var tps;
  printBlockJSON(data);
  if ("transactions" in data) {
      tps = data["transactions"].length;
      if (tps > 0) {
      	 printTxJSON(data["transactions"]);
        addtoStats("lastnumtxs",tps)
      }
  } else {
      tps = 0;
  }
  addtoStats("tps",tps)
  var sum = stats["tps"].reduce(function(a, b) { return a + b; });
  var meantps = sum / stats["tps"].length;
  // Highcharts
  chart.charttps.series[0].points[0].update(meantps);
  chart.charttpbhist.series[0].addPoint([data["head_block_number"], tps]);
  // Sparkline
  $("#activity").sparkline(stats["lastnumtxs"], { type: 'bar', barColor: '#3366cc '});
}

function process_block(data) {
  $('#blocknum').text(   data["head_block_number"].toLocaleString());
  $('#lastwitness').text(data["witness"]);
}

function process_tx_list(data) {
  for (var txID in data["transactions"]) {
    var tx = data["transactions"][txID];
    for (var opID in tx["operations"]) {
      var op   = tx["operations"][opID];
      var to   = "-";
      var from = "-";
      if ("to" in op[1])   to   = op[1]["to"];
      if ("from" in op[1]) from = op[1]["from"];
      var a = {
           "blocknr" : data[ "head_block_number" ],
           "from" :    from,
           "to" :      to,
           "tx" :      tx
      }
      $('#txlist').dataTable().fnAddData(a);
    }
  }
}

function process_tx_types(data) {
  for (var txID in data["transactions"]) {
    var tx = data["transactions"][txID];
    stats["lasttxs"].pop(tx);
    for (var opID in tx["operations"]) {
      var op   = tx["operations"][opID];
      stats["lastops"].pop(op);

      // Op Type
      if (op[0] in stats["optype"])
        stats["optype"][ op[0] ] += 1;
      else
        stats["optype"][ op[0] ]  = 1;

      if ("fee" in op[1]) {
         var amount = op[1]["fee"]["amount"];
         var asset  = op[1]["fee"]["asset_id"];
         if (asset in stats["feespayed"])
           stats["feespayed"][asset] += amount;
         else 
           stats["feespayed"][asset]  = amount;
      }
      /* Transfers */
      if (op[0]==0) {
         var amount = op[1]["amount"]["amount"];
         var asset  = op[1]["amount"]["asset_id"];
         if (asset in stats["transfered"])
           stats["transfered"][asset] += amount;
         else 
           stats["transfered"][asset]  = amount;
      }
    }
  }
  // Sparkline
  $("#optypes").sparkline(stats["optype"], { type: 'pie'});
  $("#feespayed").sparkline(stats["feespayed"], { type: 'pie'});
  $("#transfered").sparkline(stats["transfered"], { type: 'pie'});
}

function onBlock(d,b) {
  var data = b[0][0];
  jQuery.extend(data, d["result"]);
  process_block(data);
  process_tps(data);
  process_tx_list(data);
  process_tx_types(data);
}

/***********************************************
 * API
 ***********************************************/
function ws_exec(request,callback) {
 var req = {}
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
 hljs.initHighlightingOnLoad();
 connection = new WebSocket(host);
 // When the connection is open, send some data to the server
 connection.onopen = function (e) {
   console.log('WebSocket opened');
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
   var d = JSON.parse(e.data)
   if (d[ "method" ] == "notice") {
     var callback = subscriptions[d["params"][0]];
     if ( typeof callback === 'function' ) 
         callback(d["params"][1]);
   } else {
    callback = pending_requests[d.id];
    if ( typeof callback === 'function' ) 
        callback(d);
   }
 };
});

$(window).on('beforeunload', function(){
   connection.close();
});
