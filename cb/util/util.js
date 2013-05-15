timezoneJS.timezone.zoneFileBasePath = '/zoneInfo';
timezoneJS.timezone.init({
  async: false,
  loadingScheme: timezoneJS.timezone.loadingSchemes.LAZY_LOAD
});


var util = {};
util.server = 'http://localhost:1000';

util.dateFromJSON = function(j) {
  return Date.fromISO(j);
};

/** @type {function(number, number, number):!Array.<number>} */
util.range = function(start, end, step) {
  var arr = [start];
  while (arr[arr.length - 1] < end - step) {
    arr.push(arr[arr.length - 1] + step);
  }
  return arr;
};

util.sequence = function(promiseArray) {
  return $.when.apply($, promiseArray).then(function() { 
    return arguments;
  });
};

/**
 * @param {!Array.<!T>} arr Array or array
 *     like object over which to iterate.
 * @param {function(T, number): U} f The function to call for every
 *     element.
 * @return {!Array.<U>} a new array with the results from f.
 * @template T,U
 */
util.map = goog.array.map;

/** @type {function(!goog.date.DateTime, !number): !goog.date.DateTime} */
util.addDays = function(d, num) {
  var d2 = new goog.date.DateTime(d);
  d2.add(new goog.date.Interval(goog.date.Interval.DAYS, num));
  return d2;
};

/** @type {function(!goog.date.DateTime, !number): !goog.date.DateTime} */
util.addMonths = function(d, num) {
  var d2 = new goog.date.DateTime(d);
  d2.add(new goog.date.Interval(goog.date.Interval.MONTHS, num));
  return d2;
};

/** @type {function(!goog.date.DateTime): !goog.date.DateTime} */
util.sow = function(d) {
  return util.addDays(d, -d.getDay());
};

/** @type {function(!goog.date.DateTime): !goog.date.DateTime} */
util.eow = function(d) {
  return util.addDays(util.sow(d), 6);
};

/** @type {function(!goog.date.DateTime): !goog.date.DateTime} */
util.sod = function(d) {
  var d2 = new goog.date.DateTime(d);
  d2.setHours(0);
  d2.setMinutes(0);
  d2.setSeconds(0);
  d2.setMilliseconds(0);
  return d2;
};

/** @type {function(!number):{hours: !number, mins: !number}} */
util.msToHrsAndMinutes = function(ms) {
  var total_mins = ms / 60000;
  var hours = Math.floor(total_mins / 60);
  var mins = total_mins % 60;
  return {hours: hours, mins: mins};
};

/** @type {function(!number):!string} */
util.msToHrsAndMinutesString = function(ms) {
  var duration = util.msToHrsAndMinutes(ms);
  var str = "";
  if (duration.hours > 0) {
    str = str + duration.hours + 'h ';
  }
  if (duration.mins > 0) {
    str = str + duration.mins + 'm';
  }
  return str;
};
/** @type {function(function():?):undefined} */
util.printServerResponse = function(fn) {
  fn().then(function() { console.log(arguments[0]);});
};

/** @type {function(?, !Object):!Object} */
util.getFields = function(s, serviceFields) {
  var fields = {};
  $.map(s.fields(), function(field, sfRef) {
    fields[serviceFields[sfRef]] = field[1];
  }); 
  return fields;
};

/** @type {function(?, ?): !string} */
util.serviceFieldsAlternative = function(field, alt) {
  return field && field !== "null" ? field : alt;
};

/** @type {function(Object):!string} */
util.stringify = function(o) {
  return new goog.format.JsonPrettyPrinter(null).format(o);
};

util.dateFormat = function(d, format) {
  return new goog.i18n.DateTimeFormat(format).format(d);
};

/**
 * @param {!SK.IMapJSON} availabilities availability
 * @param {!SK.Interval} interval Interval.
 * @param {!Array.<number>} startRule startrule.
 * @param {!number} duration ms.
 * @return {Array.<goog.date.DateTime>} Array of times.
 */
util.possibilitiesToStartTimes = function(availabilities, interval, startRule, duration) {
  var cut = sliceIntervalMap(jsonToIntervalMap(availabilities), interval, false);
  var chunks = goog.array.filter(chunkIntervalMap(cut), function(c) { return c.value === true; });
  var length = duration;
  var startMins = new goog.structs.Set(startRule).getValues().sort();
  var possibleStartTimes = util.map(goog.array.filter(chunks, function(c) {
    return c.interval.start.point !== "Infinity" && c.interval.end.point !== "Infinity";
  }), function(c) {
    var start = new goog.date.DateTime(c.interval.start.point);
    var startTimes = [];
    while (start <= c.interval.end.point) {
      util.map(startMins, function(s) {
        start.setMinutes(s);
        if (start >= c.interval.start.point && start + length <= c.interval.end.point) {
          startTimes.push(new goog.date.DateTime(start));
        }
      });
      start.setHours(start.getHours() + 1);
    }
    return startTimes;
  });
  return goog.array.flatten(possibleStartTimes);
};
// util.possibilitiesToStartTimes(x.availabilities, y, [1,2,3,4], 3600000)
/**
 * @param {!goog.date.DateTime} d input date.
 * @param {!number} hr hour.
 * @return {!goog.date.DateTime} New dateTime object.
 */
util.topOfTheHour = function(d, hr) {
  var d2 = new goog.date.DateTime(d);
  d2.setHours(hr);
  d2.setMinutes(0);
  d2.setSeconds(0);
  d2.setMilliseconds(0);
  return d2;
};

/** @type {function(!goog.date.DateTime):!goog.date.DateTime} */
util.firstDayOfMonth = function(d) {
  return new goog.date.DateTime(d.getYear(), d.getMonth());
};
/** @type {function(!goog.date.DateTime):!goog.date.DateTime} */
util.lastDayOfMonth = function(d) {
  return util.addDays(new goog.date.DateTime(d.getYear(), d.getMonth()+1), -1);
};

/** @type {function(!number, !number, !number, !number, !number, !string):!goog.date.DateTime} */
util.tzDate = function(y, m, d, h, min, tz) {
  var tzjsDate = new timezoneJS.Date(y, m, d, h, min, tz);
  var date = new goog.date.DateTime();
  date.setTime(tzjsDate.getTime());
  return date;
};

/** @type {function(!goog.date.DateTime):!SK.NominalDate} */
util.dateToNominalDate = function(d) {
  return new SK.NominalDate(d.getYear(), d.getMonth(), d.getDate());
};

/** @type {function(!SK.NominalDate, !number):!SK.NominalDate} */
util.nominalAdd = function(nd, num) {
  return util.dateToNominalDate(util.addDays(nd.toDate(), num));
};

util.nominalDateRange = function(start, num) {
  return util.map(util.range(0, num, 1), function(i) {
    return util.nominalAdd(start, i);
  });
};

util.nominalDateWeeks = function(start, num) {
  var sow = start.getStartOfWeek();
  var startDates = util.map(util.range(0, num, 1), function(i) {
    return util.nominalAdd(sow, i * 7);
  });
  return util.map(startDates, function(d) {
    return util.nominalDateRange(d, 7);
  });
};

util.nominalStartOfMonth = function(n) {
  return new SK.NominalDate(n.nd[0], n.nd[1], 1);
};

util.nominalStartOfWeek = function(n) {
  return util.dateToNominalDate(util.sow(n.toDate()));
};

util.getStartDate = function(view, tz) {
  var d = new goog.date.DateTime();
  if (view === 'Month') {
    return new SK.NominalDate(d.getYear(), d.getMonth(), 1);
  }
  else if (view === 'Week') {
    return util.dateToNominalDate(util.sow(d));
  }
  else if (view === 'Day') {
    return util.dateToNominalDate(d);
  }
  else {
    return util.dateToNominalDate(d);
  }
};

util.getThingName = function(t) {
  var names = util.map(config.thingName, function(f) {
    if (t.getFieldByName(f)) { return t.getFieldByName(f).value; }
    else { return ''; }
  });
  return names.join(' ');
};

util.sortOccsByTime = function(es) {
  var sorted = $.map(es, function(e) { return e; });
  sorted.sort(function(a, b) {
    return a.startTime().getTime() - b.startTime().getTime();
  });
  return sorted;
};

util.jsonToDate = function(j) {
  return new goog.date.DateTime(Date.fromISO(j));
};

/**
 * @param {!jQuery} parentEl
 * @param {!string} title
 * @param {!ModulerInterface} content
 * @return {undefined} 
 */
util.popover = function(parentEl, title, content) {
  parentEl.clickover({
    title: title,
    html: true,
    placement: 'left',
    content: content.html()
  });
  return undefined;
};

/** @type {function(Element, !string):undefined} */
util.addCSSClass = function(el, c) {
  if (el.className === '') {
    el.className = c;
  }
  else {
    el.className += ' ' + c;
  }
};
/** @type {function(Element, !string):undefined} */
util.removeCSSClass = function(el, c) {
  var cs = new goog.structs.Set(c.split(' '));
  var ks = new goog.structs.Set(el.className.split(' '));
  el.className = ks.difference(cs).getValues().join(' ');
};

util.dateToJSON = function(d) {
  if (d.toJSON) {
    return d.toJSON();
  }
  else {
    return '' + d.getUTCFullYear() + '-' + util.padString(d.getUTCMonth() + 1, 2) + '-' + util.padString(d.getUTCDate(), 2) + 'T' + util.padString(d.getUTCHours(), 2) + ':' + util.padString(d.getUTCMinutes(), 2) + ':' + util.padString(d.getUTCSeconds(), 2) + '.' + util.padString(d.getUTCMilliseconds(), 3) + 'Z';
  }
};

util.padString = function(n, w) {
  var s = '' + n;
  while(s.length < w) {
    s = '0' + s; 
  }
  return s;
};
