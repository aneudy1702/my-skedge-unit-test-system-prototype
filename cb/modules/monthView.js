/**
 * @param {!SK.NominalDate} d start date of month.
 * @param {function(?):?} getEvents get events cb.
 * @param {function(!SK.NominalDate):?} openDay
 * @return {!ModulerInterface}
 */
modules.MonthView = function(d, getEvents, openDay) {
  var month = new Moduler({date: d}, 'table', function(d, e, c) { 
    c.length = 0;
    return ''; 
  });
  month.addCSSClass('table table-bordered table-hover');
  month.setCSS({
    height: '100%',
    width: '100%',
    'table-layout': 'fixed'
  });
  month.setUpdateChildren(function(d) {
    var weeks = util.nominalDateWeeks(d.date, 6);
    var header = month.createChild('', 'thead').createChild('', 'tr');
    header.createChild('Sunday', 'th');
    header.createChild('Monday', 'th');
    header.createChild('Tuesday', 'th');
    header.createChild('Wednesday', 'th');
    header.createChild('Thursday', 'th');
    header.createChild('Friday', 'th');
    header.createChild('Saturday', 'th');
    util.map(weeks, function(w) {
      month.addChild(modules.MonthViewWeek(w, d.date.getMonth(), getEvents, openDay));
    });
  });
  month.setData({date: d});
  return month.getInterface();
};

modules.MonthViewWeek = function(ds, m, getEvents, openDay) {
  var week = new Moduler(ds, 'tr', function() { return ''; });
  week.setCSS({
    height: 100 / 6 + '%',
    overflow: 'hidden',
    'white-space': 'nowrap'
  });
  util.map(ds, function(d) {
    week.addChild(modules.DayBox(d, m, getEvents, openDay));
  });
  return week.getInterface();
};
