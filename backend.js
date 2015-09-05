var host             = "ws://176.9.234.167:8090"
var rpc_id           = 1;
var pending_requests = {};
var api_ids          = {};
var subscriptions    = {};
var subscription_id  = 0;
var objectMap        = {};
var WebSocket        = require('ws');
var backend_api      = new WebSocket(host);
var _                = require("lodash");
var async            = require("async");
var backend_api;

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
     ws.on('message', function(message) {});
});

function objToUser(id) {
     toUser({"type":"obj","id":id,"data":objectMap[id]});
}
function toUser(data) {
 frontend_api.clients.forEach(function each(client) {
   client.send(JSON.stringify(data));
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
  if ("transactions" in data) {
      tps = data["transactions"].length;
      if (tps > 0) {
        addtoStats("lastnumtxs",tps)
      }
  } else {
      tps = 0;
  }
  addtoStats("tps",tps)

  var sum     = stats["tps"].reduce(function(a, b) { return a + b; });
  var blockinterval_sec = 1;
  if ("2.0.0" in objectMap) {
   blockinterval_sec = objectMap["2.0.0"]["parameters"]["block_interval"]
  }
  var meantps = sum / stats["tps"].length / blockinterval_sec;

  toUser({
            "type" : "tps",
            "data" : {
               "tps" : tps,
               "meantps" : meantps,
               "head_block_number" : data["head_block_number"],
               "history"   : stats[ "tps"        ],
               "lastnumtxs": stats[ "lastnumtxs" ],
               "lasttxs"   : stats[ "lasttxs"    ],
               "lastops"   : stats[ "lastops"    ],
               "feespayed" : stats[ "feespayed"  ],
               "transfered": stats[ "transfered" ],
               "optype"    : stats[ "optype"     ],
            },
         });
}

var transaction_update = [];

function process_each_op(op, ref_block) {
  var to   = "-";
  var from = "-";
  var opID = op[0];
  if ("to" in op[1])   to   = op[1]["to"];
  if ("from" in op[1]) from = op[1]["from"];
  var rowId = ref_block + "." + opID;
  transaction_update.push({
     id        : rowId,
     ref_block : ref_block,
     to        : to,
     from      : from,
     opID      : opID,
  });
  /*
  var to   = "-";
  var from = "-";
  var opID = op[0];
  var rowId = ref_block + "." + opID;
  if (opID == 0) {
   async.parallel({
         to : function (callback) {
               get_account(op[1]["to"], function(r) {
                  callback(null,r["result"][0]["name"]);
               })
             },
         from : function (callback) {
               get_account(op[1]["from"], function(r) {
                   callback(null,r["result"][0]["name"])
                 })
             },
          },
        function(err, res) {
            transaction_update.push({
               id        : rowId,
               ref_block : ref_block,
               to        : res.to,
               from      : res.from,
               opID      : opID,
            });
         });
  } else {
    transaction_update.push({
       id        : rowId,
       ref_block : ref_block,
       to        : to,
       from      : from,
       opID      : opID,
    });
  }
  */

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

function process_each_tx(tx) {
  tx["operations"].forEach(function (op) {
     process_each_op(op, tx["ref_block_num"]);
  });
}

function process_tx(data) {
  transaction_update = []; // reset
  data["transactions"].forEach( function(tx) {
     process_each_tx(tx);
  })

  // http://book.mixu.net/node/ch7.html
  if (transaction_update.length > 0)
     toUser({"type": "txs",
             "data": transaction_update
            });
}

function onBlock(d,b) {
  console.log("new Block");
  var data = b[0][0];
  _.extend(data, d["result"]);

  process_tps(data);
  process_tx(data);

  delete data["transactions"];
  toUser({
            "type" : "block",
            "data" : data,
         });
  toUser({
            "type" : "stats",
            "data" : stats,
         });
}

/*
 *
 *
 *
 */
function ws_exec(request,callback) {
 var req = {}
 req.method = "call"
 req.id = rpc_id;
 req.params = request
 pending_requests[rpc_id] = callback;
 backend_api.send(JSON.stringify(req));
 //console.log(">"+JSON.stringify(req));
 rpc_id++;
}

function get_account(id, callback) {
  ws_exec([api_ids["database"], "get_objects",[[id]]], callback);
}

function subscribe_blocks() {
  ws_exec([api_ids["database"], "set_subscribe_callback",[subscription_id, true]]);
  ws_exec([api_ids["database"], "get_objects",[["2.1.0"]]]);
  subscriptions[subscription_id] = onNotice;
  subscription_id++;
}

function get_blockchain_params() {
  ws_exec([api_ids["database"], "get_objects",[["2.0.0"]]], function(res) {
            objectMap["2.0.0"] = res["result"][0];
          });
  ws_exec([api_ids["database"], "get_account_count",[]], function(res) {
            objectMap["account_count"] = res["result"];
          });
  
}

backend_api.onerror = function (error) {
  console.log('WebSocket Error ' + error);
};

backend_api.on('open', function open() {
   console.log('WebSocket opened');
   ws_exec([1,"login",["bytemaster","supersecret"]]);
   ws_exec([1,"network_broadcast",[]], function(res){
             api_ids["network_broadcast"] = res.result;
          });
   ws_exec([1,"history",[]], function(res){
             api_ids["history"] = res.result;
          });
   ws_exec([1,"database",[]], function(res){
             api_ids["database"] = res.result;
             get_blockchain_params();
             subscribe_blocks();
          });
});

backend_api.on('message', function(e, flags) {
   // flags.binary will be set if a binary data is received.
   // flags.masked will be set if the data was masked.
   var d = JSON.parse(e);
   //console.log('Server: ' + JSON.stringify(d,null,"\t"));
   if (d[ "method" ] == "notice") {
     var callback = subscriptions[d["params"][0]];
     if ( typeof callback === 'function' ) 
         callback(d["params"][1]);
   } else {
    callback = pending_requests[d.id];
    if ( typeof callback === 'function' ) 
        callback(d);
   }
});
