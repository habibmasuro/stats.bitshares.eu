var stats            = {};
    stats["tps"]     = [0,0,0,0,0,0,0,0,0,0];

function printJSON(data) {
  $('#blockJson').html(JSON.stringify(data, null, '\t'));
  $('#blockJson').each(function(i, block) {
   hljs.highlightBlock(block);
 });
}

function getBlock(d) {
   blocknum = d[0]["head_block_number"]
   ws_exec([api_ids["database"], "get_block",[blocknum]], function(res){
             onBlock(res,d);
          });
}

function onBlock(d,b) {
  var data = d["result"];
  jQuery.extend(data, b[0]);
  
  /* TPS */
  var tps;
  printJSON(data);
  if ("transactions" in data) {
      tps = data["transactions"].length;
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
      var a = [ 
	   data[ "head_block_number" ],
	   op[1]["from"],
           op[1]["to"],
           JSON.stringify(op[1]["amount"])
      ]
      $('#txlist').dataTable().fnAddData(a);
    }
  }
}
