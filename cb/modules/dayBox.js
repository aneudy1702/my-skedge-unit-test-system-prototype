/**
 * @param {!SK.NominalDate} d date.
 * @param {!number} m month.
 * @param {function(?):?} getEvents get events cb.
 * @param {function(!SK.NominalDate):?} openDay
 * @return {!ModulerInterface} the box for this day.
 */
modules.DayBox = function(d, m, getEvents, openDay) {
  var td = new Moduler(d, 'td', function() { return ''; });
  td.setCSS({
    overflow: 'hidden',
    'white-space': 'nowrap'
  });
  var div = td.createChild('', 'div');
  div.setCSS({
    overflow: 'hidden',
    'white-space': 'nowrap'
  });
  // TODO: Add an "onDraw" to moduler to wrap up this kind of thing
  setTimeout(function() {
    var h = $(td.el()).height();
    div.setCSS({
      'max-height': h,
      'min-height': h
    });
  }, 200);
  // TODO: Move this resize into moduler
  $(window).resize(function() {
    td.setData(td.data());
  });
  td.setUpdateChildren(function() {
    div.setCSS({
      'max-height': 0,
      'min-height': 0
    });
    setTimeout(function() {
      var h = $(td.el()).height();
      div.setCSS({
        'max-height': h,
        'min-height': h
      });
    }, 200);
  });
  if (d.getMonth() !== m) {
    td.setCSS({
      background: 'lightgrey'
    });
  }
  var label = div.addChild(modules.DayBoxDateLabel(d, function() { openDay(d); }));
  var list;
  getEvents(intervalFromDates(d.toDate(), util.nominalAdd(d, 1).toDate())).then(function() {
    list = div.addChild(modules.DayBoxEventList(arguments[0]));
  });
  label.setCSS({
  });
  return td.getInterface();
};

modules.DayBoxDateLabel = function(d, cb) {
  var label = new Moduler(d, 'a', function(d) { 
    var date = d.getDate();
    if (date === 1) {
      return util.dateFormat(d, 'MMM d');
    }
    else {
      return d.getDate(); 
    }
  });
  label.onClick(function() {
    cb();
  });
  return label.getInterface();
};

modules.DayBoxEventList = function(es) {
  var list = new Moduler('', 'ul class="unstyled"', function(d, e, c) {
    c.length = 0;
    return '';
  });
  list.setUpdateChildren(function(d) {
    var occs = util.sortOccsByTime(util.map(d, function(e) { return e.occs(); }));
    util.map(occs, function(o) {
      return list.addChild(modules.DayBoxEvent(o));
    });
  });
  list.setData(es);
  return list.getInterface();
};

modules.DayBoxEvent = function(e) {
  var event = new Moduler('', 'li', function(d) {
    return '';
  });
  event.setUpdateChildren(function(d) {
    util.map(event.children(), function(c) { event.removeChild(c); });
    event.addChild(modules.DayBoxEventLink(e));
  });
  event.setData(e);
  return event.getInterface();
};

modules.DayBoxEventLink = function(e) {
  var a = new Moduler(e, 'a', function(d, el) {
    var dfy = new goog.i18n.DateTimeFormat('h:mma');
    var info = dfy.format(e.startTime()) + ' ' + e.event().summary();
    $(el).tooltip({
      title: info,
      placement: 'bottom'
    });
    util.popover($(el), e.event().summary(), modules.stub(e));
    return info;
  });
  a.setCSS({
    'font-size': '65%',
    display: 'block',
    'text-overflow': 'ellipsis',
    width: '100%',
    overflow: 'hidden',
    'white-space': 'nowrap'
  });
  return a.getInterface();
};
