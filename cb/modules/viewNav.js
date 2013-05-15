/**
 * @param {!string} view
 * @param {function(!string):?} changeView
 * @return {!ModulerInterface}
 */
modules.ViewNav = function(view, changeView) {
  var container = new Moduler(config.view, 'div class="viewNav"', function() { return ''; });
  var viewNav = container.createChild('', 'ul class="nav nav-pills"');
  var d = viewNav.createChild('', 'li');
  d.createChild('D', 'a');
  var w = viewNav.createChild('', 'li');
  w.createChild('W', 'a');
  var m = viewNav.createChild('', 'li');
  m.createChild('M', 'a');
  var l = viewNav.createChild('', 'li');
  l.createChild('L', 'a');
  var setActive = function(v) {
    var removeActive = function() {
      util.map([d, w, m, l], function(x) { x.removeCSSClass('active'); });
    };
    switch (v) {
      case 'Month':
        removeActive();
        m.addCSSClass('active');
        break;
      case 'Week':
        removeActive();
        w.addCSSClass('active');
        break;
      case 'Day':
        removeActive();
        d.addCSSClass('active');
        break;
      case 'List':
        removeActive();
        l.addCSSClass('active');
        break;
      default:
        break;
    }
  };
  setActive(config.view);
  m.onClick(function() {
    setActive('Month');
    changeView('Month');
  });
  w.onClick(function() {
    setActive('Week');
    changeView('Week');
  });
  d.onClick(function() {
    setActive('Day');
    changeView('Day');
  });
  container.setUpdateChildren(function(d) {
    setActive(d);
  });
  container.setCSS({zIndex:1040});
  return container.getInterface();
};
