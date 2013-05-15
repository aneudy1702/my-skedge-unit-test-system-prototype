var SK = {};

SK.ThingType = {};
/** 
 * @param {!string} s RefId from server
 * @constructor
 */
SK.ThingType.Ref = function(s) {
  this.value = s;
};
/** @type {function():!string} */
SK.ThingType.Ref.prototype.toJSON = function() {
  return this.value;
};
/**
 * @param {!Object} t
 * @constructor
 */
SK.ThingType.ThingType = function(t) {
  this.value = t;
};
/** @type {function():!string} */
SK.ThingType.ThingType.prototype.toJSON = function() {
  return this.value;
};
/** @type {function():!SK.ThingType.Ref} */
SK.ThingType.ThingType.prototype.ref = function() {
  return this.value.ref;
};
/** @type {function():!string} */
SK.ThingType.ThingType.prototype.name = function() {
  return this.value.name;
};

SK.Thing = {};
/** 
 * @param {!string} s RefId from server
 * @constructor
 */
SK.Thing.Ref = function(s) {
  this.value = s;
};
/** @type {function():!string} */
SK.Thing.Ref.prototype.toJSON = function() {
  return this.value;
};
/**
 * @param {!Object} t
 * @constructor
 */
SK.Thing.Thing = function(t) {
  this.value = t;
};
/** @type {function():!string} */
SK.Thing.Thing.prototype.toJSON = function() {
  return this.value;
};
/** @type {function():!SK.Thing.Ref} */
SK.Thing.Thing.prototype.ref = function() {
  return this.value.ref;
};
/** @type {function():!Array} */
SK.Thing.Thing.prototype.getFields = function() {
  var array = [];
  $.map(this.value.fields, function(f) {
    array.push({
      type: f[0],
      value: f[1],
      name: f.thingField.name(),
      thingField: f.thingField
    });
  });
  return array;
};
/** @type {function(string):!Object} */
SK.Thing.Thing.prototype.getFieldByName = function(n) {
  return goog.array.find(this.getFields(), function(f) {
    return f.name === n;
  });
};

/**
 * @param {!SK.Interval} i The interval for which to retrieve the schedule.
 * @return {?} TODO add return value
 */
SK.Thing.Thing.prototype.getSchedule = function(i) {
  return this['value']['schedule'];
};

SK.ThingField = {};
/** 
 * @param {!string} s RefId from server
 * @constructor
 */
SK.ThingField.Ref = function(s) {
  this.value = s;
};
/** @type {function():!string} */
SK.ThingField.Ref.prototype.toJSON = function() {
  return this.value;
};
/**
 * @param {!Object} t
 * @constructor
 */
SK.ThingField.ThingField = function(t) {
  this.value = t;
};
/** @type {function():!string} */
SK.ThingField.ThingField.prototype.toJSON = function() {
  return this.value;
};
/** @type {function():!string} */
SK.ThingField.ThingField.prototype.name = function() {
  return this.value.name;
};
/** @type {function():!SK.ThingField.Ref} */
SK.ThingField.ThingField.prototype.ref = function() {
  return this.value.ref;
};
/** @type {function():!Object} */
SK.ThingField.ThingField.prototype.type = function() {
  return this.value.type;
};
/** @type {function():boolean} */
SK.ThingField.ThingField.prototype.required = function() {
  if (this.value.type[0] === "maybe") { return false; }
  else { return true; }
};

SK.Event = {};
/** 
 * @param {!string} s RefId from server
 * @constructor
 */
SK.Event.Ref = function(s) {
  this.value = s;
};
/** @type {function():!string} */
SK.Event.Ref.prototype.toJSON = function() {
  return this.value;
};
/**
 * @param {!Object} t
 * @constructor
 */
SK.Event.Event = function(t) {
  this.value = t;
};
/** @type {function():!string} */
SK.Event.Event.prototype.toJSON = function() {
  return this.value;
};
/** @type {function():!SK.Event.Ref} */
SK.Event.Event.prototype.ref = function() {
  return this.value[0].ref;
};
///** @type {function(!string):Object} */
//SK.Event.Event.prototype.getRoleByName = function(name) {
//  var field = null;
//  $.map(this.value.roles, function(r) {
//    if (r.role.value.name === name) {
//      field = {
//        role: r.role,
//        things: r.things
//      };
//    }
//  });
//  return field;
//};
/** @type {function():!string} */
SK.Event.Event.prototype.summary = function() {
  return this.value[0].summary;
};
SK.Event.Event.prototype.canceled = function() {
  return this.value[0].canceled;
};
SK.Event.Event.prototype.cancelled = function() {
  return this.canceled();
};
SK.Event.Event.prototype.expiration = function() {
  return (this.value[0].expiration ? util.jsonToDate(this.value[0].expiration) : null);
};
SK.Event.Event.prototype.service = function() {
  return new SK.Service.Ref(this.value[0].service);
};
SK.Event.Event.prototype.occs = function() {
  return this.value[1];
};

SK.Occ = {};
/**
 * @constructor
 */
SK.Occ.Occ = function(o, e) {
  this.value = o;
  this.parent = e;
};
SK.Occ.Occ.prototype.startTime = function() {
  return new goog.date.DateTime(util.dateFromJSON(this.value.time[0][0]));
};
SK.Occ.Occ.prototype.endTime = function() {
  return new goog.date.DateTime(util.dateFromJSON(this.value.time[1][0]));
};
SK.Occ.Occ.prototype.event = function() {
  return this.parent;
};
SK.Occ.Occ.prototype.roles = function() {
  var roles = $.map(this.value.roles, function(r, ref) {
    return {
      roleRef: new SK.Role.Ref(ref),
      things: $.map(r, function(t, tRef) {
        return {
          thingRef: new SK.Thing.Ref(tRef),
          attendeeFields: $.map(t.fields, function(f, fRef) {
            return {fieldRef: new SK.AttendeeField.Ref(fRef), value: f};
          })
        };
      })
    };
  });
  return roles;
};

SK.Role = {};
/** 
 * @param {!string} s RefId from server
 * @constructor
 */
SK.Role.Ref = function(s) {
  this.value = s;
};
/** @type {function():!string} */
SK.Role.Ref.prototype.toJSON = function() {
  return this.value;
};
/**
 * @param {!Object} t
 * @constructor
 */
SK.Role.Role = function(t) {
  this.value = t;
};
/** @type {function():!string} */
SK.Role.Role.prototype.toJSON = function() {
  return this.value;
};
/** @type {function():!SK.Role.Ref} */
SK.Role.Role.prototype.ref = function() {
  return this.value.ref;
};
/** @type {function():!string} */
SK.Role.Role.prototype.name = function() {
  return this.value.name;
};

SK.Service = {};
/** 
 * @param {!string} s RefId from server
 * @constructor
 */
SK.Service.Ref = function(s) {
  this.value = s;
};
/** @type {function():!string} */
SK.Service.Ref.prototype.toJSON = function() {
  return this.value;
};
/**
 * @param {!Object} t
 * @constructor
 */
SK.Service.Service = function(t) {
  this.value = t;
};
/** @type {function():!string} */
SK.Service.Service.prototype.toJSON = function() {
  return this.value;
};
/** @type {function():!string} */
SK.Service.Service.prototype.name = function() {
  return this.value.name;
};
/** @type {function():!Array.<number>} */
SK.Service.Service.prototype.durations = function() {
  if (this.value['eventSource'][1]['general']['time'] !== null) {
    return [this.value['eventSource'][1]['general']['time']];
  }
  else {
    var durations = [];
    util.map(this.value['eventSource'][1]['alternatives'], function(a) {
      if (a.time !== null) {
        durations.push(a.time.length);
      }
    });
    return durations;
  }
};
/** @type {function():!Object} */
SK.Service.Service.prototype.fields = function() {
  return this.value.fields;
};
/** @type {function():!SK.Service.Ref} */
SK.Service.Service.prototype.ref = function() {
  return this.value.ref;
};
SK.Service.Service.prototype.generalSchema = function() {
  return {
    rawSchema: this['value']['eventSource'][1]['general'],
    roles: $.map(this['value']['eventSource'][1]['general']['roles'], function(role, rref) {
      return {
        role: role.role,
        existing: (role['thingSource'][0] === "new" ? false : true),
        fields: (role['thingSource'][0] === "new" ?
                    $.map(role['thingSource'][1]['fields'], function(f) { return f; }) :
                    null),
        things: (role['thingSource'][0] === "existing" ?
                 $.map(role['thingSource'][1][1][0], function(tr) { return new SK.Thing.Ref(tr); }) :
                 null)
      };
    }),
    time: this['value']['eventSource'][1]['general']['time']
  };
};
SK.Service.Service.prototype.alternativeSchemas = function() {
  return {
    rawSchema: this['value']['eventSource'][1]['alternatives'],
    alternatives: $.map(this['value']['eventSource'][1]['alternatives'], function(alt) {
      return {
        roles: $.map(alt['roles'], function(role, rref) {
          return {
            role: role,
            existing: (role['thingSource'][0] === "new" ? false : true),
            fields: (role['thingSource'][0] === "new" ?
                     $.map(role['thingSource'][1]['fields'], function(f) { return f; }) :
                     null),
            things: (role['thingSource'][0] === "existing" ?
                     $.map(role['thingSource'][1][1][0], function(tr) { return new SK.Thing.Ref(tr); }) :
                     null)
          };
        }),
        time: alt['time']
      };
    })
  };
};

SK.ServiceField = {};
/** 
 * @param {!string} s RefId from server
 * @constructor
 */
SK.ServiceField.Ref = function(s) {
  this.value = s;
};
/** @type {function():!string} */
SK.ServiceField.Ref.prototype.toJSON = function() {
  return this.value;
};
/**
 * @param {!Object} t
 * @constructor
 */
SK.ServiceField.ServiceField = function(t) {
  this.value = t;
};
/** @type {function():!string} */
SK.ServiceField.ServiceField.prototype.toJSON = function() {
  return this.value;
};
/** @type {function():!string} */
SK.ServiceField.ServiceField.prototype.name = function() {
  return this.value.name;
};
/** @type {function():!SK.ServiceField.Ref} */
SK.ServiceField.ServiceField.prototype.ref = function() {
  return this.value.ref;
};

SK.AttendeeField = {};
/**
 * @param {!string} s RefId from server.
 * @constructor
 */
SK.AttendeeField.Ref = function(s) {
  this.value = s;
};
/** @type {function():!string} */
SK.AttendeeField.Ref.prototype.toJSON = function() {
  return this.value;
};
/**
 * @param {!Object} t
 * @constructor
 */
SK.AttendeeField.AttendeeField = function(t) {
  this.value = t;
};
/** @type {function():!string} */
SK.AttendeeField.AttendeeField.prototype.name = function() {
  return this.value.name;
};
/** @type {function():!SK.AttendeeField.Ref} */
SK.AttendeeField.AttendeeField.prototype.ref = function() {
  return this.value.ref;
};

/** @typedef {(SK.ThingType.Ref|SK.Role.Ref|SK.ServiceField.Ref|SK.Event.Ref|SK.Thing.Ref|SK.ThingField.Ref|SK.Service.Ref|SK.AttendeeField.Ref)} */
SK.Ref;
/** @typedef {(SK.ThingType.ThingType|SK.Role.Role|SK.ServiceField.ServiceField|SK.Event.Event|SK.Thing.Thing|SK.ThingField.ThingField|SK.Service.Service|SK.AttendeeField.AttendeeField)} */
SK.Item;
/** @typedef {!{type: !SK.ThingType.ThingType, things: !Array.<!SK.Thing.Thing>}} */
SK.ThingsByType;

/** 
 * @param {!Object} t
 * @constructor
 */
SK.Event.TentativeEvent = function(t) {
  this.eventRef = new SK.Event.Ref(t.Right[0]);
  this.roles = $.map(t.Right[1], function(r, rref) {
    return {
      role: goog.array.find(t.roles, function(r) { return r.ref().value === rref; }),
      thingFields: goog.array.filter(t.thingFields, function(f) { return goog.array.contains(r.fields, f.ref().value); })
    };
  });
};

/**
 * Intervals
 */

/** @enum {string} */
SK.Infinity = {
    posInf: 'Infinity',
    negInf: '-Infinity'
};

//TODO Change "value"
/** @typedef {(!goog.date.DateTime|!SK.Infinity)} */
SK.Point;
/** @typedef {!{point: !SK.Point, isAfter: boolean}} */
SK.ChangePoint;
/** @typedef {!{start: !SK.ChangePoint, end: !SK.ChangePoint}} */
SK.Interval;
/** @typedef {!{left: !SK.Interval, right: !SK.Interval}} */
SK.IntervalPair;
/** @typedef {!{changePoint: !SK.ChangePoint, value: boolean}} */
SK.IntervalMapElement;
/** @typedef {!{changes: !Array.<!SK.IntervalMapElement>, initial: boolean}} */
SK.IntervalMap;
/** @typedef {!{interval: !SK.Interval, value: boolean}} */
SK.IntervalChunk;
/** @typedef {!{changes: [![string,boolean], boolean], initial: boolean}} */
SK.IMapJSON;

/**
 * Set
 */

/**
 * @param {!Array.<!SK.Item>} items
 * @constructor
 */
SK.Set = function(items) {
  this.values = items;
};
/** @type {function(!SK.Item):!SK.Set} */
SK.Set.prototype.add = function(i) {
  if (!goog.array.find(this.values, function(v) {
    return v.ref().toJSON() === i.ref().toJSON();
  })) {
    this.values.push(i);
  }
  return this;
};
/** @type {function(!SK.Item):!SK.Set} */
SK.Set.prototype.remove = function(i) {
  goog.array.removeIf(this.values, function(v) {
    return v.ref().toJSON() === i.ref().toJSON();
  });
  return this;
};
/** @type {function():!Array.<!SK.Item>} */
SK.Set.prototype.getValues = function() {
  return goog.array.clone(this.values);
};
/** @type {function():!boolean} */
SK.Set.prototype.isEmpty = function() {
  if (this.values.length < 1) { return true; }
  else { return false; }
};
/** @type {function(!SK.Item):!boolean} */
SK.Set.prototype.contains = function(i) {
  if (goog.array.findIndex(this.values, function(v) {
    return v.ref().toJSON() === i.ref().toJSON(); }) > -1) {
      return true;
  }
  else {
    return false;
  }
};
/** @type {function(!Array.<!SK.Item>):!SK.Set} */
SK.Set.prototype.addMultiple = function(arr) {
  goog.array.map(arr, function(v) { this.add(v); });
  return this;
};
/** @type {function(!SK.Set):!SK.Set} */
SK.Set.prototype.intersection = function(s2) {
  return new SK.Set(goog.array.filter(this.getValues(), function(v) {
    return s2.contains(v);
  }));
};
/** @type {function():!SK.Set} */
SK.Set.prototype.clone = function() {
  return new SK.Set(this.getValues());
};
/** @type {function(!SK.Set):!SK.Set} */
SK.Set.prototype.union = function(s2) {
  var s3 = new SK.Set(this.getValues());
  s3.addMultiple(s2.getValues());
  return s3;
};
/** @type {function(!SK.Set):!SK.Set} */
SK.Set.prototype.difference = function(s2) {
  var s1 = this;
  var s3 = new SK.Set(goog.array.filter(s1.getValues(), function(v) {
    return !s2.contains(v);
  }));
  var s4 = new SK.Set(goog.array.filter(s2.getValues(), function(v) {
    return !s1.contains(v);
  }));
  return s3.union(s4);
};

/*
 * Nominal Date
 */

/**
 * @constructor
 */
SK.NominalDate = function(y, m, d) {
  this.nd = [y, m, d];
};

SK.NominalDate.prototype.equals = function(nd) {
  return this.nd[0] === nd[0] && this.nd[1] === nd[1] && this.nd[2] === nd[2];
};

/** @type {function(string=):!goog.date.DateTime} */
SK.NominalDate.prototype.toDate = function(zone) {
  var tz;
  if (zone === undefined) { tz = config.timezone; }
  return util.tzDate.apply(this, this.nd.concat([0, 0, config.timezone]));
};

SK.NominalDate.prototype.getDate = function() {
  return this.nd[2];
};

SK.NominalDate.prototype.getYear = function() {
  return this.nd[0];
};
SK.NominalDate.prototype.getMonth = function() {
  return this.nd[1];
};

SK.NominalDate.prototype.getStartOfWeek = function() {
  return util.dateToNominalDate(util.sow(this.toDate()));
};
