var Higcharts = require("highcharts-release");

var charttps= new Highcharts.Chart({
    chart: {
        renderTo: 'tps',
        type: 'gauge',
        plotBackgroundColor: null,
        plotBackgroundImage: null,
        plotBorderWidth: 0,
        plotShadow: false
    },
    title: {
        text: 'TPS (mean tps per last 10 blocks)'
    },
    pane: {
        startAngle: -150,
        endAngle: 150,
        background: [{
            backgroundColor: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [
                    [0, '#FFF'],
                    [1, '#333']
                ]
            },
            borderWidth: 0,
            outerRadius: '109%'
        }, {
            backgroundColor: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [
                    [0, '#333'],
                    [1, '#FFF']
                ]
            },
            borderWidth: 1,
            outerRadius: '107%'
        }, {
            // default background
        }, {
            backgroundColor: '#DDD',
            borderWidth: 0,
            outerRadius: '105%',
            innerRadius: '103%'
        }]
    },
    // the value axis
    yAxis: {
        min: 0,
        max: 100,
        minorTickInterval: 'auto',
        minorTickWidth: 1,
        minorTickLength: 10,
        minorTickPosition: 'inside',
        minorTickColor: '#666',
        tickPixelInterval: 30,
        tickWidth: 2,
        tickPosition: 'inside',
        tickLength: 10,
        tickColor: '#666',
        labels: {
            step: 2,
            rotation: 'auto'
        },
        title: {
            text: 'tx/sec'
        },
        plotBands: [{
            from: 0,
            to: 60,
            color: '#55BF3B' // green
        }, {
            from: 60,
            to: 80,
            color: '#DDDF0D' // yellow
        }, {
            from: 80,
            to: 100,
            color: '#DF5353' // red
        }]
    },
    series: [{
        name: 'numTx',
        data: [0],
        tooltip: {
            valueSuffix: ' tps'
        }
    }],
    exporting: {
         enabled: false
    },
    credits: {
      enabled: false
    },
});

var charttpbhist = new Highcharts.Chart({
    chart: {
        renderTo: 'tpbhist',
    },
    title: {
        text: 'Transactions per block'
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
               max : 50,
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
