var chart            = require('./graphene-highcharts.js');
var hljs             = require("highlight.js")

var port             = "8080"
var host             = "ws://" + ((window.location.protocol == "file:") ?  "localhost" : window.location.hostname) + ":8080";
var objectMap        = {};
var lastStats        = [];

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
  $('#blocknum').text(data["head_block_number"].toLocaleString());
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
  }
}

/***********************************************
 * API
 ***********************************************/
$(window).on('load', function() {
 console.log('Connecting to WebSocket: '+host);
 hljs.initHighlightingOnLoad();
 connection = new WebSocket(host);
 connection.onopen = function (e) {
   console.log('WebSocket opened');
 };
 // Log errors
 connection.onerror = function (error) {
   console.log('WebSocket Error ' + error);
 };
 // Log messages from the server
 connection.onmessage = function (e) {
   //console.log('Server:'+e.data);
   //console.log(e.data.length);
   onNotice(JSON.parse(e.data));
 };
});
$(window).on('beforeunload', function(){
   connection.close();
});

module.exports = {
          lastStats         : lastStats,
          chart         : chart,
          objectMap     : objectMap,
          process_stats : process_stats,
         };
