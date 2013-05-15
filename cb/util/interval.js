//CONSTRUCTORS
//
/** @type {function(!SK.Point, boolean): !SK.ChangePoint} */
var ChangePoint = function (p, isAfter) {
  if (p === SK.Infinity.posInf) {
    if (isAfter !== false) {
      goog.debug.Logger.getLogger('SK').log(goog.debug.Logger.Level.WARNING,
        'Attempted to construct ChangePoint at +Infinity with isAfter true. Must be false. Correcting...');
      return {
        point: p,
        isAfter: false
      };
    }
  } else if (p === SK.Infinity.negInf) {
    if (isAfter !== true) {
      goog.debug.Logger.getLogger('SK').log(goog.debug.Logger.Level.WARNING,
        'Attempted to construct ChangePoint at -Infinity with isAfter false. Must be true. Correcting...');
      return {
        point: p,
        isAfter: true
      };
    }
  }
  return {
    point: p,
    isAfter: isAfter
  };
};
/** @type {function(!SK.ChangePoint, !SK.ChangePoint): !SK.Interval} */
var Interval = function (cp1, cp2) {
  // handle empty interval
  return {
    start: cp1,
    end: cp2
  };
};
/** @type {function(!SK.Interval, !SK.Interval): !SK.IntervalPair} */
var IntervalPair = function (i1, i2) {
  return {
    left: i1,
    right: i2
  };
};
/** @type {function(!SK.ChangePoint, boolean): !SK.IntervalMapElement} */
var IntervalMapElement = function (cp, v) {
  return {
    changePoint: cp,
    value: v
  };
};
/** @type {function(!Array.<!SK.IntervalMapElement>, boolean): !SK.IntervalMap} */
var IntervalMap = function (changes, initial) {
  return {
    changes: changes,
    initial: initial
  };
};
/** @type {function(!SK.Interval, boolean): !SK.IntervalChunk} */
var IntervalChunk = function (i, v) {
  return {
    interval: i,
    value: v
  };
};
//CHANGEPOINT FUNCTIONS
//
/** @type {function(!SK.ChangePoint, !SK.ChangePoint): boolean} */
var changePointIsBeforeCP = function (cp1, cp2) {
  if (cp1.point < cp2.point) {
    return true;
  } else if (cp1.point == cp2.point && cp1.isAfter < cp2.isAfter) {
    return true;
  } else {
    return false;
  }
};
/** @type {function(!SK.ChangePoint, !SK.ChangePoint): boolean} */
var changePointIsEqual = function (cp1, cp2) {
  if (cp1.point == cp2.point && cp1.isAfter == cp2.isAfter) return true;
  else {
    return false;
  }
};
var changePointIsBeforeOrEqualCP = function (cp1, cp2) {
  return changePointIsBeforeCP(cp1, cp2) || changePointIsEqual(cp1, cp2);
};
/** @type {function(!SK.ChangePoint, !SK.Interval): boolean} */
var changePointIsBeforeInterval = function (cp, i) {
  return changePointIsBeforeCP(cp, i.start);
};
/** @type {function(!goog.date.DateTime, boolean): !SK.ChangePoint} */
var dateToCP = function (d, v) {
  return ChangePoint(d, v);
};
/** @type {function(!goog.date.DateTime, !goog.date.DateTime): !SK.Interval} */
var intervalFromDates = function (d1, d2) {
  return Interval(dateToCP(d1, true), dateToCP(d2, false));
};
//INTERVAL FUNCTIONS
//
/** @type {function(!SK.Point, !SK.Point): !SK.Interval} */
var intervalOToO = function (p1, p2) {
  return Interval(ChangePoint(p1, true), ChangePoint(p2, false));
};
/** @type {function(!SK.Point, !SK.Point): !SK.Interval} */
var intervalCToO = function (p1, p2) {
  return Interval(ChangePoint(p1, false), ChangePoint(p2, false));
};
/** @type {function(!SK.Point, !SK.Point): !SK.Interval} */
var intervalOToC = function (p1, p2) {
  return Interval(ChangePoint(p1, true), ChangePoint(p2, true));
};
/** @type {function(!SK.Point, !SK.Point): !SK.Interval} */
var intervalCToC = function (p1, p2) {
  return Interval(ChangePoint(p1, false), ChangePoint(p2, true));
};
/** @type {function(!SK.Point): !SK.Interval} */
var intervalDegenerate = function (p) {
  return intervalCToC(p, p);
};
/** @type {function(): !SK.Interval} */
var intervalEmpty = function () {
  return Interval(ChangePoint(SK.Infinity.posInf, false), ChangePoint(SK.Infinity.negInf, true));
};
/** @type {function(): !SK.Interval} */
var intervalUnbounded = function () {
  return Interval(ChangePoint(SK.Infinity.negInf, true), ChangePoint(SK.Infinity.posInf, false));
};
/** @type {function(!SK.Interval): boolean} */
var intervalIsEmpty = function (i) {
  return i.start.point == intervalEmpty().start.point && i.end.point == intervalEmpty().end.point;
};
/** @type {function(!SK.Interval): boolean} */
var intervalIsLeftClosed = function (i) {
  return i.start.isAfter;
};
/** @type {function(!SK.Interval): boolean} */
var intervalIsRightClosed = function (i) {
  return !i.end.isAfter;
};
/** @type {function(!SK.Point, !SK.Interval): boolean} */
var intervalContainsPoint = function (p, i) {
  if (i.start.point < p && p < i.end.point) {
    return true;
  } else if (i.start.point == p && !i.start.isAfter) {
    return true;
  } else if (i.end.point == p && i.end.isAfter) {
    return true;
  } else {
    return false;
  }
};
/** @type {function(!SK.Point, !SK.Interval): !SK.IntervalPair} */
var intervalSplitBefore = function (p, i) {
  if (p <= i.start.point) {
    return IntervalPair(intervalEmpty(), i);
  } else if (i.end.point < p) {
    return IntervalPair(i, intervalEmpty());
  } else {
    return IntervalPair(Interval(i.start, ChangePoint(p, false)), Interval(ChangePoint(p, false), i.end));
  }
};
/** @type {function(!SK.Point, !SK.Interval): !SK.IntervalPair} */
var intervalSplitAfter = function (p, i) {
  if (p < i.start.point) {
    return IntervalPair(intervalEmpty(), i);
  } else if (i.end.point <= p) {
    return IntervalPair(i, intervalEmpty());
  } else {
    return IntervalPair(Interval(i.start, ChangePoint(p, true)), Interval(ChangePoint(p, true), i.end));
  }
};
/** @type {function(!SK.Interval): !SK.Interval} */
var intervalLeftComplement = function (i) {
  return Interval(ChangePoint(SK.Infinity.negInf, true), i.start);
};
/** @type {function(!SK.Interval): !SK.Interval} */
var intervalRightComplement = function (i) {
  return Interval(i.end, ChangePoint(SK.Infinity.posInf, false));
};
/** @type {function(!SK.Point): !SK.Interval} */
var intervalLessThan = function (p) {
  return intervalSplitBefore(p, intervalUnbounded()).left;
};
/** @type {function(!SK.Point): !SK.Interval} */
var intervalLessThanOrEqualTo = function (p) {
  return Interval(ChangePoint(SK.Infinity.negInf, true), ChangePoint(p, true));
};
/** @type {function(!SK.Point): !SK.Interval} */
var intervalGreaterThan = function (p) {
  return intervalSplitAfter(p, intervalUnbounded()).right;
};
/** @type {function(!SK.Point): !SK.Interval} */
var intervalGreaterThanOrEqualTo = function (p) {
  return Interval(ChangePoint(p, false), ChangePoint(SK.Infinity.posInf, false));
};
/** @type {function(!SK.IMapJSON): !SK.IntervalMap} */
var jsonToIntervalMap = function (json) {
  return IntervalMap(goog.array.map(json.changes, function (c) {
    var d = new goog.date.DateTime(util.dateFromJSON(c[0][0]));
    if (d === null) {
      throw 'API provided incorrect date: ' + goog.json.serialize(c[0][0]);
    } else {
      return IntervalMapElement(ChangePoint(d, c[0][1]), c[1]);
    }
  }), json.initial);
};
/** @type {function(!SK.IntervalMap, !SK.Interval, boolean): !SK.IntervalMap} */
var sliceIntervalMap = function (imap, i, v) {
  return IntervalMap(function () {
    var left = goog.array.findIndexRight(imap.changes, function (c) {
      return changePointIsBeforeOrEqualCP(c.changePoint, i.start);
    });
    var right = goog.array.findIndex(imap.changes, function (c) {
      return changePointIsBeforeCP(i.end, c.changePoint);
    });
    var changes = [];
    if (left === -1) {
      changes.push(IntervalMapElement(i.start, imap.initial));
    } else {
      changes.push(IntervalMapElement(i.start, imap.changes[left].value));
    }
    var x = left + 1;
    if (right === -1) {
      right = imap.changes.length;
    }
    while (x < right) {
      changes.push(imap.changes[x]);
      x++;
    }
    changes.push(IntervalMapElement(i.end, changes[changes.length - 1].value));
    return changes;
  }(), v);
};
/** @type {function(!SK.IntervalMap): !Array.<!SK.IntervalChunk>} */
var chunkIntervalMap = function (imap) {
  var startVal = [IntervalMapElement(ChangePoint(SK.Infinity.negInf, true), imap.initial)].concat(imap.changes);
  var endVal = goog.array.map(imap.changes, function (c) {
    return c.changePoint;
  }).concat([ChangePoint(SK.Infinity.posInf, false)]);
  return goog.array.map(goog.array.zip(startVal, endVal), function (e) {
    return IntervalChunk(Interval(e[0].changePoint, e[1]), e[0].value);
  });
};
/** @type {function(!SK.ChangePoint): !Array} */
var changePointToJson = function (cp) {
  return [util.dateToJSON(new Date(cp.point)), cp.isAfter];
};
/** @type {function(!SK.Interval): !Array} */
var intervalToJSON = function (i) {
  return [changePointToJson(i.start), changePointToJson(i.end)];
};

/* {function(SK.Interval, function(boolean):boolean, SK.IntervalMap): SK.IntervalMap} */
/* {function(SK.IMapJSON): SK.IMap} */
