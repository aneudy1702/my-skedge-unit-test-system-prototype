/**
 * @param {!number} number column number
 * @param {!number} total total number of columns
 * @param {!SK.Thing.Thing} thing Thing
 * @return {!ModulerInterface}
 */
modules.scheduleColumn = function(number, total, thing) {
  var col = new Moduler({number: number, thing: thing}, 'div class="calColumn"', function() { return ''; });
  col.setCSS({
    width: (99 / total) + '%',
    left: (99 / total * number) + '%',
    position: 'absolute',
    height: boot.calendarHeight + '%',
    borderRightWidth: (number === total - 1 ? '1px' : '0px')
  });
  col.addChild(modules.mkHourBoxes());
  return col.getInterface();
};

modules.scheduleColumnSet = function(thing, numDays) {
  var container = new Moduler(thing, 'div', function() { return ''; });
  container.addChild(modules.TimeColumn());
  var colSet = container.createChild(thing, 'div', function() { return ''; });
  colSet.setCSS({
    position: 'absolute',
    height: '100%',
    right: 0,
    left: boot.timeColumnWidth + '%'
  });
  var cols = util.map(util.range(0, numDays, 1), function(i) {
    return colSet.addChild(modules.scheduleColumn(i, numDays, thing));
  });
  return container.getInterface();
};

