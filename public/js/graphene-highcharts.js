var Higcharts = require("highcharts-release");

var charttps= new Highcharts.Chart({
    chart: {
        renderTo: 'tps',
        type: 'solidgauge'
    },
    pane: {
        center: ['50%', '85%'],
        size: '99%',
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
});

var charttpbhist = new Highcharts.Chart({
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
});

module.exports = { 
      charttps     : charttps,
      charttpbhist : charttpbhist
};
