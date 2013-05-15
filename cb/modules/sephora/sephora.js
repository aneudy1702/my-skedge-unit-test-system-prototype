var sephora = {};
/** @type {function(): undefined} */
sephora.sephora = function() {
  server.getServiceFields().then(function() {
    var serviceFields = {};
    util.map(arguments[0], function(sf) {
      serviceFields[sf.ref().toJSON()] = sf.name();
    });
    var widget, date, dates, sephoraEventTable, sephoraBookingWidget, sephoraDetailView;
    var bookingInfo = {};
    date = new goog.date.DateTime();
    var makeDates = function(d) {
      var d2 = util.sod(d);
      return [d2, util.addDays(d2, 1), util.addDays(d2, 2)];
    };
    widget = new Moduler('', 'div', function() { return ''; });
    widget.setCSS({
      position: 'absolute',
      height: '100%',
      width: '100%'
    });
    $('body').append(widget.html());

    sephoraEventTable = sephora.sephoraEventTable(function(selectedService) {
      var services = sephoraEventTable.data();
      sephoraBookingWidget = sephora.sephoraBookingWidget(services, selectedService, makeDates(date), serviceFields, function() {
        widget.addChild(sephoraEventTable);
      }, widget);
      widget.removeChild(sephoraEventTable);
    }, serviceFields, function(ss) {
      sephoraDetailView = sephora.eventDetails(ss, serviceFields, function(s) {
        var services = sephoraEventTable.data();
        sephoraBookingWidget = sephora.sephoraBookingWidget(services, ss, makeDates(date), serviceFields, function() {
          widget.addChild(sephoraEventTable);
        }, widget);
        widget.removeChild(sephoraDetailView);
      }, function() {
        widget.removeChild(sephoraDetailView);
        widget.addChild(sephoraEventTable);
      });
      widget.removeChild(sephoraEventTable);
      widget.addChild(sephoraDetailView);
    });
    widget.addChild(sephoraEventTable);
  });
};

/**
 * @param {!Array.<!SK.Service.Service>} services array of services.
 * @param {SK.Service.Service} preselectedService Preselected service, if any.
 * @param {!Array.<!goog.date.DateTime>} dates the dates.
 * @param {!Object} serviceFields The service fields.
 * @param {function():undefined} cancelCB on cancel click.
 * @return {undefined} moduler.
 */
sephora.sephoraBookingWidget = function(services, preselectedService, dates, serviceFields, cancelCB, w) {
  var bw, service, cb1, cb2, cb3, cb4, cb5, userServiceSelection, userTimeSelection, bookingForm, confirmationPage;
  service = preselectedService || services[0];
  var dateRange = dates;
  var populateWidget = function(s, ds) {
    server.getAvailableCreationTimes(s, s.durations()[0], intervalFromDates(util.addDays(ds[0], -3), util.addDays(ds[ds.length - 1], 3))).then(function() {
      w.removeChild(bw);
      bw = sephora.bookingWidget('Make a Reservation', services, s, ds, serviceFields, arguments[0], cb1, cb2, cb3, cb4, cb5);
      w.addChild(bw);
    });
  };
  cb1 = function(newServiceSelection) {
    console.log(newServiceSelection);
    userServiceSelection = newServiceSelection;
    service = newServiceSelection;
    populateWidget(newServiceSelection, dateRange);
  };
  cb2 = function(newTimeSelection) {
    console.log(newTimeSelection);
    userTimeSelection = newTimeSelection;
  };
  cb3 = function(newDates) {
    var dateRange = newDates;
    populateWidget(service, newDates);
  };
  cb4 = function() {
    w.removeChild(bw);
    cancelCB();
  };
  cb5 = function() {
    if (userTimeSelection && userServiceSelection) {
      console.log([userTimeSelection, userServiceSelection]);
      server.createTentativeEvent(userServiceSelection, userTimeSelection, userServiceSelection.durations()[0], null).then(function() {
        bookingForm = sephora.bookingForm('Complete Your Reservation',
                                          userServiceSelection,
                                          serviceFields,
                                          userTimeSelection,
                                          userServiceSelection.durations()[0],
                                          arguments[0],
                                          function(tentativeEvent, fields) {
                                            server.finalizeEvent(tentativeEvent, fields).then(function() {
                                              //server.getEventByRef(tentativeEvent.eventRef).then(function() {
                                              //  confirmationPage = sephora.bookingConfirmation('Your Reservation is Complete',
                                              //                                                 'Sephora Chalkyitsik',
                                              //                                                 arguments[0],
                                              //                                                 userServiceSelection,
                                              //                                                 serviceFields);
                                              //  w.removeChild(bookingForm);
                                              //  w.addChild(confirmationPage);
                                              //});
                                            });
                                          }, function(s) {
                                            w.removeChild(bookingForm);
                                            w.addChild(bw);
                                          });
        w.removeChild(bw);
        w.addChild(bookingForm);
      });
    }
  };
  userServiceSelection = preselectedService;
  populateWidget(service, dates);
  return undefined;
};

/**
 * @param {function(!SK.Service.Service):?} reserve Callback for service selection.
 * @param {!Object} serviceFields fields.
 * @param {function(!SK.Service.Service):?} details Callback for service details.
 * @return {!ModulerInterface} moduler.
 */
sephora.sephoraEventTable = function(reserve, serviceFields, details) {
  var sephoraEventTable = sephora.eventTable([], serviceFields, function(selectedService) {
    reserve(selectedService);
  }, function(selectedService) { 
    details(selectedService); 
  });
  server.getServices().then(function() {
    var services = arguments[0];
    sephoraEventTable.setData(services);
  });
  return sephoraEventTable;
};
