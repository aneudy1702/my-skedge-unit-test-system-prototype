/**
 * @param {!Array.<!SK.Event.Event>} events Events array.
 * @param {!goog.date.DateTime} date Date of column.
 * @return {!ModulerInterface} Interface for EventLayer.
 */
modules.EventLayer = function(events, date) {
  var eventLayer = new Moduler([], 'div', function(es, el, c) {
    c.length = 0;
    return '';
  });
  eventLayer.setCSS({
    height: '100%',
    width: '100%'
  });
  eventLayer.setUpdateChildren(function(es) {
    var sod = util.sod(date);
    $.map(es, function(e) {
      $.map(e.occs(), function(o) {
        eventLayer.addChild(modules.Event(o, e, sod));
      });
    });
  });
  eventLayer.setData(events);
  return eventLayer.getInterface();
};
