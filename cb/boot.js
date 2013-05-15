var boot = {};
//boot.leftNavWidth = 15; // to be used as %
boot.timeColumnWidth = 5; //%
boot.navHeight = 40; // px
boot.footerHeight = 35; // px
boot.calendarHeight = 100; // %
boot.bookingMenuHeight = 150; //px

var m;
boot.strap2 = function() {
  server.getThingByRef(new SK.Thing.Ref('1')).then(function() {
    m = modules.LeftNavListItem(arguments[0], true, function(d) { console.log(d); });
    $('body').append(m.html());
  });
};
boot.strap = function() {
  var app = {};
  app.container = new Moduler('', 'div');
  $('body').append(app.container.html());
  app.modal = app.container.createChild('', 'div');
  app.top = app.container.createChild('', 'div');
  app.top.addCSSClass('navbar navbar-fixed-top topBar');
  app.top.setCSS({ height: boot.navHeight });
  app.left = app.container.createChild('', 'div');
  app.leftWidth = '200px';
  app.left.setCSS({
    position: 'absolute',
    width: app.leftWidth,
    top: boot.navHeight,
    left: 0,
    bottom: boot.footerHeight
  });
  app.right = app.container.createChild('', 'div');
  app.right.setCSS({
    position: 'absolute',
    left: app.leftWidth,
    right: 0,
    top: boot.navHeight,
    bottom: 0
  });

  var nav, leftNav, calendar, footer, drawCalendar;

  /* Callbacks */
  var changeDateCB, selectionCB, getThingsCB, servicesCB, serviceSaveCB,
      reportsCB, eventsForThingsCB, viewChangeCB, bookingCB, workHoursCB,
      eventsForThingCB, workHoursForThingCB, openDayCB;

  changeDateCB = function(d) {
    var x = calendar.data();
    x.date = d;
    calendar.setData(x);
  };
  selectionCB = function(s) {
    if (config.view === 'Day') {
      var x = calendar.data();
      x.selected = leftNav.data().selected;
      calendar.setData(x);
    }
    else {
      calendar.setData(calendar.data());
    }
  };
  getThingsCB = function() {
    return server.getThingsAndTypes().then(function() {
      var things = goog.array.filter(arguments[0], function(t) {
        return t.type.name() !== config.customerThingTypeName;
      });
      return things;
    });
  };
  servicesCB = function() {
    return server.getServices().then(function() {
      var s = modules.ServicesModal(arguments[0], app.modal, function(s) {
        serviceSaveCB(s);
      });
      s.el().modal('toggle');
    });
  };
  serviceSaveCB = function(s) {
    console.log(s);
  };
  reportsCB = function() {
    var r = modules.ReportsModal([], app.modal, function(trs, i) {
      if (trs.length && trs.length > 0) {
        return server.getEvents(trs, i);
      }
      else {
        return server.getThings().then(function() {
          return server.getEventsByThings(arguments[0], i);
        });
      }
    });
    server.getThingsAndTypes().then(function() {
      r.setData(arguments[0]);
    });
    r.el().modal('toggle');
  };
  eventsForThingsCB = function(i) {
    return server.getEventsByThings(leftNav.data().selected.getValues(), i);
  };
  eventsForThingCB = function(thing, i) {
    return server.getEventsByThings([thing], i);
  };
  viewChangeCB = function(newView) {
    config.view = newView;
    switch (newView) {
      case 'Month':
        nav.setData({date: util.nominalStartOfMonth(nav.data().date), view: newView});
        break;
      case 'Week':
        nav.setData({date: util.nominalStartOfWeek(nav.data().date), view: newView});
        break;
      default:
        break;
    }
    nav.setData({date: nav.data().date, view: newView});
    drawCalendar(newView);
  };
  bookingCB = function() {
    console.log('booking');
  };
  workHoursCB = function(date, numDays) {
    return server.getScheduleAvailability(intervalFromDates(date.toDate(), util.nominalAdd(date, numDays).toDate()), leftNav.data().selected);
  };
  workHoursForThingCB = function(thing, date, numDays) {
    return server.getScheduleAvailability(intervalFromDates(date.toDate(), util.nominalAdd(date, numDays).toDate()), new SK.Set([thing]));
  };
  openDayCB = function(date) {
    nav.setData({date: date, view: 'Day'});
    viewChangeCB('Day');
  };

  /* Components */
  nav = modules.Nav(util.getStartDate(config.view, config.timezone), config.view, function(d) {
    changeDateCB(d);
  }, function(v) {
    viewChangeCB(v);
  });
  app.top.addChild(nav);

  leftNav = modules.LeftNav([], new SK.Set([]), function(d) {
    return selectionCB(d);
  }, function() {
    return getThingsCB();
  });
  app.left.addChild(leftNav);

  drawCalendar = function(v) {
    if (calendar !== undefined) {
      app.right.removeChild(calendar);
    }
    switch (v) {
      case 'Month':
        calendar = modules.MonthView(nav.data().date, eventsForThingsCB, openDayCB);
        break;
      case 'Week':
        calendar = modules.WeekView(eventsForThingsCB, workHoursCB, nav.data().date, 7, bookingCB, openDayCB);
        break;
      case 'Day':
        calendar = modules.DayView(leftNav.data().selected, nav.data().date, eventsForThingCB, workHoursForThingCB, bookingCB);
        break;
      default:
        break;
    }
    app.right.addChild(calendar);
  };
  drawCalendar(config.view);

  footer = modules.Footer(app.modal, function() { 
    reportsCB(); 
  }, function() {
    servicesCB();
  });
  app.container.addChild(footer);
};
