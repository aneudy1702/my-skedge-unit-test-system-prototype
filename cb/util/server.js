var server = {};
server.address = "";
server.token = "U28Oe_27ScK5dt7-KzwSWA==";

/** @type {function(Array):jQuery.Promise} */
server.sequence = function(promiseArray) {
  return $.when.apply($, promiseArray).then(function() { 
    return arguments;
  });
};
/** @type {function(string, ?):jQuery.jqXHR} */
server.getRefs = function(identifier, Type) {
  var envelope = goog.json.serialize({
    request: ["any", []],
    token: server.token
  });
  return $.ajax({
    type: 'GET',
    url: server.address + '/' + identifier + '/find?q=' + envelope
  }).then(function() {
    return $.map(goog.json.parse(arguments[2].responseText), function(x) {
      return new Type(x);
    });
  });
};
/** @type {function(!SK.Ref, !string, ?, ?=, ?=, ?=):jQuery.jqXHR} */
server.getByRef = function(ref, path, Type, fields, roles, things) {
  var envelope = {
    request: ref.toJSON(),
    token: server.token
  };
  return $.ajax({
    type: 'GET',
    url: server.address + '/' + path + '/get?q=' + goog.json.serialize(envelope)
  }).then(function() {
    var x = goog.json.parse(arguments[2].responseText);
    x.ref = ref;
    if (fields !== undefined) {
      $.map(x.fields, function(v, fieldRef) {
        x.fields[fieldRef].thingField = goog.array.find(fields, function(f) {
          return f.ref().toJSON() === fieldRef;
        });
      });
    }
    if (roles !== undefined) {
      $.map(x.roles, function(v, roleRef) {
        x.roles[roleRef].role = goog.array.find(roles, function(r) {
          return r.ref().toJSON() === roleRef;
        });
      });
    }
    if (things !== undefined) {
      $.map(x.roles, function(v, roleRef) {
        x.roles[roleRef].things = goog.array.filter(things, function(t) {
          return v[1].hasOwnProperty(t.ref().toJSON());
        });
      });
    }
    return new Type(x);
  });
};
/** @type {function(!Array.<!SK.Ref>):jQuery.Promise} */
server.getByRefs = function(refs, path, type) {
  return server.sequence($.map(refs, function(r) {
    return server.getByRef(r, path, type);
  }));
};
/** @type {function(function():?, function(?):?):jQuery.jqXHR} */
server.getAll = function(getRefs, getOne) {
  return getRefs().then(function() {
    return goog.array.map(arguments[0], function(r) {
      return getOne(r);
    });
  }).then(function() {
    return server.sequence(arguments[0]);
  });
};
/**
 * "Caching"
 */
var things;
var thingFields;
var roles;
var serviceFields;
/**
 * Things
 */
/** @type {function():jQuery.jqXHR} */
server.getThingRefs = function() {
  return server.getRefs('thing', SK.Thing.Ref);
};
/** @type {function(!SK.Thing.Ref):(jQuery.jqXHR|jQuery.Promise)} */
server.getThingByRef = function(ref) {
  if (thingFields === undefined) {
    return server.getThingFields().then(function() {
      thingFields = arguments[0];
      return server.getByRef(ref, 'thing', SK.Thing.Thing, arguments[0]);
    });
  }
  else {
    return server.getByRef(ref, 'thing', SK.Thing.Thing, thingFields);
  }
};
/** @type {function():jQuery.Promise} */
server.getThings = function() {
  return server.getAll(server.getThingRefs, server.getThingByRef);
};
/** @type {function(!SK.ThingType.ThingType):jQuery.jqXHR} */
server.getThingRefsByThingType = function(type) {
  var envelope = goog.json.serialize({
    request: ["ref", [type.toJSON()['value']]],
    token: server.token
  });
  return $.ajax({
    type: 'GET',
    url: server.address + '/thing/find?q=' + envelope
  }).then(function() {
    return $.map(goog.json.parse(arguments[2].responseText), function(x) {
      return new SK.Thing.Ref(x);
    });
  });
};
/** @type {function(!SK.ThingType.ThingType):jQuery.jqXHR} */
server.getThingsForThingType = function(type) {
  return server.getThingRefsByThingType(type).then(function() {
    return server.sequence($.map(arguments[0], function(ref) {
      return server.getThingByRef(ref);
    }));
  });
};
/** @type {function():jQuery.Promise} */
server.getThingsAndTypes = function() {
  return server.getThingTypes().then(function() {
    return server.sequence($.map(arguments[0], function(type) {
      return server.getThingsForThingType(type).then(function() {
        return {
          type: type,
          things: arguments[0]
        };
      });
    }));
  });
};
/**
 * ThingTypes
 */
/** @type {function():jQuery.jqXHR} */
server.getThingTypeRefs = function() {
  return server.getRefs('thingType', SK.ThingType.Ref);
};
/** @type {function(!SK.ThingType.Ref):jQuery.jqXHR} */
server.getThingTypeByRef = function(ref) {
  return server.getByRef(ref, 'thingType', SK.ThingType.ThingType);
};
/** @type {function():jQuery.Promise} */
server.getThingTypes = function() {
  return server.getAll(server.getThingTypeRefs, server.getThingTypeByRef);
};
/**
 * ThingFields
 */
/** @type {function():jQuery.jqXHR} */
server.getThingFieldRefs = function() {
  return server.getRefs('thingField', SK.ThingField.Ref);
};
/** @type {function(!SK.ThingField.Ref):jQuery.jqXHR} */
server.getThingFieldByRef = function(ref) {
  return server.getByRef(ref, 'thingField', SK.ThingField.ThingField);
};
/** @type {function():jQuery.Promise} */
server.getThingFields = function() {
  return server.getAll(server.getThingFieldRefs, server.getThingFieldByRef);
};
/**
 * ServiceFields 
 */
/** @type {function():jQuery.jqXHR} */
server.getServiceFieldRefs = function() {
  return server.getRefs('serviceField', SK.ServiceField.Ref);
};
/** @type {function(!SK.ServiceField.Ref):jQuery.jqXHR} */
server.getServiceFieldByRef = function(ref) {
  return server.getByRef(ref, 'serviceField', SK.ServiceField.ServiceField);
};
/** @type {function():jQuery.Promise} */
server.getServiceFields = function() {
  return server.getAll(server.getServiceFieldRefs, server.getServiceFieldByRef);
};
/**
 * AttendeeFields
 */
/** @type {function():jQuery.jqXHR} */
server.getAttendeeFieldRefs = function() {
  return server.getRefs('attendeeField', SK.AttendeeField.Ref);
};
/** @type {function(!SK.AttendeeField.Ref):jQuery.jqXHR} */
server.getAttendeeFieldByRef = function(ref) {
  return server.getByRef(ref, 'attendeeField', SK.AttendeeField.AttendeeField);
};
/** @type {function():jQuery.Promise} */
server.getAttendeeFields = function() {
  return server.getAll(server.getAttendeeFieldRefs, server.getAttendeeFieldByRef);
};
/**
 * Events
 */
/** @type {function(!Array.<SK.Thing.Ref>, !SK.Interval):jQuery.jqXHR} */
server.getEvents = function(ts, i) {
  var envelope = goog.json.serialize({
    request: {
      things: util.map(ts, function(t) { return t.toJSON(); }),
      time: intervalToJSON(i)
    },
    token: server.token
  });
  return $.ajax({
    type: 'GET',
    url: server.address + '/event/find?q=' + envelope
  }).then(function() {
    var r = goog.json.parse(arguments[2].responseText);
    var events = $.map(r.events, function(e, ref) {
      var event;
      e[0].ref = new SK.Event.Ref(ref);
      event = new SK.Event.Event(e);
      var occs = util.map(e[1], function(o) {
        return new SK.Occ.Occ(o, event);
      });
      event.value[1] = occs;
      return event;
    });
    return events;
  });
};
///** @type {function(!SK.Event.Ref):jQuery.jqXHR} */
//server.getEventByRef = function(ref) {
//  return server.getByRef(ref, 'event', SK.Event.Event);
//};
///** @type {function(Array.<SK.Thing.Ref>, SK.Interval):jQuery.Promise} */
//server.getEventsByThingRefs = function(ts, i) {
//  return server.getEventRefs(ts, i).then(function() {
//    return goog.array.map(arguments[0], function(r) {
//      return server.getEventByRef(r);
//    });
//  }).then(function() {
//    return server.sequence(arguments[0]);
//  });
//};
/** @type {function(!Array.<SK.Thing.Thing>, !SK.Interval):jQuery.Promise} */
server.getEventsByThings = function(ts, i) {
  return server.getEvents(goog.array.map(ts, function(t) { return t.ref(); }), i);
};
//
/**
 * Roles
 */
/** @type {function():jQuery.jqXHR} */
server.getRoleRefs = function() {
  return server.getRefs('role', SK.Role.Ref);
};
/** @type {function(!SK.Role.Ref):jQuery.jqXHR} */
server.getRoleByRef = function(ref) {
  return server.getByRef(ref, 'role', SK.Role.Role);
};
/** @type {function():jQuery.Promise} */
server.getRoles = function() {
  return server.getAll(server.getRoleRefs, server.getRoleByRef);
};
/**
 * Sevices
 */
/** @type {function():jQuery.jqXHR} */
server.getServiceRefs = function() {
  return server.getRefs('service', SK.Service.Ref);
};
/** @type {function(!SK.Service.Ref):jQuery.Promise} */
server.getServiceByRef = function(ref) {
  var envelope = {
    request: ref.toJSON(),
    token: server.token
  };
  var get = function() {
    return $.ajax({
      type: 'GET',
      url: server.address + '/' + 'service' + '/get?q=' + goog.json.serialize(envelope)
    }).then(function() {
      var x = goog.json.parse(arguments[2].responseText);
      x.ref = ref;
      $.map(x['eventSource'][1]['general']['roles'], function(r, rref) {
        r.role = goog.array.find(roles, function(x) { return x.ref().value === rref; });
        if (r['thingSource'][0] === 'new') {
          var fields = $.map(r['thingSource'][1]['fields'], function(field) {
            return goog.array.find(thingFields, function(f) { return f.ref().value === field; });
          });
          r['thingSource'][1]['fields'] = fields;
        }
      });
      $.map(x['eventSource'][1]['alternatives'], function (a) {
        $.map(a['roles'], function(r, rref) {
          r.role = goog.array.find(roles, function(x) { return x.ref().value === rref; });
          if (r['thingSource'][0] === 'new') {
            var fields = $.map(r['thingSource'][1]['fields'], function(field) {
              return goog.array.find(thingFields, function(f) { return f.ref().value === field; });
            });
            r['thingSource'][1]['fields'] = fields;
          }
        });
      });
      return new SK.Service.Service(x);
    });
  };
  if (roles !== undefined && thingFields !== undefined && serviceFields !== undefined) {
    return get();
  }
  else {
    return server.updateCache().then(function() { return get(); });
  }
  //return server.getByRef(ref, 'service', SK.Service.Service);
};
/** @type {function():jQuery.Promise} */
server.getServices = function() {
  return server.getAll(server.getServiceRefs, server.getServiceByRef);
};

/** @type {function(SK.Event.Ref, SK.Role.Ref, SK.Thing.Ref): jQuery.jqXHR} */
server.addAttendee = function(e, r, t) {
  return $.ajax({
    type: 'POST',
    data: goog.json.serialize({
      request: {
        event: e.toJSON(),
        role: r.toJSON(),
        thing: t.toJSON()
      },
      token: server.token 
    }),
    url: server.address + '/event/addAttendee'
  });
};

/** @type {function(SK.Event.Ref): jQuery.jqXHR} */
server.deleteEvent = function(e) {
  return $.ajax({
    type: 'POST',
    data: goog.json.serialize({
      request: e.toJSON(),
      token: server.token
    }),
    url: server.address + '/event/delete'
  });
};

/**
 * @param {!SK.Interval} i interval to show availability for.
 * @param {!SK.Set} things Set of things.
 */
server.getScheduleAvailability = function(i, things) {
  var envelope = goog.json.serialize({
    request: {
      scheduleConstraint: ["in", [goog.array.map(things.getValues(), function(s) { return s.ref().toJSON(); })]],
      range: intervalToJSON(i)
    },
    token: server.token
  });
  return $.ajax({
    type: 'GET',
    url: server.address + '/schedule/availability?q=' + envelope
  }).then(function() {
    return goog.json.parse(arguments[2].responseText);
  });
};

/** @type {function(): jQuery.jqXHR} */
server.getServiceDurations = function() {
  var envelope = goog.json.serialize({
    request: ['any', []],
    token: server.token
  });
  return $.ajax({
    type: 'GET',
    url: server.address + '/service/getServiceDurations?q=' + envelope
  }).then(function() {
    return $.map(goog.json.parse(arguments[2].responseText), function(pair) {
      return {
        service: new SK.Service.Ref(pair[0]),
        duration: pair[1]
      };
    });
  });
};

/** @type {function(SK.Service.Service, !number, !SK.Interval):jQuery.jqXHR} */
server.getAvailableCreationTimes = function(s, length, i) {
  var envelope = goog.json.serialize({
    request: {
      service: s.ref().toJSON(),
      length: length,
      range: intervalToJSON(i),
      overridePadding: false
    },
    token: server.token
  });
  return $.ajax({
    type: 'GET',
    url: server.address + '/service/getAvailableCreationTimes?q=' + envelope
  }).then(function() {
    return $.map(goog.json.parse(arguments[2].responseText), function(t) {
      return goog.date.DateTime.fromRfc822String(t);
    });
  });
};

/** @type {function(SK.Service.Service, goog.date.DateTime, number, (goog.date.DateTime|null)):jQuery.jqXHR} */
server.createTentativeEvent = function(s, time, ms, exp) {
  var endTime = new goog.date.DateTime();
  endTime.setTime(time.getTime() + ms);
  var expirationTime = new Date();
  expirationTime.setSeconds(expirationTime.getSeconds() + 300);
  var envelope = goog.json.serialize({
    request: {
      service: s.ref().toJSON(),
      time: intervalToJSON(intervalFromDates(time, endTime)),
      expiration: expirationTime.toJSON(),
      overridePadding: false
    },
    token: server.token
  });
  return $.ajax({
    type: 'POST',
    url: server.address + '/service/createTentativeEvent',
    data: envelope
  }).then(function() {
    var r = goog.json.parse(arguments[2].responseText);
    if (r.Right) {
      r.thingFields = thingFields;
      r.roles = roles;
      return new SK.Event.TentativeEvent(r);
    }
    else { return r; }
  });
};

server.finalizeEvent = function(tentativeEvent, fields) {
  var envelope = goog.json.serialize({
    request: {
      event: tentativeEvent.eventRef.toJSON(),
      roles: fields
    },
    token: server.token
  });
  return $.ajax({
    type: 'POST',
    url: server.address + '/service/finalizeEvent',
    data: envelope
  });
};

/**
 * @param {?} r A ref, could be one of many types.
 * @return {?} Could return a promise or null.
 */
server.lookupRef = function(r) {
  switch (r.constructor) {
//    case SK.Event.Ref:
//      return server.getEventByRef(r);
    case SK.AttendeeField.Ref:
      return server.getAttendeeFieldByRef(r);
    case SK.Role.Ref:
      return server.getRoleByRef(r);
    case SK.Thing.Ref:
      return server.getThingByRef(r);
    case SK.ThingField.Ref:
      return server.getThingFieldByRef(r);
    case SK.ServiceField.Ref:
      return server.getServiceFieldByRef(r);
    case SK.Service.Ref:
      return server.getServiceByRef(r);
    case SK.ThingType.Ref:
      return server.getThingTypeByRef(r);
    default:
      return null;
  }
};

server.updateCache = function() {
  var requests = [];
  if (things === undefined) {
    requests.push(server.getThings().then(function() {
      things = arguments[0];
    }));
  }
  if (thingFields === undefined) {
    requests.push(server.getThingFields().then(function() {
      thingFields = arguments[0];
    }));
  }
  if (roles === undefined) {
    requests.push(server.getRoles().then(function() {
      roles = arguments[0];
    }));
  }
  if (serviceFields === undefined) {
    requests.push(server.getServiceFields().then(function() {
      serviceFields = arguments[0];
    }));
  }
  return server.sequence(requests);
};

server.updateCache();

setInterval(function() { server.updateCache() }, 300000);
