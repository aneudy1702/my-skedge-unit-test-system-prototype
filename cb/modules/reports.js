modules.ReportsModal = function(thingsByType, modalHolder, getEvents) {
  var page = new Moduler(thingsByType, 'div class="modal modal-large hide fade reportModal"', function() { return ''; }); //modal-large is in override.css
  var report;
  var header = page.createChild('', 'div class="modal-header"');
  var close = header.createChild('&times;', 'button type="button" class="close" data-dismiss="modal" ');
  header.createChild('Reports', 'h3');
  var body = page.createChild('', 'div class="modal-body"');
  var showReport = function(thingRefs, interval) {
    getEvents(thingRefs, interval).then(function() {
      if (report !== undefined) body.removeChild(report);
      report = body.addChild(modules.Report(arguments[0]));
     
     var dataTable = report.el().dataTable({
        "sDom" : 'fTti'
        , "bPaginate": false
        , "bLengthChange": false
        , "sScrollY":350
        , "oTableTools" : {
            "sSwfPath": "resources/js/DataTables/TableTools/swf/copy_csv_xls.swf"
            , "aButtons": [ "copy", "csv", "xls" ]
          }
        });
    });
  };
  var form = body.addChild(modules.ReportsForm(thingsByType, showReport));
  var footer = page.createChild('', 'div class="modal-footer"');
  var m;
  footer.addChild(modules.Button({text: 'Close', enabled: true}, 'btn', function() {
    m.modal('hide');
  }));
  close.onClick(function() {
    m.modal('hide');
  });
  m = page.el().modal({
    show: false,
    backdrop: true
  });
  m.on('hidden', function(){
    modalHolder.removeChild(page);
  });
  modalHolder.addChild(page);
  page.setUpdateChildren(function(d) {
    body.removeChild(form);
    form = body.addChild(modules.ReportsForm(d, showReport));
  });
  return page.getInterface();
};

modules.Report = function(events) {
  console.log(events);
  var table = new Moduler('', 'table class="table table-condensed table-hover"');
  var thead = table.createChild('', 'thead').createChild('', 'tr');
  thead.createChild('Event Name', 'th');
  //thead.createChild('Staff', 'th');
  //thead.createChild('Client', 'th');
  thead.createChild('Date', 'th');
  thead.createChild('Start Time', 'th');
  //thead.createChild('End Time', 'th');
  var tbody = table.createChild('', 'tbody');
  util.map(events, function(e) {
    util.map(e.occs(), function(o) {
      var tr = tbody.createChild('', 'tr');
      tr.createChild(e.summary(), 'td');
      tr.createChild(o.startTime(), 'td', function(d) {
        var dfy = new goog.i18n.DateTimeFormat('MMM d y');
        return dfy.format(d);
      });
      tr.createChild(o.startTime(), 'td', function(d) {
        var dfy = new goog.i18n.DateTimeFormat('h:mm a');
        return dfy.format(d);
      });
    });
  });
  return table.getInterface();
};

modules.ReportsForm = function(thingsByType, runReportCB) {
  var div = new Moduler('', 'div');
  var table = div.createChild('', 'table class="table"');
  var thead = table.createChild('', 'thead').createChild('', 'tr');
  var tbody = table.createChild('', 'tbody');
  var tr1 = tbody.createChild('', 'tr');
  var selectSources = util.map(thingsByType, function(t) {
    return {
      type: t.type,
      data: util.map(t.things, function(thing) {
        return {
          value: thing.ref().toJSON(),
          id: thing.ref().toJSON(),
          text: util.getThingName(thing)
        };
      })
    };
  });
  var refStrings = util.map(selectSources, function(s) {
    thead.createChild(s.type.name(), 'th');
    var td = tr1.createChild('', 'td');
    var e1 = td.createChild('', 'a href="#"');
    var e = undefined;
    if (s.data.length < 5) {
      e = e1.el().editable({
        type: 'checklist',
        value: [],
        source: s.data,
        emptytext: 'Any',
        onblur: 'submit'
      });
    }
    else {
      e = e1.el().editable({
        type: 'checklist',
        value: [],
        source: s.data,
        emptytext: 'Any',
        onblur: 'submit'
      });
    }
    var thingRefStrings = [];
    e.on('save', function(e, p) {
      var newRefs = p.newValue;
      thingRefStrings = p.newValue;
    });
    return function() {
      return thingRefStrings;
    };
  });
  thead.createChild('Start Date', 'th');
  var startDate = tr1.createChild('', 'td').createChild('', 'a href="#"');
  var eStart = startDate.el().editable({
    type: 'date',
    format: 'yyyy-mm-dd',
    viewformat: 'mm/dd/yyyy',
    datepicker: {
      weekStart: 1
    },
    emptytext: 'None',
    onblur: 'submit'
  });
  eStart.skValue = new goog.date.DateTime();
  eStart.on('save', function(e, p) {
    eStart.skValue = util.sod(util.addDays(new goog.date.DateTime(p.newValue), 1));
  });
  thead.createChild('End Date', 'th');
  var endDate = tr1.createChild('', 'td').createChild('', 'a href="#"');
  var eEnd = endDate.el().editable({
    type: 'date',
    format: 'yyyy-mm-dd',
    viewformat: 'mm/dd/yyyy',
    datepicker: {
      weekStart: 1
    },
    emptytext: 'None',
    onblur: 'submit'
  });
  eEnd.skValue = new goog.date.DateTime();
  eEnd.on('save', function(e, p) {
    eEnd.skValue = util.sod(util.addDays(new goog.date.DateTime(p.newValue), 1));
  });
  tbody.createChild('', 'tr').createChild('', 'td').addChild(modules.Button({text: 'Run Report', enabled: true}, 'btn-primary', function() {
    var thingRefs = util.map(goog.array.flatten(util.map(goog.array.flatten(refStrings), function(r) {
      return r();
    })), function(t) { return new SK.Thing.Ref(t); });
    var i = intervalFromDates(eStart.skValue, eEnd.skValue);
    runReportCB(thingRefs, i);
  }));
  return div.getInterface();
};
