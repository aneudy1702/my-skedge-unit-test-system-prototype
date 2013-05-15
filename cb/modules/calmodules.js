var offsets = {};
offsets.timeColLeft = 5;
var modules = {};
/** @type {function(?=, ?=, ?=, ?=, ?=):!ModulerInterface} */
modules.stub = function() {
  var mod = new Moduler(arguments[0], 'div');
  return mod.getInterface();
};

