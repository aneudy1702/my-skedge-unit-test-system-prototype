/** @type {function(!Array.<!SK.ThingsByType>, !SK.Set, function(?):?, function():?):!ModulerInterface} */
modules.LeftNav = function(thingsByTypeArray, preselected, cb, getThings) {
  var leftNav = new Moduler({things: [], selected: new SK.Set([])}, 'div class="leftNav"', function(d, e, c) { c.length = 0; return ''; });
  leftNav.setCSS({
    height: '100%',
    width: '100%'
  });
  leftNav.setUpdateChildren(function(d) {
    util.map(d.things, function(thingsByType) {
      leftNav.addChild(modules.LeftNavGroup(thingsByType, d.selected, function(e) {
        if (e.state === true) {
          leftNav.setDataNoBuild({ things: leftNav.data().things, selected: leftNav.data().selected.add(e.data)});
        }
        else {
          leftNav.setDataNoBuild({ things: leftNav.data().things, selected: leftNav.data().selected.remove(e.data)});
        }
        cb(leftNav.data().selected);
      }));
    });
  });
  getThings().then(function() {
    leftNav.setData({
      things: arguments[0],
      selected: new SK.Set(util.map(arguments[0][0].things, function(t) { return t; }))
    });
    cb(leftNav.data().selected);
  });
  return leftNav.getInterface();
};

/**
 * @param {!SK.ThingsByType} thingsByType things by type object.
 * @param {!SK.Set} preselected Set of selections.
 * @param {function(?):?} cb callback when li is clicked.
 * @return {!ModulerInterface}
 */
modules.LeftNavGroup = function(thingsByType, preselected, cb) {
  var list = new Moduler({thingsByType: {}, selected: new SK.Set([])}, 'ul class="nav nav-list"', function(d, e, c) { c.length = 0; return ''; });
  var getThingName = function(x) {
    var n = x.getFieldByName('Name');
    if(n !== null) {
      return n.value;
    } else {
      var fn = x.getFieldByName('First Name');
      var ln = x.getFieldByName('Last Name');
      if(fn === null) {
        if(ln === null) {
          throw 'Error: thing has no name';
        } else {
          return ln.value;
        }
      } else {
        if(ln === null) {
          return fn.value;
        } else {
          return fn.value + ' ' + ln.value;
        }
      }
    }
  };
  var addListItems = function(ts, selections) {
    list.createChild(ts.type.name(), 'li class="nav-header"');
    var things = goog.array.clone(ts.things).sort(function(a, b) {
      if (getThingName(a).toUpperCase() < getThingName(b).toUpperCase()) {
        return -1;
      }
      else {
        return 1;
      }
    });
    util.map(things, function(thing) {
      return list.addChild(modules.LeftNavListItem(thing, selections.contains(thing), cb));
    });
  };
  list.setUpdateChildren(function(d) {
    addListItems(d.thingsByType, d.selected);
  });
  list.setData({thingsByType: thingsByType, selected: preselected});
  return list.getInterface();
};

modules.LeftNavListItem = function(thing, state, cb) {
  var li = new Moduler({data: thing, state: state}, 'li', function(d, e) {
    if (d.state === true) { util.addCSSClass(e, 'active'); }
    else { util.removeCSSClass(e, 'active'); }
    return '';
  });
  var getThingName = function(x) {
    var n = x.getFieldByName('Name');
    if (n !== null) {
      return n.value;
    }
    else {
      var fn = x.getFieldByName('First Name');
      var ln = x.getFieldByName('Last Name');
      if (fn === null) {
        if (ln === null) {
          throw 'Error: thing has no name';
        } else {
          return ln.value;
        }
      }
      else {
        if (ln === null) {
          return fn.value;
        } else {
          return fn.value + ' ' + ln.value;
        }
      }
    }
  };
  li.createChild(getThingName(thing), 'a');
  //if (li.data().state === true) { li.addCSSClass('active'); }
  li.onClick(function() {
    if (li.data().state) {
      li.setData({ data: li.data().data, state: false });
      li.removeCSSClass('active');
      cb(li.data());
    }
    else {
      li.setData({ data: li.data().data, state: true });
      li.addCSSClass('active');
      cb(li.data());
    }
  });
  return li.getInterface();
};
