modules.BookingMenu = function(services, thingsByType, cb) {
  var bookingMenu = new Moduler({ services: services, thingsByType: thingsByType, state: [] }, 'div class="dropdown-menu"', function(d, e, c) { 
    c.length = 0;
    return '';
  });
  bookingMenu.setCSS({
    position: 'absolute',
    top: boot.navHeight,
    //left: boot.leftNavWidth + 1 + '%',
    right: '1em',
    height: boot.bookingMenuHeight + 'px',
    display: 'block'
  });
  var addLists = function() {
    var serviceList = {
      type: 'Service',
      list: modules.BookingMenuList(bookingMenu.data().services, 'Services')
    };
    var thingLists = util.map(bookingMenu.data().thingsByType, function(group) {
      return {
        type: group.type,
        list: modules.BookingMenuList(group.things, group.type.data.name)
      };
    });
    util.map(thingLists, function(t) { t.list.setData({ selected: t.list.data().selected, selectable: new goog.structs.Set(), list: t.list.data().list }); });
    util.map(bookingMenu.data().state, function(state) {
      var list;
      if (state.id === 'Service') {
        list = serviceList.list;
      }
      else {
        util.map(thingLists, function(tl) {
          var scheduleIds = new goog.structs.Set();
          util.map(tl.list.data().list, function(l) {
            util.map(l.things, function(t) {
              scheduleIds.add(t.scheduleId);
            });
          });
 //         if (!scheduleIds.intersection(bookingMenu.data().state.selectable).isEmpty()) { }
        });
        list = goog.array.find(thingLists, function(tl) { return tl.type.id === state.id; }).list;
      }
      if (list) { list.setData({list: list.data().list, selected: state.selected, selectable: state.selectable }); }
    });
    var left = 0;
    util.map([serviceList.list].concat(util.map(thingLists, function(t) { return t.list; })), function(l) {
      l.setCSS({
        position: 'absolute',
        left: left * 100 / (thingsByType.length + 1) + '%',
        width: (100-20) / (thingsByType.length + 1) + '%',
        height: '100%',
        overflow: 'auto'
      });
      left += 1;
      bookingMenu.addChild(l);
    });
  };
  bookingMenu.setUpdateChildren(function(d, old) {
    addLists();
  });
  return bookingMenu.getInterface();
};

/*
{
  type: thingType || Service,
  list: things || services,
  selected: id,
  selectable: goog.structs.Set
}
*/

/*
  $('body').empty();
  var booking;
  var data;
  $.when(util.getServices(), util.getThings()).done(function() {
    var services = arguments[0];
    var thingsByType = arguments[1];
    booking = modules.BookingMenu(services, thingsByType);
    $('body').append(booking.html());
    data = booking.data();
    data.state.push({id: 1, selectable: new goog.structs.Set([1,3]), selected: null});
    booking.setData(data);
  });
*/
