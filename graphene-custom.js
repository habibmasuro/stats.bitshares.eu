var stats            = {};
    stats["tps"]     = [0,0,0,0,0,0,0,0,0,0];

function printBlockJSON(data) {
  $('#blockJson').html(JSON.stringify(data, null, ' '));
  $('#blockJson').each(function(i, block) {
   hljs.highlightBlock(block);
 });
}

function printTxJSON(data) {
  $('#txJson').html(JSON.stringify(data, null, ' '));
  $('#txJson').each(function(i, block) {
   hljs.highlightBlock(block);
 });
}

function onNotice(d) {
   var data = d[0][0];
   if (data === undefined) return;
   if ("head_block_number" in data) {
       blocknum = data["head_block_number"];
       ws_exec([api_ids["database"], "get_block",[blocknum]], function(res){
		 onBlock(res,d);
	      });
   }
}

function onBlock(d,b) {
  var data = b[0][0];
  jQuery.extend(data, d["result"]);
  
  /* TPS */
  var tps;
  printBlockJSON(data);
  if ("transactions" in data) {
      tps = data["transactions"].length;
      if (tps > 0)
      	 printTxJSON(data["transactions"]);
  } else {
      tps = 0;
  }
  stats["tps"].push(tps)
  stats["tps"] = stats["tps"].slice(-10,11);
  var sum = stats["tps"].reduce(function(a, b) { return a + b; });
  var meantps = sum / stats["tps"].length;
  $('#tps').highcharts().series[0].points[0].update(meantps);

  blocknum = data["head_block_number"];

  $('#tpbhist').highcharts().series[0].addPoint([blocknum, tps]);

  /* tx list */
  for (var txID in data["transactions"]) {
    tx = data["transactions"][txID];
    for (var opID in tx["operations"]) {
      var op = tx["operations"][opID];
      var a = {
	   "blocknr" : data[ "head_block_number" ],
	   "from" : op[1]["from"],
           "to" :op[1]["to"],
           "tx" : tx
      }
      $('#txlist').dataTable().fnAddData(a);
    }
  }
}
