var chart            = require('./graphene-highcharts.js');
var nodeMap          = require('./graphene-nodeMap.js');
var hljs             = require('highlight.js');
hljs.initHighlightingOnLoad();

var objectMap        = {};
var lastStats        = [];

/*
 *
 * User Interface
 *
 */
function updateBlock(data) {
  $('#blockJson').html(JSON.stringify(data, null, '  '));
  $('#blockJson').each(function(i, block) {
   hljs.highlightBlock(block);
 });
}

function updateObject(id, data) {
  objectMap[ id ] = data;

  if ("2.0.0" in objectMap) {
   var p = objectMap["2.0.0"]["parameters"];
   $('#blockint').text(   p["block_interval"]        + "s" );
   $('#maintint').text(   p["maintenance_interval"]  + "s" );
   $('#witness_pay').text((p["witness_pay_per_block"]/1e5).toLocaleString() + "/b");
   $('#budget_pay').text( (p["worker_budget_per_day"]/1e5).toLocaleString() + "/d");
  }
  if ("2.1.0" in objectMap) {
   $('#recentlyMissed').text( objectMap["2.1.0"]["recently_missed_count"] );
   updateBlock(data);
  }
  if ("account_count" in objectMap) {
   $('#account_count').text(objectMap["account_count"].toLocaleString());
  }
}

function updateConnectionStatus(type) {
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


/*
 *
 * Processing
 *
 */
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
  //console.log("Notification: "+ data["type"]);
  switch(data["type"]) {

   case 'txs':
     process_tx(data["data"]);
     break;

   case 'stats':
     objectMap["laststats"] = _.clone(data["data"]);
     process_stats();
     break;

   case 'obj':
     updateObject(data["id"], data["data"]);
     break;

   case 'peers':
     process_peers(data["data"]);
     break
  }
}

module.exports = { 
                  onNotice               : onNotice,
                  updateConnectionStatus : updateConnectionStatus
                 }
