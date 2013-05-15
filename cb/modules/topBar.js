/** @type {function():ModulerInterface} */
modules.TopBar = function() {
  var topBar = new Moduler('', 'div class="navbar navbar-fixed-top topBar"');
  /*
  var searchform = navbar_inner.createChild('','div class="searchForm input-append pull-right"');
      searchform.createChild('','input class="input-medium input-inverse" type="text" placeholder="search"');
      searchform.createChild('<i class="icon-search"></i>','button class="btn btn-inverse" type="button"');
 */ 
  return topBar.getInterface();
};
