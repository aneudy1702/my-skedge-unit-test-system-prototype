/**
 * @param {!SK.Set} selections selected things.
 * @param {!SK.NominalDate} date
 * @param {!function(!SK.Thing.Thing, !SK.Interval):?} getEvents
 * @param {!function(!SK.Thing.Thing, !SK.NominalDate, !number):?} getWorkHours
 * @param {!function(?, ?):?} bookingCB
 * @return {!ModulerInterface}
 */
modules.DayView = function(selections, date, getEvents, getWorkHours, bookingCB) {
  var container = new Moduler({date: date, selected: selections}, 'div', function(d) {
    return '';
  });
  container.setCSS({
    position: 'absolute',
    left: 0,
    right: 0,
    bottom:0,
    top: 0,
    marginTop:"10px"
  });
  var hDraw = function(d) {
    return modules.headerBarName(d);
  };
  var header = container.createChild('', 'div', function() { return '';});
  header.setCSS({
    position: 'absolute',
    height: '100%',
    left: boot.timeColumnWidth + '%',
    right: '1em'
  });
  var headerBar = header.addChild(modules.HeaderBar(container.data().selected.getValues(), hDraw));
  var overflow = container.createChild(container.data(), 'div class="viewContainer"', function(d) {
    return ''; 
  });
  overflow.setCSS({
    position: 'absolute',
    width: '100%',
    overflow: 'auto',
    top: '2em',
    bottom: 0
  });
  overflow.addChild(modules.TimeColumn());
  var cols = overflow.addChild(modules.DayColumns(selections, date, getEvents, getWorkHours, bookingCB));
  container.setUpdateChildren(function(d) {
    overflow.removeChild(cols);
    cols = overflow.addChild(modules.DayColumns(d.selected, d.date, getEvents, getWorkHours, bookingCB));
    headerBar.setData(d.selected.getValues());
  });
  return container.getInterface();
};
