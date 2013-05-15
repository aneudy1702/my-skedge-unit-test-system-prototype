/**
 * @param {!Array.<!SK.Service.Service>} services Array of services.
 * @param {!Object} serviceFields the fields.
 * @param {function(!SK.Service.Service):?} cb callback on reserve button click.
 * @param {function(!SK.Service.Service):?} detailsCB callback on details click.
 * @return {!ModulerInterface} Event table interface.
 */
sephora.eventTable = function(services, serviceFields, cb, detailsCB) {
  var c = new Moduler([], 'div id="upComingEventsForm" class="formContainer"', function() { return ''; });
  var div = c.createChild('', 'div class="content"');
  div.createChild('Store Events & Classes', 'h1 id="StoreEventClassesTitle" class="pageTitle"');
  div.createChild('', 'hr class="short"');
  var table = div.createChild('', 'table class="standardTable" cellspacing="5"').createChild('', 'tbody');
  var addTableHeaders = function() {
    var hd = table.createChild('', 'tr class="listBoxHeaders"');
    hd.createChild('', 'td class="eventName listCol"').createChild('Event or Class Name', 'h4 class="headers-tabs"');
    hd.createChild('', 'td class="dateTime listCol"').createChild('Date & Time', 'h4 class="headers-tabs"');
    hd.createChild('', 'td class="description listCol"').createChild('Description', 'h4 class="headers-tabs"');
    hd.createChild('', 'td class="whoAttends listCol"').createChild('Who Can Attend', 'h4 class="headers-tabs"');
    hd.createChild('', 'td class="reserveSpace listCol"').createChild('RSVP', 'h4 class="headers-tabs"');
  };
  c.setUpdateChildren(function(d) {
    goog.array.map(table.children(), function(c) { table.removeChild(c); });
    addTableHeaders();
    util.map(goog.array.filter(d, function(s) { return s.durations().length > 0; }), function(s) { table.addChild(sephora.eventTableRow(s, serviceFields, cb, detailsCB)); });
  });
  c.setData(services);
  return c.getInterface();
};

/**
 * @param {!SK.Service.Service} s Event/Class - a Service
 * @param {!Object} serviceFields fields.
 * @param {function(!SK.Service.Service):?} cb callback on reserve.
 * @param {function(!SK.Service.Service):?} detailsCB callback on reserve.
 * @return {!ModulerInterface}
 */
sephora.eventTableRow = function(s, serviceFields, cb, detailsCB) {
  var e = {
    name: 'event',
    recurrenceDescription: 'Weekdays',
    attendeeRule: 'Open to All'
  };
  var fields = util.getFields(s, serviceFields);
  var row = new Moduler(s, 'tr class="eventListRow listRow"', function() { return ''; });
  var name = row.createChild('', 'td class="eventName listCol noBorder-left"');
  var image = (fields['imageId'] && fields['imageId'] !== "null" ? 'https://skedge.me/image/' + fields['imageId'] : 'cb/css/sephora/sephora_021.jpg');
  name.createChild('', 'div style="height:130px; width:130px; overflow:hidden; float:left; margin-right:8px;"'). 
    createChild('', 'a href="#" class="externalLink"').
    createChild('', 'img src="' + image + '" alt="' + s.name() + '"');
  name.createChild('', 'div class="name"').
    createChild('', 'h4').
    createChild(s.name(), 'a href="#"');
  name.onClick(function() {
    detailsCB(s);
  });
  row.createChild('', 'td class="dateTime listCol"').
    createChild(e.recurrenceDescription, 'span class="block"');
  var description = (fields['Long Description'] && fields['Long Description'] !== null ? fields['Long Description'] : '');
  row.createChild('', 'td class="description listCol"').
    createChild(fields['Long Description'], 'p');
  var whoAttendsBody = row.createChild('', 'td class="whoAttends listCol"').
    createChild('', 'div class="whoAttendsBody"');
  var eligibility = (fields['Eligibility'] && fields['Eligibility'] !== null ? fields['Eligibility'] : 'All are welcome.');
  whoAttendsBody.createChild(eligibility, 'p');
  var logos = whoAttendsBody.createChild('', 'div class="logos"');
  logos.createChild('', 'div');
  logos.createChild('', 'a href="#"');
  var reserveButton = row.createChild('', 'td class="reserveSpace listCol noBorder-left noBorder-right"').
    createChild('Reserve', 'a href="#" class="primaryButton reserveLnk externalLink"');
  reserveButton.onClick(function() {
    cb(s);
  });
  return row.getInterface();
};

/**
 * @param {!SK.Service.Service} s Event/Class - a Service
 * @param {!Object} sf fields.
 * @param {function(!SK.Service.Service):?} onReserveClick callback on reserve.
 * @param {function():?} onBackClick callback on back.
 * @return {!ModulerInterface}
 */
sephora.eventDetails = function(s, sf, onReserveClick, onBackClick) {
  var div = new Moduler(s, 'div class="page center container current"', function() {return '';});
  var fields = util.getFields(s, sf);
  var d = div.createChild('', 'div class="clearfix"');
  d.createChild(s.name(), 'h1 class="pageTitle"');
  var table = d.createChild('', 'table width="100%" cellspacing="0" cellpadding="0" border="0"').createChild('', 'tbody').createChild('', 'tr');
  var image = (fields['imageId'] && fields['imageId'] !== "null" ? 'https://skedge.me/image/' + fields['imageId'] : 'cb/css/sephora/sephora_021.jpg');
  table.createChild('', 'td').createChild('', 'img id="eventDetailsImage" src="' + image + '"');
  var details = table.createChild('', 'td').createChild('', 'div class="leftSpace"');
  var backLink = details.createChild('< back to Store Events and Classes', 'a href="#" class="externalLink right"');
  backLink.onClick(function() {
    onBackClick();
  });
  details.createChild('', 'h3 class="noMargin"');
  details.createChild('', 'br');
  details.createChild('Location:', 'h2');
  details.createChild('Sephora Chalkyitsik', 'h4');
  details.createChild('12 Salmon Street<br/>Chalkyitsik, AK 99788', 'div');
  details.createChild('', 'hr class="default"');
  var description = (fields['Long Description'] && fields['Long Description'] !== null ? fields['Long Description'] : '');
  details.createChild(description, 'p');
  details.createChild('Reservations are strongly encouraged due to limited space.', 'p class="info calloutText"');
  var reserveButton = details.createChild('Reserve', 'a href="#" class="primaryButton"');
  reserveButton.onClick(function() {
    onReserveClick(s);
  });
  return div.getInterface();
};

