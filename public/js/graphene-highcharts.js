var Higcharts = require("highcharts-release");

var solidgaugesettings = {
    chart: {
        renderTo: 'tps',
        type: 'solidgauge'
    },
    pane: {
        startAngle: -90,
        endAngle: 90,
        background: {
            backgroundColor: '#EEE',
            innerRadius: '60%',
            outerRadius: '100%',
            shape: 'arc'
        }
    },
    tooltip: {
        enabled: false
    },
    // the value axis
    yAxis: {
        stops: [
            [0.1, '#55BF3B'], // green
            [0.5, '#DDDF0D'], // yellow
            [0.9, '#DF5353']  // red
        ],
        lineWidth: 0,
        minorTickInterval: null,
        tickPixelInterval: 400,
        tickWidth: 0,
        title: {
            y: -70
        },
        labels: {
            y: 16
        },
        min: 0,
        max: 100,
        title: {
            text: 'tx/s'
        }
    },
    plotOptions: {
        solidgauge: {
            dataLabels: {
                y: 5,
                borderWidth: 0,
                useHTML: true
            }
        }
    },
    title: {
        text: null, 
    },
    subtitle: {
        text: null,
    },
    exporting: {
      enabled: false
    },
    credits: {
      enabled: false
    },
    series: [{
        name: 'numTx',
        data: [0],
        dataLabels: {
            format: '<div style="text-align:center"><span style="font-size:25px;color:black">{y}</span><br/>' +
                    '<span style="font-size:12px;color:silver">tp/s</span></div>'
        },
        tooltip: {
            valueSuffix: ' tps'
        }
    }]
};
;

var histsettings = {
    chart: {
        renderTo: 'tpbhist',
    },
    title: {
        text: null,
    },
    xAxis: {
        title: {
            text: 'Block nr.',
        },
    },
    yAxis: {
        title: {
          text: 'Num. Transactions',
        },
        min : 0,
        max : 10,
    },
    tooltip: {
        headerFormat: '<b>{series.name}</b><br/>',
        pointFormat: 'block {point.x}: {point.y} txs'
    },
    series: [{
        name: 'Transactions per block',
        data: [],
        maker: {
           enabled: false,
           radius: 0
        },
        shadow: true
    }],
    exporting: {
         enabled: false
    },
    credits: {
      enabled: false
    },
};

var charttps     = new Highcharts.Chart(solidgaugesettings);
var charttpbhist = new Highcharts.Chart(histsettings);

function updateGauge(tps) {
  charttps.series[0].points[0].update(tps,true);
}

function updateTxHist(pair) {
  charttpbhist.series[0].addPoint(pair);
  if (charttpbhist.yAxis[0].max < pair[1]) { // rescale
      charttpbhist.yAxis[0].setExtremes(0,Math.floor(pair[1] * 1.2))
  }
}

module.exports = { 
      charttps     : charttps,
      charttpbhist : charttpbhist,
      updateGauge  : updateGauge,
      updateTxHist : updateTxHist,
};
