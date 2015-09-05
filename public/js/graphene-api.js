var chart            = require('./graphene-highcharts.js');
var hljs             = require("highlight.js")

var port             = "8080"
var host             = "ws://" + ((window.location.protocol == "file:") ?  "localhost" : window.location.hostname) + ":8080";
var objectMap        = {};

/***********************************************
 * Custom methods
 ***********************************************/
function printBlockJSON(data) {
  $('#blockJson').html(JSON.stringify(data, null, '  '));
  $('#blockJson').each(function(i, block) {
   hljs.highlightBlock(block);
 });
}

function process_tps(stats) {
  var tps = stats["tps"];
  chart.charttps.series[0].points[0].update(stats["meantps"].toFixed(2));
  chart.charttpbhist.series[0].addPoint([stats["head_block_number"], tps]);
  if (chart.charttpbhist.yAxis[0].max < tps) { // rescale
      chart.charttpbhist.yAxis[0].setExtremes(0,Math.floor(tps * 1.2))
  }
  // Sparkline
  $("#activity").sparkline(stats["lastnumtxs"], { 
      type: 'bar', 
      barColor: '#3366cc',
      width: '150px'
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

function process_stats(stats) {
  // Sparkline
  $("#optypes").sparkline(stats["optype"], { 
      type: 'pie',
   });
  $("#feespayed").sparkline(stats["feespayed"], { 
      type: 'pie',
   });
  $("#transfered").sparkline(stats["transfered"], { 
      type: 'pie',
   });

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

   case 'tps':
     process_tps(data["data"]);
     break;

   case 'txs':
     process_tx(data["data"]);
     break;

   case 'stats':
     process_stats(data["data"]);
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
   //console.log('Server:');
   //console.log(JSON.parse(e.data));
   //console.log(e.data.length);
   onNotice(JSON.parse(e.data));
 };
});
$(window).on('beforeunload', function(){
   connection.close();
});
