modules.BookingMenuList = function(listData, label) {
  var all = new goog.structs.Set(util.map(listData, function(i) { return i.id; }));
  var selectable = new goog.structs.Set(all.getValues());
  var list = new Moduler({selected: null, selectable: selectable, list: listData}, 'ul class="nav nav-list"', function(d) {return '';});
  list.setCSS({ // will need to set width and left on usage
    position: 'absolute',
    height: '100%',
    overflow: 'auto'
  });
  var listsEqual = function(n, o) {
    var newList = new goog.structs.Set(util.map(n, function(i) { return i.id; }));
    var oldList = new goog.structs.Set(util.map(o, function(i) { return i.id; }));
    return newList.equals(oldList);
  };
  var onSelection = function(id, selected) {
    if (selected === true) {
      list.setData({selected: id, selectable: list.data().selectable, list: listData});
    }
    else {
      list.setData({selected: null, selectable: list.data().selectable, list: listData});
    }
  };
  list.setUpdateChildren(function(d, old) {
    if (listsEqual(d.list, old.list) === false) {
      util.map(list.children(), function(c) { list.removeChild(c); });
      list.createChild(label, 'li class="nav-header"', function(h) { return h; });
      util.map(d.list, function(t) { list.addChild(modules.BookingMenuListItem(t, onSelection)); });
    }
    if (d.selected !== null) {
      util.map(list.children(), function(c) {
        if (c.data().data !== undefined) {
          if (c.data().data.id === d.selected) {
            c.setData({selected: true, enabled: true, data: c.data().data});
          }
          else {
            c.setData({ selected: false, enabled: false, data: c.data().data});
          }
        }
      });
    }
    else {
      var set;
      if (d.selectable === null) {
        set = all;
      }
      else {
        set = d.selectable;
      }
      util.map(list.children(), function(c) {
        if (c.data().data !== undefined) {
          if (set.contains(c.data().data.id)) {
            c.setData({selected: false, enabled: true, data: c.data().data});
          }
          else {
            c.setData({selected: false, enabled: false, data: c.data().data});
          }
        }
      });
    }
  });
  list.createChild(label, 'li class="nav-header"', function(h) { return h; });
  util.map(listData, function(d) { list.addChild(modules.BookingMenuListItem(d, onSelection)); });
  return list.getInterface();
};
/*
 * TEST 1
$('body').empty();
x = modules.BookingMenuList([], function(x) { console.log(x); });
$('body').append(x.html());
util.getServices().then(function(r) {
  x.setData({
    selected: null,
    selectable: new goog.structs.Set(util.map(r, function(i) { return i.id; })),
    list: r
  });
});

 * TEST 2
$('body').empty()
util.getThingsByType({id: 1}).then(function(r) {
  var x = modules.BookingMenuList(r, function(x) { console.log(x); });
  $('body').append(x.html());
});
*/

