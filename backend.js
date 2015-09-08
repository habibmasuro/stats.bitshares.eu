var host             = "ws://176.9.234.167:8090"
//var host             = "ws://localhost:8090"
var objectMap        = {};
var WebSocket        = require('ws');
var Promise          = require('promise');
var _                = require("lodash");
var geoip            = require('geoip-lite');
var peerMap          = [];
var blocknum;

var WebSocketServer = require('ws').Server;
var frontend_api = new WebSocketServer({port: 8080});

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

frontend_api.on('connection', function(ws) {
     objToUser("2.0.0");
     objToUser("account_count");
     publish_peers();
     sendStats();
     ws.on('message', function(message) {});
});

function objToUser(id) {
     toUser({"type":"obj","id":id,"data":objectMap[id]});
}
function toUser(data) {
 if (data["type"] == "txs") console.log(data);
 frontend_api.clients.forEach(function each(client) {
   client.send(JSON.stringify(data));
 });
}

function onNotice(d) {
   var notices = d[0];
   notices.forEach(function (notice) {
     if ("id" in notice) {
         var n = notice["id"].split(".");
         var space = n[0];
         var type  = n[1];
         var id    = n[2];
         
         if (notice["id"] == "2.1.0") {
           objectMap["2.1.0"] = notice;
           objToUser("2.1.0");
           blocknum = notice["head_block_number"];
           ws_exec([api_ids["database"], "get_block",[blocknum]]).then(function(block){
              onBlock(block["result"]);
           });
         };
         if (notice["id"] == "2.0.0") {
           objectMap["2.0.0"] = notice;
           objToUser("2.1.0");
         }
     } else {
      console.log(JSON.stringify(notice));
     }
   });
}

function process_tps(data) {
  var tps = 0;
  if ("transactions" in data) {
      tps = data["transactions"].length;
      if (tps > 0) {
        addtoStats("lastnumtxs",tps)
      }
  }
  addtoStats("tps",tps)

  var sum     = stats["tps"].reduce(function(a, b) { return a + b; });
  var blockinterval_sec = 1;
  if ("2.0.0" in objectMap) {
   blockinterval_sec = objectMap["2.0.0"]["parameters"]["block_interval"]
  }
  stats["currenttps"] = tps;
  stats["meantps"]    = sum / stats["tps"].length / blockinterval_sec;
}

function process_op_stats(op) {
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

function process_each_op(op, ref_block) {
  var opID  = op[0];
  var rowId = ref_block + "." + opID;

  if (opID == 0) {
     return Promise.all([
             get_account(op[1]["to"]),
             get_account(op[1]["from"])
         ]).then(function(res) {
            return {
                      "id"        : rowId,
                      "ref_block" : ref_block,
                      "to"        : res[0]["result"][0]["name"],
                      "from"      : res[1]["result"][0]["name"],
                      "opID"      : opID
                   };
         });
  } else {
    return Promise.resolve({
             "id"        : rowId,
             "ref_block" : ref_block,
             "to"        : "n/A",
             "from"      : "n/A",
             "opID"      : opID,
          })
  }
}

function process_tx(data) {
  var numTxs = data["transactions"].length;
  if (numTxs) process.stdout.write("T"+numTxs);
  var cntTx = 0;
  var OpPromises = [];  
  data["transactions"].forEach(function(tx,i) {
    var numOps = tx["operations"].length;
    var cntOp = 0;
    tx["operations"].forEach(function (op) {
       // Actual Transaction
       OpPromises.push(process_each_op(op, tx["ref_block_num"]));

       // Stats
       process_op_stats(op);
    });
  });
  return Promise.all(OpPromises)
  .then(function (parsed_op_list) {
    if (parsed_op_list.length > 0) {
       toUser({"type": "txs",
               "data": parsed_op_list
              });
    }
  });
}

function sendStats() {
  toUser({
            "type" : "stats",
            "data" : {
               "head_block_number" : blocknum,
               "tps"               : stats[ "currenttps" ],
               "meantps"           : stats[ "meantps"    ],
               "history"           : stats[ "tps"        ],
               "lastnumtxs"        : stats[ "lastnumtxs" ],
               "lasttxs"           : stats[ "lasttxs"    ],
               "lastops"           : stats[ "lastops"    ],
               "feespayed"         : stats[ "feespayed"  ],
               "transfered"        : stats[ "transfered" ],
               "optype"            : stats[ "optype"     ],
            },
         });
};

function publish_peers() {
 toUser({"type":"peers","data":peerMap});
}

function onBlock(block) {
  process.stdout.write("b");
  process_tps(block);
  process_tx(block);
  sendStats();
}

/*
 *
 *
 *
 */
function get_account(id) {
  return ws_exec([api_ids["database"], "get_objects",[[id]]]);
}

function subscribe_blocks() {
  ws_exec([api_ids["database"], "set_subscribe_callback",[subscription_id, false]]).then(function(res){;
      ws_exec([api_ids["database"], "get_objects",[["2.1.0"]]]);
      subscriptions[subscription_id] = onNotice;
      subscription_id++;
  });
}

function get_blockchain_params() {
  ws_exec([api_ids["database"], "get_objects",[["2.0.0"]]]).then(function(res) {
            objectMap["2.0.0"] = res["result"][0];
          });
  ws_exec([api_ids["database"], "get_account_count",[]]).then(function(res) {
            objectMap["account_count"] = res["result"];
          });
}



function fetch_connected_peers() {
  ws_exec([api_ids["network_node"], "get_connected_peers",[]]).then(function (res) {
     var map = [];
     var peers = res["result"];
     peers.forEach(function(peer,index) {
      var geoObj = geoip.lookup(peer["info"]["addr"].split(':')[0]);
      var p = {
          addr     : peer["info"]["addr"],
          platform : peer["info"]["platform"],
          geo      : { "ll" :  geoObj ? geoObj["ll"] : [0,0] },
      };
      map.push(p);
      if(map.length == peers.length) {
          peerMap = map;
          publish_peers();
      }
     });
   });
}


/*
 *
 * API
 *
 */
var rpc_id           = 1;
var pending_requests = {};
var api_ids          = {};
var subscriptions    = {};
var subscription_id  = 1;
var pending_promises = [];
var backend_api;

function setup_ws_connection() {
   backend_api      = new WebSocket(host);

   backend_api.onerror = function (error) {
     console.log('WebSocket Error ' + error);
   };

   backend_api.on('open', function open() {
      console.log('WebSocket opened');
      ws_exec([1,"login",["bytemaster", "supersecret"]]).then(function (res) {
         ws_exec([1,"network_node",[]]).then(function(res){
                     api_ids["network_node"] = res.result;
                     fetch_connected_peers();
                     setInterval(fetch_connected_peers, 30000);
                });
         ws_exec([1,"database",[]]).then(function(res){
                   api_ids["database"] = res.result;
                   subscribe_blocks();
                   get_blockchain_params();
                });
      });
      /*
      ws_exec([1,"history",[]]).then(function(res){
                api_ids["history"] = res.result;
             });
      ws_exec([1,"network_broadcast",[]]).then(function(res){
                api_ids["network_broadcast"] = res.result;
             });
      */
   });

   backend_api.on('message', function(e, flags) {
      var d = JSON.parse(e);
      //console.log("<"+JSON.stringify(d));
      if (d[ "method" ] == "notice") {
        var callback = subscriptions[d["params"][0]];
        if ( typeof callback === 'function' ) 
            callback(d["params"][1]);
      } else {
       pending_promises[d.id].resolve(d);
      }
   });

   backend_api.on('close', function (error) {
     console.log('WebSocket closed ' + error);
     setConnectedStatus("disconnected");
     setTimeout(setup_ws_connection, 10000);
   });
}

function ws_exec(request,callback) {
 var req    = {}
 req.method = "call"
 req.id     = ++rpc_id;
 req.params = request
 //console.log(">"+JSON.stringify(req));
 return new Promise(function(resolve, reject) {
  pending_promises[rpc_id] = {
   resolve : resolve,
   reject  : reject
  }
  pending_requests[rpc_id] = callback;
  backend_api.send(JSON.stringify(req));
 });
}








setup_ws_connection();
