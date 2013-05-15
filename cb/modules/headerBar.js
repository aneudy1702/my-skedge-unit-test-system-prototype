/** @type {function(!Array, function(?):?): !ModulerInterface} */
modules.HeaderBar = function(hs, fn) {
  var headerBar = new Moduler(hs, 'div', function(d, e, c) {
    c.length = 0;
    return '';
  });
  var addChildrenToHeader = function(d) {
    util.map(d, function(i, num) {
      var child = headerBar.addChild(fn(i));
      child.addCSSClass('calColumnHeader');
      child.setCSS({
        width: 100 / d.length + '%',
        position: 'absolute',
        height: '100%',
        left: 100 / d.length * num + '%'
      });
    });
  };
  headerBar.setUpdateChildren(function(d) {
    addChildrenToHeader(d);
  });
  addChildrenToHeader(hs);
  return headerBar.getInterface();
};

modules.headerBarDate = function(d, openDay) {
  var div = new Moduler(d, 'a', function(d) {
    var df = new goog.i18n.DateTimeFormat('EEE MMM d');
    return df.format(d.toDate());
  });
  div.onClick(function() {
    openDay(d);
  });
  return div.getInterface();
};

modules.headerBarName = function(d) {
  var div = new Moduler(d, 'div', function(d) {
    return util.getThingName(d);
  });
  return div.getInterface();
};
