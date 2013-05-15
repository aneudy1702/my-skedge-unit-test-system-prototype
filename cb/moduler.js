/** @typedef {{html: function():Element, data: function():?, setData: function(?):?}} */
var ModulerInterface;
/**
 * @param {?} dataInput Module data.
 * @param {!string} eltype Type of element.
 * @param {function(?, Element, Array.<Object>):(!string)=} builder Builder function.
 * @constructor
 */
var Moduler = function(dataInput, eltype, builder) {
  /** @type {!Array.<!Moduler>} */ var children = [];
  var data = dataInput;
  var oldData = null;
  var ie = navigator.appVersion.search('MSIE') === -1 ? false : true;
  var callbacks = [];
  /** @type {Element} */ var el = document.createElement(eltype.split(' ')[0]);
  var parseEl = function() {
    var atts = eltype.substring(eltype.search(' ') + 1);
    var findAndSetAttribute = function(att) {
      if (atts.search(att + '=') !== -1) {
        var r = new RegExp(att + '=\"[^\"]*', 'g');
        el.setAttribute(att, atts.match(r)[0].split('="')[1]);
      }
    };
    var attributes = ['id', 'class', 'type', 'for', 'name', 'src', 'alt', 'title'];
    goog.array.map(attributes, function(a) {
      findAndSetAttribute(a);
    });
  };
  parseEl();
  /** @type {function():Element} */
  var element = function() {
    return el;
  };
  /** @type {function(!Object):undefined} */
  var setCSS = function(css) {
    $(el).css(css);
  };
  /** @type {function():Element} */
  var build = function() {
    var oldEl;
    var inner;
    if (el.parentNode !== null) {
      oldEl = el;
      el = oldEl.cloneNode(false);
      if (builder === undefined) {
        inner = data;
      }
      else {
        inner = builder(data, el, children);
      }
      if (inner !== '') {
        el.innerHTML = inner;
      }
      oldEl.parentNode.replaceChild(el, oldEl);
      if (!ie) {
        goog.array.map(callbacks, function(cb) {
          setCB(cb.event, cb.cb);
        });
      }
    }
    else {
      oldEl = el;
      el = oldEl.cloneNode(false);
      if (builder === undefined) {
        inner = data;
      }
      else {
        inner = builder(data, el, children);
      }
      if (inner !== '') {
        el.innerHTML = inner;
      }
      if (!ie) {
        goog.array.map(callbacks, function(cb) {
          setCB(cb.event, cb.cb);
        });
      }
    }
    updateChildren(data, oldData);
    goog.array.map(children, function(c) {
      return el.appendChild(c.html());
    });
    return el;
  };
  /**
  * @template T
  * @param {T} d Data to set.
  * @return {T}
  */
  var setData = function(d) {
    oldData = data;
    data = d;
    build();
    return data;
  };
  /**
  * @template T
  * @param {T} d Data to set.
  * @return {T}
  */
  var setDataNoBuild = function(d) {
    oldData = data;
    data = d;
    return data;
  };
  /** @type {function(?, ?=):?} */
  var updateChildren = function(d, o) {};
  /** @type {function(function(?, ?=): ?): undefined} */
  var setUpdateChildren = function(fn) {
    updateChildren = fn;
  };
  /** @type {function():?} */
  var updateChildrenExternal = function() {
    updateChildren(data, oldData);
  };
  /** @type {function():?} */
  var getData = function() {
    return data;
  };
  /** @type {function():!Array.<!Moduler>} */
  var getChildren = function() {
    return children;
  };
  /**
  * @param {?} d Data input.
  * @param {!string} e Element type.
  * @param {function(?, Element):(!string)=} b Builder function.
  * @return {!Moduler}
  */
  var createChild = function(d, e, b) {
    var c;
    if (b !== undefined) {
      c = new Moduler(d, e, b);
    }
    else {
      c = new Moduler(d, e);
    }
    children.push(c);
    el.appendChild(c.html());
    return c;
  };
  /**
   * @param {ModulerInterface} c The interface to a Moduler object.
   * @return {ModulerInterface}
   */
  var addChild = function(c) {
    children.push(c);
    el.appendChild(c.html());
    return c;
  };
  /**
  * @template T
  * @param {T} c Child to remove.
  * @return {T}
  */
  var removeChild = function(c) {
    children = goog.array.filter(children, function(l) {
      return l !== c;
    });
    build();
    return c;
  };
  /** @type {function(function(?):?):undefined} */
  var onClick = function(fn) {
    callbacks.push({event: 'click', cb: fn});
    setCB('click', fn);
  };
  /** @type {function(string, ?):?} */
  var setCB = function(event, fn) {
    if (el.addEventListener) {
      return el.addEventListener(event, fn, false);
    }
    else { //MSIE
      return el.attachEvent('on' + event, fn);
    }
  };
  /** @type {function(string, function(?):?):Element} */
  var on = function(event, fn) {
    return setCB(event, function(e) {
      fn(e);
    });
  };
  /** @type {function(!string):undefined} */
  var addCSSClass = function(c) {
    if (el.className === '') {
      el.className = c;
    }
    else {
      el.className += ' ' + c;
    }
  };
  /** @type {function(!string):undefined} */
  var removeCSSClass = function(c) {
    var cs = new goog.structs.Set(c.split(' '));
    var ks = new goog.structs.Set(el.className.split(' '));
    el.className = ks.difference(cs).getValues().join(' ');
  };
  /** @type {function(!string):undefined} */
  var setId = function(id) {
    el.id = id;
  };
  /** @type {function(): ModulerInterface} */
  var getInterface = function() {
    return {
      el: function() { return $(el); },
      html: element,
      data: getData,
      setData: setData,
      setCSS: setCSS,
      addCSSClass: addCSSClass,
      removeCSSClass: removeCSSClass,
      callbacks: function() { return callbacks; }
      //setId: setId
    };
  };
  build();
  this.html = element;
  this.el = function() { return $(el); };
  this.data = getData;
  this.children = getChildren;
  this.setCSS = setCSS;
  this.createChild = createChild;
  this.addChild = addChild;
  this.removeChild = removeChild;
  this.setData = setData;
  this.setUpdateChildren = setUpdateChildren;
  this.onClick = onClick;
  this.on = on;
  this.addCSSClass = addCSSClass;
  this.removeCSSClass = removeCSSClass;
  this.getInterface = getInterface;
  this.setDataNoBuild = setDataNoBuild;
  this.updateChildren = updateChildrenExternal;
  this.setId = setId;
};
