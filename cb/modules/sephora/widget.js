/**
 * @param {!goog.date.DateTime} time Time represented by li.
 * @param {!function((goog.date.DateTime|null)):?} selectionCB Function called on selection/deselection.
 * @return {!ModulerInterface} Single list item.
 */
sephora.timeListItem = function(time, selectionCB) {
  var df = new goog.i18n.DateTimeFormat('h:mm a');
  var li = new Moduler({time: time, selected: false}, 'li class="availabilityItem"', function(d, e) { 
    if (d.selected === true) {
      util.addCSSClass(e, 'selected');
    }
    else {
      util.removeCSSClass(e, 'selected');
    }
    return df.format(d.time);
  });
  li.onClick(function() {
    if (li.data().selected === true) {
      li.setData({time: li.data().time, selected: false});
      selectionCB(null);
    }
    else {
      li.setData({time: li.data().time, selected: true});
      selectionCB(li.data().time);
    }
  });
  return li.getInterface();
};

/**
 * @param {!Array.<goog.date.DateTime>} times Times to display in list.setData.
 * @param {function((goog.date.DateTime|null)):?} cb Callback on selection.
 * @return {!ModulerInterface} Return the ul.
 */
sephora.timeList = function(times, cb) {
  var list = new Moduler({times: times, selected: null}, 'ul class="availableTimesList"', function() { return ''; });
  var deselectOthers = function(time) {
    util.map(list.children(), function(c) {
      if (c.data().time !== time && c.data().selected === true) {
        c.setData({time: c.data().time, selected: false});
      }
      else if (c.data().time === time && c.data().selected !== true) {
        c.setData({time: c.data().time, selected: true});
      }
    });
  };
  var addTimesToList = function() {
    util.map(list.data().times, function(t) {
      list.addChild(sephora.timeListItem(t, function(d) {
        list.setData({times: list.data().times, selected: d});
        cb(d);
      }));
    });
  };
  list.setUpdateChildren(function(d, old) {
    if (old.times !== undefined && d.times.toString() !== old.times.toString()) {
      util.map(list.children(), function(c) { list.removeChild(c); });
      addTimesToList();
    }
    if (d.selected !== old.selected) {
      deselectOthers(d.selected);
    }
  });
  addTimesToList();
  return list.getInterface();
};

/**
 * @param {!Array.<goog.date.DateTime>} times Times to display in ul element.
 * @param {!string} title Header to display above ul.
 * @param {function(?):?} cb Callback on header click.
 * @return {!ModulerInterface} Header with associated times ul.
 */
sephora.dayChunk = function(times, title, cb) {
  var container = new Moduler({focus: false, selection: null, times: times}, 'div class="accordion"', function(d) { return ''; });
  var header = container.createChild('', 'h3 class="daySectionHeader"');
  header.createChild(title, 'a href="#"');
  if (container.data().times.length > 0) {
    header.addCSSClass('enabled');
  }
  else {
   header.removeCSSClass('enabled');
  }
  var list = container.createChild('', 'div class="daySection"').addChild(sephora.timeList(times, function(d) {
    container.setDataNoBuild({focus: true, selection: d, times: container.data().times});
    container.updateChildren();
    cb(d);
  }));

  list.setCSS({ display: 'none' });
  if (container.data().times.length > 0) {
    header.onClick(function() {
      container.setData({ focus: !container.data().focus, selection: null, times: container.data().times });
      cb((container.data().times[0]));
    });
  }
  else {
    header.removeCSSClass('enabled');
  }
  container.setUpdateChildren(function(d, old) {
    if (d.focus === true) {
      list.setCSS({ display: 'block' });
      header.addCSSClass('active');
    }
    else {
      list.setCSS({ display: 'none' });
      header.removeCSSClass('active');

    }
    if (old.times !== undefined && old.times.toString() !== d.times.toString()) {
      container.removeChild(list);
      list = container.addChild(sephora.timeList(d.times, function(d) {
        container.setDataNoBuild({focus: true, selection: d, times: container.data().times });
        cb(d);
      }));
    }
    else if (d.selection !== old.selection) {
      list.setData({times: list.data().times, selected: d.selection});
    }
  });
  return container.getInterface();
};

/**
 * @param {!goog.date.DateTime} date The date for this dayWidget.
 * @param {!Array} possResult The availability to display.
 * @param {function(?):?} cb Callback when a selection is made in this widget.
 * @return {!ModulerInterface} The dayWidget, made up of M/A/E chunks.
 */
sephora.dayWidget = function(date, possResult, cb) {
  var container = new Moduler({date: date, focus: false, selection: null, possibilities: possResult}, 'div class="dayColumn"', function() { return ''; });
  var df = new goog.i18n.DateTimeFormat('EEE MMM d');
  var header = container.createChild(df.format(date), 'div class="dayLabelContainer"', function(d) {
    return '<div class="dayLabel">' + d + '</div>';
  });

//  var poss = util.possibilitiesToStartTimes(container.data().possibilities,
//                                            intervalFromDates(util.sod(date), util.addDays(util.sod(date), 1)),
//                                            [0, 15, 30, 45],
//                                            3600000
//                                           );
  var currentTime = new goog.date.DateTime();
  var poss = goog.array.filter(container.data().possibilities, function(p) { return currentTime < p; });
  var dayStart = util.sod(date);
  var morningEnd = util.topOfTheHour(date, 12);
  var afternoonEnd = util.topOfTheHour(date, 16);
  var dayEnd = util.sod(util.addDays(date, 1));
  var morning = {
    times: goog.array.filter(poss, function(p) { return dayStart <= p && p < morningEnd; }),
    header: 'Morning'
  };
  var afternoon = {
    times: goog.array.filter(poss, function(p) { return p >= morningEnd && p < afternoonEnd; }),
    header: 'Afternoon'
  };
  var evening = {
    times: goog.array.filter(poss, function(p) { return afternoonEnd < p  && p < dayEnd; }),
    header: 'Evening'
  };

  util.map([morning, afternoon, evening], function(c) {
    container.addChild(sephora.dayChunk(c.times, c.header, function(d) {
      container.setDataNoBuild({ selection: d, focus: true, possibilities: container.data().possibilities, date: container.data().date });
      container.updateChildren();
      util.map(container.children(), function(child) {
        if (child.data().times && !goog.array.contains(child.data().times, d)) {
          child.setData({focus: false, selection: null, times: child.data().times});
        }
      });
      cb(d);
    }));
  });
  container.setUpdateChildren(function(d, old) {
    if (d.focus === true) {
      container.addCSSClass('dayColumn-activated');
    }
    else {
      container.removeCSSClass('dayColumn-activated');
      util.map(container.children(), function(child) {
        if (child.data().times) {
          child.setData({focus: false, selection: null, times: child.data().times});
        }
      });
    }
  });
  return container.getInterface();
};

/**
 * @param {Array.<goog.date.DateTime>} dates The dates this widget displays.
 * @param {!Array} possResult Availability to display. 
 * @param {function(?):?} cb Callback on selection.
 * @param {function(Array.<goog.date.DateTime>):?} dateCB callback on date change.
 * @return {!ModulerInterface} MultiDayWidget.
 */
sephora.multiDayWidget = function(dates, possResult, cb, dateCB) {
  var container = new Moduler({dates: dates, possibilities: possResult, selection: null}, 'div id="calendarx" class="clear clearfix"', function(d, e, c) {
    return '';
  });
  var left = container.createChild('', 'div class="navContainer left"').createChild('', 'button class="weekNav navBack right"');
  var div = container.createChild('', 'div id="timeline" class="left"');
  var right = container.createChild('', 'div class="navContainer left"').createChild('', 'button class="weekNav navForward left"');
  var addDayWidgets = function() {
    util.map(container.data().dates, function(date) {
      div.addChild(sephora.dayWidget(date, container.data().possibilities, function(d) {
        var c = container.data();
        container.setDataNoBuild({dates: c.dates, possibilities: c.possibilities, selection: d });
        util.map(div.children(), function(c) {
          if (!util.sod(d).equals(util.sod(c.data().date))) {
            var x = c.data();
            x.focus = false; x.selection = null;
            c.setData(x);
          }
        });
        cb(d);
      }));
    });
  };
  left.onClick(function() {
    var newDates = util.map(container.data().dates, function(d) {
      return util.addDays(d, -1);
    });
    dateCB(newDates);
  });
  right.onClick(function() {
    var newDates = util.map(container.data().dates, function(d) {
      return util.addDays(d, 1);
    });
    dateCB(newDates);
  });
  container.setUpdateChildren(function(d, old) {
    if (d.dates !== old.dates) {
      util.map(div.children(), function(c) { div.removeChild(c); });
      addDayWidgets();
    }
  });
  addDayWidgets();
  return container.getInterface();
};

/**
 * @param {Array.<SK.Service.Service>} services Array of services.
 * @param {SK.Service.Service} preselection Preselected service.
 * @param {function(?):?} selectionCB Callback on service selection.
 * @return {!ModulerInterface} Dropdown for services.
 */
sephora.serviceSelector = function(services, preselection, selectionCB) {
  var container = new Moduler({services: services, selection: preselection}, 'div class="selectServiceContainer clearRight right half"', function() {return '';});
  container.createChild('Change Service:<br>', 'label class="secondaryLabel selectLabel"');
  var select = container.createChild(services, 'div class="chzn-container chzn-container-single chzn-container-active"', function(d, e, c) {
    return '';
  });
  var selected = select.createChild('', 'a href="#" class="chzn-single"', function(d) { return ''; });
  var selectedLabel = selected.createChild(preselection, 'span', function(d) { 
    var duration = (d.durations().length > 0 ? ' - ' + util.msToHrsAndMinutesString(d.durations()[0]) : '');
    return d.name() + duration; 
  });
  var triangle = selected.createChild("&#x25BC;", 'div class="chzn-triangle"');
  var listDiv = select.createChild({open: false}, 'div class="chzn-drop"', function(d) { return '';});
  listDiv.setCSS({
    left: '0px',
    top: '19px',
    width: '253px',
    height: 'auto',
    display: 'none'
  });
  listDiv.setUpdateChildren(function(d) {
    if (d.open === true) listDiv.setCSS({ display: 'block' });
    else listDiv.setCSS({ display: 'none' });
  });
  var list = listDiv.createChild('', 'ul class="chzn-results"');
  var addListItem = function(s, d) {
    var x = list.createChild({service: s, duration: d}, 'li class="active-result"', function(data) { 
      var duration = (d ? ' - ' + util.msToHrsAndMinutesString(data.duration) : "");
      return data.service.name() + duration; 
    });
    if (container.data().selection && s.ref() === container.data().selection.ref()) {
      x.addCSSClass('result-selected');
    }
    x.on('mouseenter', function(e) {
      x.addCSSClass('highlighted');
    });
    x.on('mouseleave', function(e) {
      x.removeCSSClass('highlighted');
    });
    x.on('click', function() {
      container.setData({services: container.data().services, selection: x.data().service});
      selectionCB(x.data());
    });
  };
  var addListItems = function() {
    util.map(goog.array.filter(container.data().services, function(s) { return s.durations().length > 0; }), function(s) {
      if (s.durations().length > 0) {
        util.map(s.durations(), function(d) {
          addListItem(s, d);
        });
      }
      else {
        addListItem(s, null);
      }
    });
  };
  addListItems();
  triangle.onClick(function() {
    listDiv.setData({open: !listDiv.data().open});
  });
  selectedLabel.onClick(function() {
    listDiv.setData({open: !listDiv.data().open});
  });
  container.setUpdateChildren(function(n, o) {
    if (n.services.toString() !== o.services.toString()) {
      util.map(list.children(), function(c) { list.removeChild(c); });
      addListItems();
    }
    selectedLabel.setData(n.selection);
    listDiv.setData({open: false});
  });
  return container.getInterface();
};

/**
 * @param {!string} title Title of widget.
 * @param {!Array.<SK.Service.Service>} services Services.
 * @param {!SK.Service.Service} svc Currently selected service.
 * @param {!Object} serviceFields service fields.
 * @param {!function(?):?} cb callback when service changes.
 * @return {!ModulerInterface} Interface for header.
 */
sephora.widgetHeaderArea = function(title, services, svc, serviceFields, cb) {
  var service = svc || services[0];
  var headerArea = new Moduler(service, 'header class="clearfix"', function() {
    return '';
  });
  var sf = util.getFields(service, serviceFields);
  var heading = headerArea.createChild(title, 'h1 class="pageTitle"');
  var storeInfo = headerArea.addChild(sephora.storeInfoBox());
  var serviceInfo = headerArea.createChild('', 'div class="storeServices half right"');
  serviceInfo.createChild('Selected Service:', 'h3');
  var selectedService = serviceInfo.createChild(service, 'h4 class="selectedServiceName"', function(d) {
    return d.name();
  });
  var serviceDescriptionP = serviceInfo.createChild('', 'p class="apptInfoDesc"');
  var serviceDescText = serviceDescriptionP.createChild(util.serviceFieldsAlternative(sf['Description'], 'No description'), 'span class="selectedServiceDesc"');
  var serviceDescLink = serviceDescriptionP.createChild(service, 'a class="moreInfoButton" href="#"', function(d) {
    return 'More Info';
  });
  serviceDescLink.onClick(function() {
    var popup = sephora.infoPopup(headerArea.data().name(), util.serviceFieldsAlternative(sf['Long Description'], sf['Description']), function() {
      headerArea.removeChild(popup);
    });
    headerArea.addChild(popup);
  });
  headerArea.setUpdateChildren(function(d, o) {
    selectedService.setData(d);
  });
  var serviceSelector = headerArea.addChild(sephora.serviceSelector(services, service, function(d) {
    sf = util.getFields(d.service, serviceFields);
    serviceDescText.setData(util.serviceFieldsAlternative(sf['Description'], 'No description'));
    serviceDescLink.setData(d.service);
    headerArea.setData(d.service);
    cb(d.service);
  }));
  return headerArea.getInterface();
};

sephora.bookingWidget = function(title, services, service, dates, serviceFields, availability, serviceChangeCB, timeSelectCB, dateChangeCB, cancelCB, holdCB) {
  var div = new Moduler({service: service, dates: dates, availability: availability}, 'div', function() {return '';});
  var widgetHeader = div.addChild(sephora.widgetHeaderArea(title, services, service, serviceFields, serviceChangeCB));
  var widgetBody;
  div.createChild('', 'hr class="default"');
  var rangeDiv = div.createChild('', 'div id="selectDateControls" class="clearfix"');
      rangeDiv.createChild('Select an Available Appointment', 'h2 class="left"');
      
  var dr = rangeDiv.createChild('', 'div class="dateRangeSelector right"');
      dr.createChild('Select a new date:', 'label class="secondaryLabel"');

  var datePicker = dr.createChild('', 'input type="text" id="dateRangeSelectField" class="dateRangeSelectField" name="startDate"',
    function (d, e){
      $(e).datepicker({
        onSelect:function (dateText, dateObject) {
            var newDate = new goog.date.DateTime(dateObject['selectedYear'], dateObject['selectedMonth'], dateObject['selectedDay']);
            var newDates = util.map(widgetBody.data().dates, function(d,i){
             return util.addDays(newDate, i);
            });
            dateChangeCB(newDates);
        },
        dayNamesMin:["S", "M", "T", "W", "T", "F", "S"],
        showButtonPanel: true,
        minDate: 0,
        nextText: "Next >",
        prevText: "< Prev"
      });
     return d;
  });
  var datePickerButton = dr.createChild('','button id="calendarButton"');
    datePickerButton.onClick(function() {
      datePicker.el().datepicker("show");
    });
    widgetBody = div.addChild(sephora.multiDayWidget(dates, availability, timeSelectCB, dateChangeCB));
    div.setUpdateChildren(function(n, old) {
    widgetBody.setData({
      dates: n.dates,
      possibilities: n.availability,
      selection: null
    });
  });

  var actionContainer = div.createChild('', 'div id="actionsContainer"');
  var nextBtn = actionContainer.createChild('Next Step','button class="nextStepLnk primaryButton right"');
  var cancelBtn = actionContainer.createChild('Cancel','a class="cancelTimeSelection right externalLink"');
  cancelBtn.onClick(function() {
    cancelCB();
  });
  nextBtn.onClick(function() {
    holdCB();
  });
  return div.getInterface();
};

sephora.infoPopup = function(title, message, cb) {
  var div = new Moduler('', 'div class="popupBox textCenter"');
  var close = div.createChild('', 'a id="closeButton"');
  close.onClick(function() {
    cb();
  });
  div.createChild(title, 'h1 class="smallTitle"');
  div.createChild(message, 'p');
  return div.getInterface();
};

sephora.storeInfoBox = function() {
  var storeInfo = new Moduler('', 'div class="storeLocation half left"');
  storeInfo.createChild('Location:', 'h3');
  storeInfo.createChild('Sephora Chalkyitsik', 'h4 class="businessName left"');
  storeInfo.createChild('12 Salmon Street<br/>Chalkyitsik, AK 99788<br/>(212) 293-9478', 'p class="clear apptInfoDesc"');
  return storeInfo.getInterface();
};

sephora.bookingForm = function(title, service, serviceFields, time, duration, tentativeEvent, bookingCB, backCB) {
  var div = new Moduler('', 'div');
  var sf = util.getFields(service, serviceFields);
  var headerArea = div.createChild(service, 'header class="clearfix"', function() { return ''; });
  headerArea.createChild(title, 'h1 class="pageTitle"');
  headerArea.addChild(sephora.storeInfoBox());
  var serviceInfo = headerArea.createChild('', 'div class="storeServices half right"');
  serviceInfo.createChild('Selected Service:', 'h3');
  var selectedService = serviceInfo.createChild(service, 'h4 class="selectedServiceName"', function(d) { return d.name(); });
  var serviceDescriptionP = serviceInfo.createChild('', 'p class="apptInfoDesc"');
  var serviceDescText = serviceDescriptionP.createChild(util.serviceFieldsAlternative(sf['Description'], 'No description'), 'span class="selectedServiceDesc"');
  var serviceDescLink = serviceDescriptionP.createChild(service, 'a class="moreInfoButton" href="#"', function(d) {
    return 'More Info';
  });
  serviceDescLink.onClick(function() {
    var popup = sephora.infoPopup(headerArea.data().name(), util.serviceFieldsAlternative(sf['Long Description'], sf['Description']), function() {
      headerArea.removeChild(popup);
    });
    headerArea.addChild(popup);
  });
  div.createChild('', 'hr class="default"');
  var apptInfo = div.createChild('', 'div class="infoContainer center textCenter" id="appointmentInfoContainer"');
  apptInfo.createChild('Your Beauty Studio Appointment', 'h2 class="legendx"');
  apptInfo.createChild(time, 'div class="appointmentInfo selectedDate dateTime"', function(d) {
    var dfDate = new goog.i18n.DateTimeFormat('MMMM d, yyyy');
    var dfTime = new goog.i18n.DateTimeFormat('h:mm a');
    var endTime = new goog.date.DateTime();
    endTime.setTime(d.getTime() + duration);
    return dfDate.format(d) + '<br/>' + dfTime.format(d) + ' - ' + dfTime.format(endTime);
  });
  apptInfo.createChild('Sephora Chalkyitsik', 'div class="appointmentInfo vendorName"');
  var bookingForm = div.createChild('', 'div id="customerFormContainer" class="infoContainer center clearfix form"').
    createChild('', 'form name="customerForm" id="customerForm" class="clear"');
  bookingForm.createChild('', 'div id="errorContainer"');
  var form = bookingForm.createChild('', 'div class="mainFormFieldsContainer"');
  form.createChild('* required field', 'div class="right"', function(d) {
    return '<small>' + d + '</small>';
  });
  var fields = goog.array.flatten($.map(tentativeEvent.roles, function(role) {
    return $.map(role.thingFields, function(f) {
      return form.addChild(sephora.textInputField(f, role.role, 'left inputContainer'));
    });
  }));
  fields[0].addCSSClass('clear');
  var notes = form.createChild('', 'div class="clear inputContainer"');
  notes.createChild('Notes', 'label for="Notes"');
  notes.createChild('', 'textarea name="Notes" id="Notes"');
  var checkboxContainer = form.createChild('', 'div class="formFieldsContainer customTextFieldx"').createChild('', 'label class="checkboxLabel"');
  var checkbox = checkboxContainer.createChild('', 'input id="agreeToTerms" type="checkbox" class="agreeToTerms customTextFieldx widgetFormField skdgFormField" alternateerrormessage="You must agree in order to proceed"'); 
  checkbox.onClick(function(){
    checkboxContainer.removeCSSClass("errorState");
  });
  checkboxContainer.createChild('', 'span class="sephPrivacyPolicy"', function() {
    return 'I agree to the' +
      '<a target="_new" href="http://sephora.com/contentStore/mediaContentTemplateNoNav.jsp?mediaId=11300018"> Sephora Terms and Conditions</a>' +
      ' and ' +
      '<a target="_new" href="http://sephora.com/contentStore/mediaContentTemplateNoNav.jsp?mediaId=12300066">Sephora Privacy Policy</a>';
  });
  checkboxContainer.createChild(' &larr; You must agree in order to proceed', 'span class="errorNote"');
  var actionsArea = bookingForm.createChild('', 'div class="actionsArea clear"');
  var changeAppt = actionsArea.createChild('Change appointment', 'a href="#" class="changeEditLnk widgetLink"');
  var submit = actionsArea.createChild('Submit', 'a href="#" class="nextStepLnk primaryButton submitAppointment"');
  submit.onClick(function() {
    var valid = true;
    var roles = {};
    util.map(fields, function(f) {
      f.removeCSSClass("errorState");
      var d = f.data();
      
      // Validation Fields
      if(d.field.required() && d.input.length < 1){
        f.addCSSClass("errorState");
        valid = false;
      }
      var roleRef = d.role.ref().value;
      var fieldRef = d.field.ref().value;
      if (roles[roleRef] === undefined) { 
        roles[roleRef] = {}; 
      }
      roles[roleRef][fieldRef] = function() {
        if (d.field.required()) {
          return [d.field.type()[0], d.input];
        }
        else {
          return [d.field.type()[0], [d.field.type()[1][0], d.input]];
        }
      }();
    });
    // Validation Agree
    checkboxContainer.removeCSSClass("errorState");
    if(!checkbox.el().is(':checked')){
      checkboxContainer.addCSSClass("errorState");
      valid = false;
    }
    if(valid){
      bookingCB(tentativeEvent, roles);
    }
      
  });
  changeAppt.onClick(function() {
    backCB(service);
  });
  return div.getInterface();
};

sephora.textInputField = function(thingField, role, klass) {
  var id = thingField.name().replace(/\s+/g, ' ');
  var field = new Moduler({field: thingField, role: role, id: id, input: ''}, 'div class="' + klass + '"', function() { return ''; });
  field.createChild(thingField, 'label for="' + id + '"', function(d) {
    return thingField.name() + (d.required() ? ' *' : '');
  });
  if(field.data().field.required() === true) {
    field.createChild(' &larr; Required', 'span class="errorNote"');
  }
  var input = field.createChild('', 'input type="text" name="' + id + '" id="' + id + '"');
  input.el().on("focus", function() {
    field.removeCSSClass("errorState");
  });
  setInterval(function() {
    field.setDataNoBuild({field: field.data().field, role: field.data().role, id: field.data().id, input: input.el().val()});
  }, 100);
  return field.getInterface();
};

sephora.bookingConfirmation = function(title, locationName, event, selectedService, serviceFields) {
  var dateformat = new goog.i18n.DateTimeFormat('MMMM d, yyyy');
  var timeformat = new goog.i18n.DateTimeFormat('h:mm a');
  var dateStr = dateformat.format(event.startTime());
  var timeStr = timeformat.format(event.startTime()) + " - " + timeformat.format(event.endTime());
  
  var confirmationSection = new Moduler('', 'div class="confirmationSection"', function(d){return '';});
      confirmationSection.addChild(sephora.widgetHeaderArea(title, [], selectedService, serviceFields, function(){}));
      confirmationSection.createChild('','hr class="default"');
  
  var eventDetails = confirmationSection.createChild('','div id="confirmInfoContainer" class="infoContainer center textCenter"');
      eventDetails.createChild(title,'h2 class="legend"');
      eventDetails.createChild(event.value.summary,'h5 class="headerText selectedServiceName"');
      eventDetails.createChild(locationName,'div class="appointmentInfo vendorName"');
      eventDetails.createChild(dateStr,'div class="appointmentInfo selectedDate dateTime"');
      eventDetails.createChild(timeStr,'div class="appointmentInfo selectedDate dateTime"');

    // link addresses
    // <a class="rescheduleLink externalLink" href="/about/reservations/find.jsp?firstName=Tim&amp;lastName=Camuti&amp;email=tim%2Bclient%40skedge.me&amp;locationsManager=1&amp;action=change&amp;attendeeToken=HAAzwHWgpm1QxUeK">change</a> or</span>
    // <a class="aptCancelLink externalLink" href="/about/reservations/find.jsp?firstName=Tim&amp;lastName=Camuti&amp;email=tim%2Bclient%40skedge.me&amp;locationsManager=1&amp;action=cancel&amp;attendeeToken=HAAzwHWgpm1QxUeK">cancel</a>
    
  var actionLinks = eventDetails.createChild('','div class="changeCancelLinks"');
  var changeLink = actionLinks.createChild('change','a class="rescheduleLink externalLink"');
      actionLinks.createChild(' or ','span'); // kind of inefficient
  var cancelLink = actionLinks.createChild('cancel','a class="aptCancelLink externalLink"');
      actionLinks.createChild(' your appointment','span');
      eventDetails.createChild('Please arrive five minutes before your scheduled appointment. Check with a Sephora representative upon arrival.','p class="appointmentInfo appointmentMessage" ');
      eventDetails.createChild('','hr class="short bsProfile"');

 return confirmationSection.getInterface();
};

