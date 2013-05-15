modules.Footer = function(modalHolder, reportsCallback, servicesCB) {

  var footer = new Moduler('', 'div class="footerNav"'),
  navList = footer.createChild('', 'ul class="nav nav-pills"'),
  servicesBtn = navList.createChild('', 'li rel="tooltip" title="Services"');
  servicesBtn.createChild('&nbsp;', 'a class="icon- imgIcon-service"');
  
  var schedulesBtn = navList.createChild('', 'li rel="tooltip" title="Schedules"');
  schedulesBtn.createChild('', 'a class="icon-calendar"');
  
  var assetsBtn = navList.createChild('', 'li rel="tooltip" title="Manage Assets"');
  assetsBtn.createChild('', 'a class="icon-briefcase"');
  
  var clientsBtn = navList.createChild('', 'li rel="tooltip" title="Clients"');
  clientsBtn.createChild('', 'a class="icon-group"');

  var metricsBtn = navList.createChild('', 'li rel="tooltip" title="Reports"');
  metricsBtn.createChild('', 'a class="icon-bar-chart"');

  var preferencesBtn = navList.createChild('', 'li rel="tooltip" title="Booking Preferences"');
  preferencesBtn.createChild('', 'a class="icon-cogs"');

  servicesBtn.onClick(function() {
    servicesCB();
  });

  metricsBtn.onClick(function() {
    reportsCallback();
  });
  
//  assetsBtn.html().on("click",function(evt){
//    evt.stopPropagation();
//    assetsBtn.html().tooltip('destroy');
//  });

  //  Set Tooltips
    $(servicesBtn.el()).tooltip();
    $(schedulesBtn.el()).tooltip();
    $(assetsBtn.el()).tooltip();
    $(clientsBtn.el()).tooltip();
    $(metricsBtn.el()).tooltip();
    $(preferencesBtn.el()).tooltip();
   
  return footer.getInterface();
};
