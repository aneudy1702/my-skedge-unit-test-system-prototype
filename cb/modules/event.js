/**
 * @param {!SK.Occ.Occ} o The occ object.
 * @param {!SK.Event.Event} e The event object.
 * @param {!goog.date.DateTime} sod DateTime (should be set to start of day).
 * @return {!ModulerInterface}
 */
modules.Event = function(o, e, sod) {
  var timePctRatio = 86400000 / 100;
  var minutesLen = ((o.endTime() - o.startTime())/1000) /60;
  var event = new Moduler(o,
                          'div class="label event" data-toggle="clickover" align="center"',
                          function(d, el, c) { c.length = 0; return ''; });
  event.createChild(e.summary(),'div class="event-inner"');
  event.setCSS({
    top: (o.startTime() - sod) / timePctRatio + '%',
    height: (o.endTime() - o.startTime()) / timePctRatio + '%'
  });
  var classStr = '';
  if (minutesLen > 60) {
    classStr += 'hour-gt ';
  }
  if (minutesLen <= 60) {
    classStr += 'hour-orless ';
  }
  if (minutesLen <= 30) {
    classStr += 'half-orless ';
  }
  if (minutesLen <= 15) {
    classStr += 'quarter-orless ';
  }
  event.addCSSClass(classStr);

//  var deleteEvent = function() {
//    event.html().clickover('hide');
//    event.setCSS({display: 'none'});
//    util.deleteEvent(e.id);
//  };
//  event.onClick(function(){
//    var el = event.html();
//    el.clickover({
//      title: e.summary,
//      html: true,
//      content: modules.EventInfo(e, function() { el.clickover('hide'); }, deleteEvent).html()
//    });
  return event.getInterface();
};

/**
 * @param {!Object} e the event.
 * @param {!function(): undefined} close Callback to close popover.
 * @param {!function(): undefined} cancel Callback to delete event.
 * @return {!ModulerInterface}
 */
//modules.EventInfo = function(e, close, cancel) {
//  var div = new Moduler(e, 'div', function(d) {return '';});
//  var list = div.createChild('', 'table table-hover');
//  var createAttendeeListItem = function(a, i) {
//    var row  = list.createChild('', 'tr');
//    row.createChild('', 'td').createChild('Attendee ' + i + ': ', 'strong');
//    row.createChild(a.roleId, 'td', function(d) { return 'Role ' + d; });
//    row.createChild(a.scheduleId, 'td', function(d) { return 'Schedule ' + d; });
//    return row;
//  };
//  var i = 0;
//  util.map(e['attendees'], function(a) {
//    i++;
//    return createAttendeeListItem(a, i);
//  });
//  if(e['type'][0] === 'lit') {
//    var roles = util.getRolesFromTypeLiteral(e['type']);
//    var customerCapacity = goog.array.filter(roles, function(r) {
//      return r.role === 3;
//    })[0].capacity;
//    var customers = util.getAttendeesWithRole(e['attendees'])['3'];
//    if (customers === undefined) customers = [];
//    if (customers.length < customerCapacity) {
//      var countLabel = div.createChild(
//        {count: customers.length, capacity: customerCapacity},
//        'strong',
//        function(d) {
//          return d.count + ' of ' + d.capacity + ' clients attending.';
//        }
//      );
//      var cSearch = div.createChild('', 'input type="text" data-provide="typeahead" placeholder="Clients..."');
//      cSearch.setCSS({ width: 100 });
//      var tl = [];
//      var customer;
//      cSearch.html().typeahead({
//        source: function(query, process) {
//          var search = util.thingSearch(3, query);
//          return search.done(function(r) { 
//            tl = util.processThingResponse(r);
//            return process(util.map(tl, function(result) { return result.name; }));
//          });
//        },
//        updater: function(selected) {
//          customer = goog.array.find(tl, function(t) { return t.name === selected; });
//          console.log(customer);
//          return selected;
//        }
//      });
//      div.addChild(modules.Button({text: 'Add Client', enabled: true}, 'btn-primary btn-mini', function() {
//        if (customer) {
//          util.addAttendee(e.id, 3, customer.id).done(function() {
//            customers.push(customer.id);
//            countLabel.setData({count: customers.length, capacity: customerCapacity});
//            createAttendeeListItem({roleId: 3, scheduleId: customer.id}, i+1)
//          });
//        }
//      }));
//    }
//  }
//  div.addChild(modules.Button({text: 'Cancel Event', enabled: true}, 'btn-danger btn-small', function() {
//    cancel();
//  }));
//  return div.getInterface();
//};
