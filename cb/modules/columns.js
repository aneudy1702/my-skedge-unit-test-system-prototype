/** 
 * @param {Object} avail Availability.
 * @param {!function(?):?} getEvents events cb.
 * @param {!function(!SK.NominalDate, !number):?} getWorkHours workHours
 * @param {!SK.NominalDate} startDate Start date.
 * @param {!number} numDays Number of days in set.
 * @param {function(!number, !number): ?} cb Booking callback.
 * @return {!ModulerInterface}
 */
modules.Columns = function(avail, getEvents, getWorkHours, startDate, numDays, cb) {
  var colSet = new Moduler({avail: avail}, 'div', function(d) { return ''; });
  colSet.setCSS({
    position: 'absolute',
    height: '100%',
    right: 0,
    left: boot.timeColumnWidth + '%'
  });
  var cols = util.map(util.range(0, numDays, 1), function(i) {
    return colSet.addChild(modules.Column(getEvents, getWorkHours, util.nominalAdd(startDate, i), i, numDays, cb));
  });
  colSet.setUpdateChildren(function(d) {
    util.map(cols, function(c) { c.setData(d); });
  });
  colSet.setData(colSet.data());
  return colSet.getInterface();
};

/**
 * @param {!SK.Set} selections selected things.
 * @param {!SK.NominalDate} date
 * @param {!function(!SK.Thing.Thing, !SK.Interval):?} getEvents
 * @param {!function(!SK.Thing.Thing, !SK.NominalDate, !number):?} getWorkHours
 * @param {!function(?, ?):?} bookingCB
 * @return {!ModulerInterface}
 */
modules.DayColumns = function(selections, date, getEvents, getWorkHours, bookingCB) {
  var div = new Moduler({selected: selections, date: date}, 'div', function(d, e, c) {
    c.length = 0;
    return '';
  });
  div.setCSS({
    position: 'absolute',
    height: '100%',
    right: 0,
    left: boot.timeColumnWidth + '%'
  });
  var cols;
  var update = function() {
    var cs = util.map(div.data().selected.getValues(), function(s, n, ss) {
      var sGetEvents = function(i) {
        return getEvents(s, i);
      };
      var sGetWorkHours = function(date, numDays) {
        return getWorkHours(s, date, numDays);
      };
      return div.addChild(modules.Column(sGetEvents, sGetWorkHours, date, n, ss.length, bookingCB));
    });
    return cs;
  };
  cols = update();
  div.setUpdateChildren(function(d) {
    cols = update();
  });
  return div.getInterface();
};
