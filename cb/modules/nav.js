/**
 * @param {!SK.NominalDate} date
 * @param {!string} view
 * @param {function(!SK.NominalDate):?} cb date change cb
 * @param {function(!string):?} viewChange view change cb
 * @return {!ModulerInterface}
 */
modules.Nav = function(date, view, cb, viewChange) {
  var navbar = new Moduler({date: date, view: view}, 'div class="navbar calendarNav affix"', function() { return '';});
  var nav = navbar.createChild('', 'ul class="timeNav nav"');
  var viewSwitcher = navbar.addChild(modules.ViewNav(view, viewChange));
  var dateLabel = nav.addChild(modules.DateLabel(date, view, function(d) {
    navbar.setData(d);
    if (view === 'Month') {
      cb(util.nominalStartOfMonth(d.date));
    }
  }));
  var previous = nav.createChild('', 'li class="prev"').createChild('', 'a').createChild('', 'i class="icon-caret-left"');
  var next = nav.createChild('', 'li class="next"').createChild('', 'a').createChild('', 'i class="icon-caret-right"');
  navbar.setUpdateChildren(function(d) {
    viewSwitcher.setData(d.view);
    dateLabel.setData(d);
  });
  var changeDate = function(sign) {
    var newDate = navbar.data().date;
    if (navbar.data().view === 'Week') {
      newDate = util.nominalAdd(navbar.data().date, sign * 7);
      navbar.setData({date: newDate, view: 'Week'});
    }
    else if (navbar.data().view === 'Month') {
      var oldDate = navbar.data().date;
      newDate = util.dateToNominalDate(util.addMonths(oldDate.toDate(), sign * 1));
      navbar.setData({date: newDate, view: 'Month'});
    }
    else if (navbar.data().view === 'Day') {
      newDate = util.nominalAdd(navbar.data().date, sign * 1);
      navbar.setData({date: newDate, view: 'Day'});
    }
    cb(newDate);
  };
  previous.onClick(function() {
    changeDate(-1);
  });
  next.onClick(function() {
    changeDate(1);
  });
  return navbar.getInterface();
};

/**
 * @param {!SK.NominalDate} date Starting date.
 * @param {!string} view
 * @param {function(!SK.NominalDate): ?} cb Callback.
 * @return {!ModulerInterface} Interface for datelabel and associated datepicker.
 */
modules.DateLabel = function(date, view, cb) {
  var container = new Moduler({date: date, view: view}, 'li', function(d) { return ''; });
  var dfy, df;
  var dateLabel = container.createChild({date: date, view: view}, 'a', function(d) {
    if (d.view === 'Day') {
      dfy = new goog.i18n.DateTimeFormat('EEEE MMM d, y');
      return dfy.format(d.date.toDate());
    }
    else if (d.view === 'Week') {
      df = new goog.i18n.DateTimeFormat('MMM d');
      dfy = new goog.i18n.DateTimeFormat('MMM d y');
      return df.format(util.sow(d.date.toDate())) + ' to ' + dfy.format(util.addDays(util.sow(d.date.toDate()), 6));
    }
    else if (d.view === 'Month') {
      df = new goog.i18n.DateTimeFormat('MMMM yyyy');
      return df.format(d.date.toDate());
    }
    else {
      return '';
    }
  });
  dateLabel.setCSS({
    width: '12em',
    'text-align': 'center'
  });
  var dp;
  /** @type {function(SK.NominalDate=):undefined} */
  var addDatePicker = function(d) {
    if (dp !== undefined) {
      dp.datepicker('remove');
    }
    dp = $(container.el()).datepicker({
      todayBtn: 'linked',
      todayHighlight: true
    });
    if (d !== undefined) {
      $(container.el()).data('datepicker').setDate(new Date(d.date.toDate().getTime()));
      $(container.el()).datepicker('update');
    }
    dp.on('changeDate', function(e) {
      var n = new goog.date.DateTime();
      n.setTime(e.date.valueOf());
      var newDate = new SK.NominalDate(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
      container.setData({date: newDate, view: container.data().view});
    });
  };
  addDatePicker();
  var dpShow = false;
  container.onClick(function() {
    if (dpShow) {
      dp.datepicker('hide');
      dpShow = false;
    }
    else {
      dp.datepicker('show');
      dpShow = true;
    }
  });
  container.setUpdateChildren(function(d, old) {
    if(d !== old) {
      dateLabel.setData(d);
      addDatePicker(d);
      cb(d);
    }
  });
  var open = false;
  return container.getInterface();
};

modules.DatePicker = function(d) {

};
