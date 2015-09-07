var chart            = require('./graphene-highcharts.js');
var nodeMap          = require('./graphene-nodeMap.js');
var hljs             = require("highlight.js")

var port             = "8080"
var host             = "ws://" + ((window.location.protocol == "file:") ?  "localhost" : window.location.hostname) + ":8080";
var objectMap        = {};
var lastStats        = [];
var connection;

/***********************************************
 * Custom methods
 ***********************************************/
function printBlockJSON(data) {
  $('#blockJson').html(JSON.stringify(data, null, '  '));
  $('#blockJson').each(function(i, block) {
   hljs.highlightBlock(block);
 });
}

function process_parameters(data) {
  $('#lastwitness').text(data["witness"]);
  if ("2.0.0" in objectMap) {
   var p = objectMap["2.0.0"]["parameters"];
   $('#blockint').text(   p["block_interval"]        + "s" );
   $('#maintint').text(   p["maintenance_interval"]  + "s" );
   $('#witness_pay').text((p["witness_pay_per_block"]/1e5).toLocaleString() + "/b");
   $('#budget_pay').text( (p["worker_budget_per_day"]/1e5).toLocaleString() + "/d");
  }
  if ("account_count" in objectMap) {
   $('#account_count').text(objectMap["account_count"].toLocaleString());
  }
}

function process_tx(txs) {
  txs.forEach(function (data) {
    $("#txlist tbody").prepend("<tr id='"+data["rowId"]+"'>"+
                               " <td>"+data["ref_block"]+"</td>"+
                               " <td>"+data["from"]+"<span class='ui mini text loader'></span></td>"+
                               " <td>"+data["to"]+"<span class='ui mini text loader'></span></td>"+
                               " <td>"+data["opID"]+"</td>"+
                               "</tr>");
  });
}

function process_stats() {
  if ("laststats" in objectMap) {
     var lastStats = objectMap["laststats"];
     chart.updateGauge(lastStats["meantps"]);
     chart.updateTxHist([lastStats["head_block_number"], lastStats["tps"]]);
     var tps = lastStats["tps"];

     $('#blocknum').text(lastStats["head_block_number"].toLocaleString());
     // Sparkline
     $("#activity").sparkline(lastStats["lastnumtxs"], { 
         type: 'bar', 
         barColor: '#3366cc',
         width: '150px'
      });
     // Sparkline
     $("#optypes").sparkline(lastStats["optype"], { 
         type: 'pie',
      });
     $("#feespayed").sparkline(lastStats["feespayed"], { 
         type: 'pie',
      });
     $("#transfered").sparkline(lastStats["transfered"], { 
         type: 'pie',
      });
  }
}

function process_block(block) {
  printBlockJSON(block);
  process_parameters(block);
}

function process_peers(peers) {
 var bubbles = [];
 peers.forEach(function(peer) {
  if (peer["geo"]) {
     bubbles.push({
       latitude: peer["geo"]["ll"][0],
       longitude: peer["geo"]["ll"][1],
       radius: 5,
       fillKey: 'node',
     });
  }
 });
 nodeMap.map.bubbles(bubbles);
}

function onNotice(data) {
  switch(data["type"]) {
   case 'block':
     process_block(data["data"]);
     break;

   case 'txs':
     process_tx(data["data"]);
     break;

   case 'stats':
     objectMap["laststats"] = _.clone(data["data"]);
     process_stats();
     break;

   case 'obj':
     objectMap[data["id"]] = data["data"];
     break;

   case 'peers':
     process_peers(data["data"]);
     break
  }
}

function setConnectedStatus(type) {
 if (type == "connected") {
  $('#connIndBut').attr('class', 'left green circle button icon');
  $('#connIndDiv').attr('class', '');
  $('#connIndDiv').text(type);
 } else {
  $('#connIndBut').attr('class', 'red red circle button icon');
  $('#connIndDiv').attr('class', 'ui active mini inline loader');
  $('#connIndDiv').text('');
 }
}

function setup_ws_connection() {
 console.log('Connecting to WebSocket: '+host);
 connection = new WebSocket(host);

 connection.onopen = function (e) {
   console.log('WebSocket opened');
   setConnectedStatus("connected");
 };
 connection.onerror = function (error) {
   console.log('WebSocket Error ' + error);
   setConnectedStatus("Error");
 };
 connection.onclose = function (error) {
   console.log('WebSocket closed ' + error);
   setConnectedStatus("disconnected");
   setTimeout(setup_ws_connection, 5000);
 };
 connection.onmessage = function (e) {
   //console.log('Server:'+e.data);
   //console.log(e.data.length);
   onNotice(JSON.parse(e.data));
 };
 $(window).on('beforeunload', connection.close);
 return connection;
}

/***********************************************
 * Window load
 ***********************************************/
$(window).on('load', function() {
 setup_ws_connection();
 hljs.initHighlightingOnLoad();
});

module.exports = {
          lastStats     : lastStats,
          chart         : chart,
          nodeMap       : nodeMap,
          objectMap     : objectMap,
          process_stats : process_stats,
         };
