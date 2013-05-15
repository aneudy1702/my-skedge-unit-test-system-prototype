/**
 * @param {Object} time Time object from suggestPossibilities.
 * @param {!boolean} booking Is this a booking overlay?
 * @param {!goog.date.DateTime} t1 Start of range.
 * @param {!goog.date.DateTime} t2 end of range.
 * @param {!string} color Color of overlay.
 * @param {function(!number, !number, Object):?=} cb Callback.
 * @return {!ModulerInterface}
 */
modules.ColLayer = function(time, booking, t1, t2, color, cb) {
  var div = new Moduler(time, 'div', function(d, e, c) { 
    c.length = 0;
    return '';
  });
  div.setCSS({
    position: 'absolute',
    top: 0,
    width: 0,
    height:0 
  });
  div.setUpdateChildren(function(d) {
    if (d !== null) {
      div.setCSS({
        height: '100%',
        width: '100%'
      });
      var apptLength;
      var imap;
      if (booking === true) {
        apptLength = d['durations'][0] / 1000;
        imap = d['intervals'];
      }
      else {
        apptLength = null;
        imap = d['availabilities'];
      }
      if (imap !== undefined) {
        var cut = sliceIntervalMap(jsonToIntervalMap(imap), intervalFromDates(t1, t2), false);
        var chunks = goog.array.filter(chunkIntervalMap(cut), function(c) {
          return c.value === true;
        });
        util.map(chunks, function(c) {
          div.addChild(modules.LayerSegment(c, t1, apptLength, color, cb));
        });
      }
    }
    else {
      div.setCSS({
        height: 0,
        width: 0
      });
    }
  });
  return div.getInterface();
};

modules.LayerSegment = function(c, t1, apptLength, color, cb) {
  var container = new Moduler('', 'div class="animated fadeIn"');
  var top;
  container.setCSS({
    position: 'absolute',
    width: '100%',
    top: ((c.interval.start.point - t1) / 86400000 * 100) + '%',
    height: (function() {
      return (c.interval.end.point - c.interval.start.point) / 86400000 * 100 + '%';
    }())
  });
  var segment = container.createChild('', 'div class="overlay translucent"').setCSS({
    height: '100%',
    width: '100%',
    'background-color': color,
    opacity: (apptLength ? 0.5 : 1)
  });
  if (apptLength !== null) {
    var apptBox = new Moduler('', 'div');
    container.onClick(function(){
      var el = apptBox.el();
      el.clickover({
        title: 'New Event',
        html: true,
        content: modules.stub(top, apptLength, cb, function(){ el.clickover('hide'); }).html()
      });
      //cb(top, apptLength);
    });
    var el = container.el();
    el.mousemove(function(e) {
      if(c.interval.end.point - c.interval.start.point >= apptLength) {
        var offset = el.offset().top;
        var position = e.pageY - offset;
        var pixelsToTime = function(px) {
          return (c.interval.end.point - c.interval.start.point) / el.height() * px;
        };
        var timeToPixels = function(ms) {
          return el.height() / (c.interval.end.point - c.interval.start.point) * ms;
        };
        var positionInTime = c.interval.start.point + pixelsToTime(position);
        top = (function() {
          if (c.interval.start.point > positionInTime - apptLength / 2) {
            return c.interval.start.point;
          }
          else if (positionInTime + apptLength / 2 > c.interval.end.point) {
            return c.interval.end.point - apptLength;
          }
          else {
            return positionInTime - apptLength / 2;
          }
        }());
        apptBox.setCSS({
          border: '2px #606060 dashed',
          position: 'absolute',
          top: timeToPixels(top - c.interval.start.point),
          height: timeToPixels(apptLength) - 4,
          left: 0,
          right: 1
        });
        container.addChild(apptBox);
      }
    }).mouseleave(function() {
      container.removeChild(apptBox);
    });
  }
  return container.getInterface();
};

/**
 * @param {!number} top ms from sod.
 * @param {!number} apptLength Appointment length.
 * @param {!function(!number, !number, Object):?} book Booking callback.
 * @param {!function():?} close Dismiss popup.
 * @return {!ModulerInterface}
 */
//modules.BookingForm = function(top, apptLength, book, close) {
//  var div = new Moduler('', 'div');
//  var cSearch = div.createChild('', 'input type="text" data-provide="typeahead" placeholder="Clients..."');
//  cSearch.setCSS({ width: 100 });
//  var tl = [];
//  var customer;
//  cSearch.html().typeahead({
//    source: function(query, process) {
//      var search = util.thingSearch(3, query);
//      return search.done(function() { 
//        tl = util.processThingResponse(arguments[0]);
//        return process(util.map(tl, function(result) { return result.name; }));
//      });
//    },
//    updater: function(selected) {
//      customer = goog.array.find(tl, function(t) { return t.name === selected; });
//      return selected;
//    }
//  });
//  div.addChild(modules.Button({text: 'Cancel', enabled: true}, 'btn-small', function() { close(); }));
//  div.addChild(modules.Button({text: 'Book Event', enabled: true}, 'btn-primary btn-small', function() {
//    book(top, apptLength, customer);
//  }));
//  return div.getInterface();
//};

