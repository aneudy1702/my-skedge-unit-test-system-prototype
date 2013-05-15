/** @type {function(!Object, !string, function(!boolean):?): !ModulerInterface} */
modules.Button = function(data, cssclass, cb) {
  var button = new Moduler({text: data.text, enabled: data.enabled, state: false}, 'button class="btn"', function(d){
    return data.text;
  });
  button.addCSSClass(cssclass);
  button.onClick(function(e){ 
    e.preventDefault();
    e.stopPropagation();
    if (button.data().enabled === true) {
      var d = button.data();
      d.state = !d.state;
      button.setData(d);
      cb(button.data().state);
    }
  });
  return button.getInterface();
};
// TODO: Add disabled state to button
