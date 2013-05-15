/**
 * @param {!Array.<!SK.Service.Service>} services Current services.
 * @param {!Moduler} modalHolder Container for modals.
 * @param {function(?):?} saveCB Callback on save changes.
 * @return {!ModulerInterface} Modal contents
 */
modules.ServicesModal = function(services, modalHolder, saveCB) {
  var page = new Moduler('', 'div class="modal modal-large hide fade"');   
  var header = page.createChild('', 'div class="modal-header"');
  header.createChild('&times;', 'button type="button" class="close" data-dismiss="modal" ');
  header.createChild('Services', 'h3');
  var body = page.createChild('', 'div class="modal-body"');
  var serviceDivs = util.map(services, function(s) { return body.addChild(modules.serviceDisplay(s)); });
  var footer = page.createChild('', 'div class="modal-footer"');
//  footer.addChild(modules.Button({text: '<i class="icon-list-alt"></i> New Service', enabled: true}, 'btn-success pull-left', function() {
//    body.addChild(modules.ServiceTable({
//      name: ''
//    }));
//  }));
  footer.addChild(modules.Button({text: 'Cancel', enabled: true}, 'btn', function() {
    page.el().modal('hide');
  }));
  footer.addChild(modules.Button({text: 'Save Changes', enabled: true}, 'btn-primary', function() {
    page.el().modal('hide');
  }));
  page.el().modal({
    show: false,
    backdrop: true
  });
  page.el().on('hidden', function(){
    modalHolder.removeChild(page);
  });
  modalHolder.addChild(page);
  return page.getInterface();
};

/**
 * @param {SK.Service.Service} s The service to display.
 * @return {!ModulerInterface} interface for one service
 */
modules.serviceDisplay = function(s) {
  var container = new Moduler(s, 'div', function() { return ''; });
  var header = container.createChild(s, 'h1', function(d) { return d.name(); });
  var generalContainer = container.createChild('', 'div class="well"');
  var generalSchema = generalContainer.addChild(modules.generalSchema(s.generalSchema()));
  var alternativeContainer = container.createChild('', 'div class="well"');
  var alternativeSchemas = alternativeContainer.addChild(modules.alternativeSchemas(s.alternativeSchemas()));
  container.setUpdateChildren(function(d) {
    header.setData(d);
    generalSchema.setData(d.generalSchema());
    alternativeSchemas.setData(d.alternativeSchemas());
  });
  return container.getInterface();
};

/**
 * @param {!Object} s General schema.
 * @return {!ModulerInterface} interface for generalSchema
 */
modules.generalSchema = function(s) {
  var div = new Moduler(s, 'div', function() { return ''; });
  div.createChild('General Schema', 'h2');
  var table = div.createChild(s, 'table class="table table-bordered"', function(d, e, c) { c.length = 0; return ''; });
  var addRows = function(gs) {
    if (gs.time !== null) {
      table.addChild(modules.generalSchemaTableRow(gs.time, function(t) { return 'Time:'; }, function(t) { return modules.serviceTime(t); }));
    }
    util.map(gs.roles, function(r) {
      table.addChild(modules.generalSchemaTableRow(r,
                                                   function(role) { return role.role.name() + ':'; },
                                                   function(role) { return modules.thingFieldsList(role); }));
    }); 
  };
  addRows(s);
  div.setUpdateChildren(function(d) {
    table.setData(d);
    addRows(d);
  });
  return div.getInterface();
};

/**
 * @param {?} d Some data, probably a field or time object
 * @param {function(?):string} lf Function to turn data into a label
 * @param {function(?):ModulerInterface} vf Function to turn data into a ModulerInterface
 * @return {!ModulerInterface} interface for one general schema row
 */
modules.generalSchemaTableRow = function(d, lf, vf) {
  var row = new Moduler(d, 'tr', function() { return ''; });
  var label = row.createChild(d, 'td', function(d) { return lf(d); });
  var value = row.createChild(d, 'td', function(d) { return ''; }).addChild(vf(d));
  row.setUpdateChildren(function(d) {
    label.setData(d);
    value.setData(d);
  });
  return row.getInterface();
};

/**
 * @param {!{time: {length: number, startTimes: Array.<Array.<number>>}}} t The "time" object.
 * @return {!ModulerInterface} interface for container of service time widgets.
 */
modules.serviceTime = function(t) {
  /* TODO: Service time is null or an object with the following structure:
   *
                       "time": {
                         "length": 3600000, //ms
                         "startTimes": [
                            [
                                0, //mins
                                0, //sec
                                0  //ms
                            ], 
                            [
                                15, 
                                0, 
                                0
                            ], 
                            [
                                30, 
                                0, 
                                0
                            ], 
                            [
                                45, 
                                0, 
                                0
                            ]
                         ]
                       }
    * Need to have a widget for showing/changing the length and the startTimes. Each should be a module.
    */
  var div = new Moduler(t, 'div', function(d) { return util.stringify(t); });
  return div.getInterface();
};

/**
 * @param {!{role: !SK.Role.Role, existing: !boolean, fields: !Array, things: !Array}} role Service role object.
 * @return {!ModulerInterface}
 */
modules.thingFieldsList = function(role) {
  var fs = role.fields;
  var div = new Moduler(fs, 'ul', function() { return 'Fields for ' + role.role.name() + ':'; });
  util.map(fs, function(f) { div.addChild(modules.thingFieldsListItem(f)); });
  return div.getInterface();
};

/**
 * @param {!SK.ThingField.ThingField} f A thingField.
 * @return {!ModulerInterface}
 */
modules.thingFieldsListItem = function(f) {
  var li = new Moduler(f, 'li', function(d) {
    return f.name();
  });
  return li.getInterface();
};

/**
 * @param {!Array} as Alternative schemas.
 * @return {!ModulerInterface}
 */
modules.alternativeSchemas = function(as) {
  var div = new Moduler(as, 'div', function() { return ''; });
  div.createChild('Alternative Schemas', 'h2');
  var table = div.createChild(as, 'table class="table table-bordered"', function(d, e, c) { c.length = 0; return ''; });
  var tableHeader = table.createChild('', 'thead').createChild('', 'tr');
  if (as['alternatives'].length > 0) {
    if (as['alternatives'][0].time !== null) {
      tableHeader.createChild('Time', 'th');
    }
    util.map(as['alternatives'][0].roles, function(r) {
      tableHeader.createChild(r.role.role, 'th', function(d) { return d.name(); });
    });
  }
  var rows = util.map(as['alternatives'], function(a) {
    return table.addChild(modules.alternativeSchemaRow(a, util.map(tableHeader.children(), function(h) { return h.data(); })));
  });
  return div.getInterface();
};

modules.alternativeSchemaRow = function(a, headers) {
  var tr = new Moduler({alternative: a, headers: headers}, 'tr', function() { return ''; });
  var createRow = function(hs, alt) {
    util.map(hs, function(h) {
      if (h === 'Time') {
        tr.createChild(alt.time, 'td', function() { return ''; }).addChild(modules.serviceTime(alt.time));
      }
      else if (h.constructor === SK.Role.Role) {
        var role = goog.array.find(alt.roles, function(r) {
          return r.role.role.ref().value === h.ref().value;
        });
        if (role.existing === true) {
          tr.createChild(role, 'td', function() { return ''; }).addChild(modules.thingList(role.things));
        }
        console.log(role);
      }
    });
  };
  createRow(headers, a);
  return tr.getInterface();
};

modules.thingList = function(ts) {
  var ul = new Moduler(ts, 'div', function() { return ''; });
  util.map(ts, function(t) {
    return ul.addChild(modules.thingListItem(t));
  });
  return ul.getInterface();
};

modules.thingListItem = function(t) {
  var li = new Moduler(t, 'p', function() { return t.value; });
  return li.getInterface();
};
