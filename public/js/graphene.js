var processing              = require('./graphene-processing.js');

var port             = "8080"
var host             = "ws://" + ((window.location.protocol == "file:") ?  "localhost" : window.location.hostname) + ":" + port;
var connection;

function setup_ws_connection() {
 console.log('Connecting to WebSocket: '+host);
 connection = new WebSocket(host);

 connection.onopen = function (e) {
   console.log('WebSocket opened');
   processing.updateConnectionStatus("connected");
 };
 connection.onerror = function (error) {
   console.log('WebSocket Error ' + error);
   processing.updateConnectionStatus("Error");
 };
 connection.onclose = function (error) {
   console.log('WebSocket closed ' + error);
   processing.updateConnectionStatus("disconnected");
   setTimeout(setup_ws_connection, 5000);
 };
 connection.onmessage = function (e) {
   //console.log('Server:'+e.data);
   //console.log(e.data.length);
   processing.onNotice(JSON.parse(e.data));
 };
 $(window).on('beforeunload', connection.close);
}
$(window).on('load', setup_ws_connection);

module.exports = {
                  setup_ws_connection : setup_ws_connection
                 };
