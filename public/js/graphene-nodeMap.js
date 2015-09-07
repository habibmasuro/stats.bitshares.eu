var Datamap = require("datamaps");

var map = new Datamap({
  scope: 'world',
  element: document.getElementById('nodemap'),
  height: 200,
  fills: {
    defaultFill: 'black',
    node : '#F00'
  },
  geographyConfig: {
    highlightOnHover: false,
    popupOnHover: false
  },
  bubblesConfig: {
    highlightOnHover: false,
    popupOnHover: false,
  }
});

/*
map.bubbles([
 {latitude: 21.32  , longitude: 5.32   , radius: 10 , fillKey: 'node'} , 
 {latitude: -25.32 , longitude: 120.32 , radius: 18 , fillKey: 'node'} , 
 {latitude: 21.32  , longitude: -84.32 , radius: 8  , fillKey: 'node'} , 
]);
*/

module.exports = {
 map : map,
};
