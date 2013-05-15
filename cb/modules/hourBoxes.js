/** @type {function():!ModulerInterface} */
modules.mkHourBoxes = function() {
  var div = new Moduler('', 'div');
  util.map(util.range(0, 25, 1), function(h) {
    div.addChild(modules.mkBox(h * 100 / 24 + '%'));
  });
  return div.getInterface();
};

/** @type {function((!number|!string)):!ModulerInterface} */
modules.mkBox = function(top) {
  var div = new Moduler('', 'div');
  div.setCSS({
    position: 'absolute',
    width: '100%',
    top: top,
    bottom: (top + 100 / 24) + '%',
    'border-bottom': '1px lightgrey solid'
  });
  return div.getInterface();
};
