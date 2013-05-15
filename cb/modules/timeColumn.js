/** @type {function(): ModulerInterface} */
modules.TimeColumn = function() {
  var timeCol =  new Moduler('', 'div class="timeCol"', function() {return '';});
  timeCol.setCSS({
    border: '1px transparent solid',
    position: 'absolute',
    height: boot.calendarHeight + '%',
    width: boot.timeColumnWidth + '%',
    borderRight: '1px solid #cccccc'
  });
  var cut = 100/(96)
      , pass = 1
 
 // Tick marks   
  for(var i=0; i < (96); i++){
    timeCol.createChild('', 'div class="tickmark"').setCSS({
      width: (pass==2||pass==4)? 5 : 10//(pass == 1)? 10 : 8
      , top : (cut * i) + "%"
    })
    pass = (pass == 4)? 1: pass + 1
  }

  var hourNames = ['12 am', '1 am', '2 am', '3 am', '4 am', '5 am', '6 am', '7 am', '8 am', '9 am', '10 am', '11 am', 'Noon', '1 pm', '2 pm', '3 pm', '4 pm', '5 pm', '6 pm', '7 pm', '8 pm', '9 pm', '10 pm', '11 pm', '12 am'];
  var addChildrenToTimeCol = function(hourNames){
    util.map(util.range(0, 23, 1), function(ts, i){
      var childContainer = timeCol.createChild(hourNames[i + 1],'div class="timetext"');
      childContainer.setCSS({
         height : (100 / 24) + '%'
        , top: (100 / 24 + 100 / 24 * i) + '%'
       });

    });
  };
  addChildrenToTimeCol(hourNames);
  return timeCol.getInterface();
};

// This module has no data to set or get.
// There is currently no cause to redraw it.
// It does not communicate with the server.
