/**
 * @param {!function(?):?} getEvents get events.
 * @param {!function(!SK.NominalDate, !number):?} getWorkHours workHours.
 * @param {!SK.NominalDate} startDate Current start date.
 * @param {!number} numDays number of days.
 * @param {function(!number, !number): ?} cb Booking callback.
 * @param {function(!SK.NominalDate):?} openDay
 * @return {!ModulerInterface}
 */
modules.WeekView = function(getEvents, getWorkHours, startDate, numDays, cb, openDay) {
  var currentDate = startDate;
  var container = new Moduler({date: startDate, avail: null}, 'div', function(d) {
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
  var hDates = function(d) {
    return util.map(util.range(0, numDays, 1), function(i) {
        return util.nominalAdd(d, i); 
    });
  };
  var header = container.createChild(startDate, 'div', function(d) {return '';});
  header.setCSS({
    position: 'absolute',
    height: '100%',
    left: boot.timeColumnWidth + '%',
    right: '1em'
  });
  var hDraw = function(d) {
    return modules.headerBarDate(d, openDay);
  };
  var headerBar = header.addChild(modules.HeaderBar(hDates(startDate), hDraw));
  header.setUpdateChildren(function(d) {
    headerBar.setData(hDates(d));
  });
  var overflow = container.createChild(container.data(), 'div class="viewContainer"', function(d) { return ''; });
  overflow.setCSS({
    position: 'absolute',
    width: '100%',
    overflow: 'auto',
    top: '2em',
    bottom: 0
  });
  overflow.addChild(modules.TimeColumn());
  var weekCols = overflow.addChild(modules.Columns(null, getEvents, getWorkHours, startDate, numDays, cb));
  overflow.setUpdateChildren(function(d) {
    weekCols.setData(d);
  });
  container.setUpdateChildren(function(d) {
    header.setData(d.date);
    if (d.date !== currentDate) {
      overflow.removeChild(weekCols);
      weekCols = overflow.addChild(modules.Columns(d.avail, getEvents, getWorkHours, d.date, numDays, cb));
      currentDate = d.date;
    }
    else {
      overflow.setData(d);
    }
  });
  return container.getInterface();
};

