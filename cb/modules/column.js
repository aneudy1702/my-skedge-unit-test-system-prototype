var exceptionsSample = { "changes": [ [ [ "2013-04-08T16:00:00Z", false ], true ], [ [ "2013-04-08T17:00:00Z", false ], null ], [ [ "2013-04-09T16:00:00Z", false ], false ], [ [ "2013-04-09T17:00:00Z", false ], null ], [ [ "2013-04-10T16:00:00Z", false ], true ], [ [ "2013-04-10T17:00:00Z", false ], false ], [ [ "2013-04-10T19:00:00Z", false ], true ], [ [ "2013-04-10T20:00:00Z", false ], null ] ], "initial": null };
/**
 * @param {!function(?):?} getEvents get events.
 * @param {!function(!SK.NominalDate, !number):?} getWorkHours Work Hours.
 * @param {!SK.NominalDate} date Date.
 * @param {!number} i Current column number.
 * @param {!number} total Total number of columns.
 * @param {function(!number, !number):?} cb Booking callback.
 * @return {!ModulerInterface}
 */
modules.Column = function(getEvents, getWorkHours, date, i, total, cb) {
  var col = new Moduler({avail: null}, 'div class="calColumn"', function(d) { return ''; });
  col.setCSS({
    width: (99 / total) + '%',
    left: (99 / total * i) + '%',
    position: 'absolute',
    height: boot.calendarHeight + '%',
    borderRightWidth: (i === total - 1 ? '1px' : '0px')
  });
  var workHoursLayer = col.addChild(modules.ColLayer(null, false, date.toDate(), util.nominalAdd(date, 1).toDate(), 'white'));
  getWorkHours(date, 1).then(function() {
    workHoursLayer.setData(arguments[0]);
  });
  col.addChild(modules.mkHourBoxes());
  var eventLayer = col.addChild(modules.EventLayer([], date.toDate()));
  var addEvents = function() {
    getEvents(intervalFromDates(date.toDate(), util.nominalAdd(date, 1).toDate())).then(function() {
      eventLayer.setData(arguments[0]);
    });
  };
  addEvents();
  //var exceptionLayer = col.addChild(modules.ExceptionLayer(date, exceptionsSample));
  //var availLayer = col.addChild(modules.ColLayer(null, true, util.sod(date), util.sod(util.addDays(date, 1)), 'steelblue', cb));
  col.setUpdateChildren(function(d, old) {
    eventLayer.setData([]);
    addEvents();
    getWorkHours(date, 1).then(function() {
      workHoursLayer.setData(arguments[0]);
    });
//    availLayer.setData(d.avail);
  });
  return col.getInterface();
};

modules.ExceptionLayer = function(date, exceptions) {
  var div = new Moduler(exceptions, 'div', function() { return ''; });
  div.setCSS({
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '100%',
    background: 'transparent'
  });
  var pxToDate = function(p) {
    return 86400000 / div.el().height() * p + util.sod(date).getTime();
  };
  var dateToPx = function(d) {
    return (d - util.sod(date).getTime()) * div.el().height() / 86400000;
  };
  var clickoverOpen = false;
  div.on('mousedown', function(e) {
    var x = div.createChild('', 'div');
    var mousedown = true;
    var top = e.pageY - div.el().offset().top;
    var topDate = new Date(pxToDate(top));
    x.setCSS({
      position: 'absolute',
      top: top,
      background: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAk' +
        'AAAAJCAYAAADgkQYQAAAARUlEQVQYV2Nsb2+vr6ysbGTAAkByQOEGRmySIDGYAp' +
        'yKkBWAbMEwCV0ByFQURdgUoCjCpQCuCJ8CsCJCCmCK/oO8iS+sAF6XLsYLY7B5A' +
        'AAAAElFTkSuQmCC) repeat',
      height: 0,
      width: '100%'
    });
    div.on('mousemove', function(z) {
      if (mousedown === true) {
        var bottom = z.pageY - div.el().offset().top;
        if (top < bottom) {
          x.setCSS({
            height: bottom - top
          });
        }
        else {
          x.setCSS({
            top: bottom,
            height: top - bottom
          });
        }
        console.log([top, new Date(pxToDate(top)), dateToPx(new Date(pxToDate(top)).getTime())]);
      }
    });
    div.on('mouseup', function() {
      mousedown = false;
      div.el().unbind('mouseup');
      div.el().unbind('mousemove');
      var options = modules.ExceptionOptions(function() {
        x.el().clickover('destroy');
        clickoverOpen = false;
        x.setCSS({
          background:'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAk' +
            'AAAAJCAYAAADgkQYQAAAATUlEQVQYV2OUeihV/0z+WSMDFgCSY/zP2MCITRIkB' +
            'lPwn/E/dkXICkC2YJiErgBkKooibApQFOFSAFeETwFYESEFYEXSD6T/g7yJL6w' +
            'A+qVFR/OYe+8AAAAASUVORK5CYII=) repeat'
        });
      },
      function() {
        x.el().clickover('destroy');
        clickoverOpen = false;
        x.setCSS({
          background:'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAk' +
            'AAAAJCAYAAADgkQYQAAAATUlEQVQYV2O8LyNTr/jkSSMDFgCS+8/I2MCITRIkB' +
            'lfw/z92RcgKQLZgmISuAGQqiiJsClAU4VIAV4RPAVgRIQVgRfdkZf8zAr2JL6w' +
            'AAiNFTfpK4uIAAAAASUVORK5CYII=) repeat'
        });
      });
      if (!clickoverOpen) {
        x.el().clickover({
          html: true,
          content: options.html(),
          global_close: false
        });
        x.el().clickover('show');
        clickoverOpen = true;
      }
    });
  });
  return div.getInterface();
};

modules.ExceptionOptions = function(avail, unavail) {
  var div = new Moduler('', 'div');
  div.addChild(modules.Button({text: 'Available', enabled: true}, 'btn-success', function() { avail(); }));
  div.addChild(modules.Button({text: 'Unavailable', enabled: true}, 'btn-danger', function() { unavail(); }));
  return div.getInterface();
};
