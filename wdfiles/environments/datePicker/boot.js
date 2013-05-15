var boot = {};
boot.server = 'http://localhost:8000';//'http://192.168.1.139:8000';//'http://serrano:8000';
boot.leftNavWidth = 20; // to be used as %
boot.timeColumnWidth = 5; //%
boot.navHeight = 42; // px
boot.footerHeight = 50; // px
boot.calendarHeight = 150; // %
boot.bookingMenuHeight = 150; //px

/** @type {function(): undefined} */
boot.strap = function() {
  var date, preselected, nav, week, left;
  date = util.sow(new goog.date.DateTime());
  preselected = new goog.structs.Set([1,4,5,7,8,10]);
  nav = modules.Nav(date, function(newDate) {
    date = newDate;
    week.setData({selected: preselected, startDate: date});
  });
  left = modules.LeftNav(preselected, function() {
    week.setData({selected: left.data().selected, startDate: date});
  });
  week = modules.WeekView(preselected, date);  
  $('body').append(nav.html());
  $('body').append(left.html());
  $('body').append(week.html());
};

var today, dp1, presetDate;
boot.test = function(){
  today = new goog.date.Date();
  // presetDate = new goog.date.Date(1993,01,17); 
  //default datepicker - no present date. popup appears.
  dp1 = modules.DatePicker();
  $('body').append(dp1.html());
};
 
$(document).ready(function() {
  boot.test();
});