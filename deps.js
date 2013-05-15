// Input 0
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Bootstrap for the Google JS Library (Closure).
 *
 * In uncompiled mode base.js will write out Closure's deps file, unless the
 * global <code>CLOSURE_NO_DEPS</code> is set to true.  This allows projects to
 * include their own deps file(s) from different locations.
 *
 *
 * @provideGoog
 */


/**
 * @define {boolean} Overridden to true by the compiler when --closure_pass
 *     or --mark_as_compiled is specified.
 */
var COMPILED = false;


/**
 * Base namespace for the Closure library.  Checks to see goog is
 * already defined in the current scope before assigning to prevent
 * clobbering if base.js is loaded more than once.
 *
 * @const
 */
var goog = goog || {}; // Identifies this file as the Closure base.


/**
 * Reference to the global context.  In most cases this will be 'window'.
 */
goog.global = this;


/**
 * @define {boolean} DEBUG is provided as a convenience so that debugging code
 * that should not be included in a production js_binary can be easily stripped
 * by specifying --define goog.DEBUG=false to the JSCompiler. For example, most
 * toString() methods should be declared inside an "if (goog.DEBUG)" conditional
 * because they are generally used for debugging purposes and it is difficult
 * for the JSCompiler to statically determine whether they are used.
 */
goog.DEBUG = true;


/**
 * @define {string} LOCALE defines the locale being used for compilation. It is
 * used to select locale specific data to be compiled in js binary. BUILD rule
 * can specify this value by "--define goog.LOCALE=<locale_name>" as JSCompiler
 * option.
 *
 * Take into account that the locale code format is important. You should use
 * the canonical Unicode format with hyphen as a delimiter. Language must be
 * lowercase, Language Script - Capitalized, Region - UPPERCASE.
 * There are few examples: pt-BR, en, en-US, sr-Latin-BO, zh-Hans-CN.
 *
 * See more info about locale codes here:
 * http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers
 *
 * For language codes you should use values defined by ISO 693-1. See it here
 * http://www.w3.org/WAI/ER/IG/ert/iso639.htm. There is only one exception from
 * this rule: the Hebrew language. For legacy reasons the old code (iw) should
 * be used instead of the new code (he), see http://wiki/Main/IIISynonyms.
 */
goog.LOCALE = 'en';  // default to en


/**
 * Creates object stubs for a namespace.  The presence of one or more
 * goog.provide() calls indicate that the file defines the given
 * objects/namespaces.  Build tools also scan for provide/require statements
 * to discern dependencies, build dependency files (see deps.js), etc.
 * @see goog.require
 * @param {string} name Namespace provided by this file in the form
 *     "goog.package.part".
 */
goog.provide = function(name) {
  if (!COMPILED) {
    // Ensure that the same namespace isn't provided twice. This is intended
    // to teach new developers that 'goog.provide' is effectively a variable
    // declaration. And when JSCompiler transforms goog.provide into a real
    // variable declaration, the compiled JS should work the same as the raw
    // JS--even when the raw JS uses goog.provide incorrectly.
    if (goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];

    var namespace = name;
    while ((namespace = namespace.substring(0, namespace.lastIndexOf('.')))) {
      if (goog.getObjectByName(namespace)) {
        break;
      }
      goog.implicitNamespaces_[namespace] = true;
    }
  }

  goog.exportPath_(name);
};


/**
 * Marks that the current file should only be used for testing, and never for
 * live code in production.
 * @param {string=} opt_message Optional message to add to the error that's
 *     raised when used in production code.
 */
goog.setTestOnly = function(opt_message) {
  if (COMPILED && !goog.DEBUG) {
    opt_message = opt_message || '';
    throw Error('Importing test-only code into non-debug environment' +
                opt_message ? ': ' + opt_message : '.');
  }
};


if (!COMPILED) {

  /**
   * Check if the given name has been goog.provided. This will return false for
   * names that are available only as implicit namespaces.
   * @param {string} name name of the object to look for.
   * @return {boolean} Whether the name has been provided.
   * @private
   */
  goog.isProvided_ = function(name) {
    return !goog.implicitNamespaces_[name] && !!goog.getObjectByName(name);
  };

  /**
   * Namespaces implicitly defined by goog.provide. For example,
   * goog.provide('goog.events.Event') implicitly declares
   * that 'goog' and 'goog.events' must be namespaces.
   *
   * @type {Object}
   * @private
   */
  goog.implicitNamespaces_ = {};
}


/**
 * Builds an object structure for the provided namespace path,
 * ensuring that names that already exist are not overwritten. For
 * example:
 * "a.b.c" -> a = {};a.b={};a.b.c={};
 * Used by goog.provide and goog.exportSymbol.
 * @param {string} name name of the object that this file defines.
 * @param {*=} opt_object the object to expose at the end of the path.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 * @private
 */
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split('.');
  var cur = opt_objectToExportTo || goog.global;

  // Internet Explorer exhibits strange behavior when throwing errors from
  // methods externed in this manner.  See the testExportSymbolExceptions in
  // base_test.html for an example.
  if (!(parts[0] in cur) && cur.execScript) {
    cur.execScript('var ' + parts[0]);
  }

  // Certain browsers cannot parse code in the form for((a in b); c;);
  // This pattern is produced by the JSCompiler when it collapses the
  // statement above into the conditional loop below. To prevent this from
  // happening, use a for-loop and reserve the init logic as below.

  // Parentheses added to eliminate strict JS warning in Firefox.
  for (var part; parts.length && (part = parts.shift());) {
    if (!parts.length && goog.isDef(opt_object)) {
      // last part and we have an object; use it
      cur[part] = opt_object;
    } else if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
};


/**
 * Returns an object based on its fully qualified external name.  If you are
 * using a compilation pass that renames property names beware that using this
 * function will not find renamed properties.
 *
 * @param {string} name The fully qualified name.
 * @param {Object=} opt_obj The object within which to look; default is
 *     |goog.global|.
 * @return {?} The value (object or primitive) or, if not found, null.
 */
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split('.');
  var cur = opt_obj || goog.global;
  for (var part; part = parts.shift(); ) {
    if (goog.isDefAndNotNull(cur[part])) {
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;
};


/**
 * Globalizes a whole namespace, such as goog or goog.lang.
 *
 * @param {Object} obj The namespace to globalize.
 * @param {Object=} opt_global The object to add the properties to.
 * @deprecated Properties may be explicitly exported to the global scope, but
 *     this should no longer be done in bulk.
 */
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for (var x in obj) {
    global[x] = obj[x];
  }
};


/**
 * Adds a dependency from a file to the files it requires.
 * @param {string} relPath The path to the js file.
 * @param {Array} provides An array of strings with the names of the objects
 *                         this file provides.
 * @param {Array} requires An array of strings with the names of the objects
 *                         this file requires.
 */
goog.addDependency = function(relPath, provides, requires) {
  if (!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, '/');
    var deps = goog.dependencies_;
    for (var i = 0; provide = provides[i]; i++) {
      deps.nameToPath[provide] = path;
      if (!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {};
      }
      deps.pathToNames[path][provide] = true;
    }
    for (var j = 0; require = requires[j]; j++) {
      if (!(path in deps.requires)) {
        deps.requires[path] = {};
      }
      deps.requires[path][require] = true;
    }
  }
};




// NOTE(nnaze): The debug DOM loader was included in base.js as an orignal
// way to do "debug-mode" development.  The dependency system can sometimes
// be confusing, as can the debug DOM loader's asyncronous nature.
//
// With the DOM loader, a call to goog.require() is not blocking -- the
// script will not load until some point after the current script.  If a
// namespace is needed at runtime, it needs to be defined in a previous
// script, or loaded via require() with its registered dependencies.
// User-defined namespaces may need their own deps file.  See http://go/js_deps,
// http://go/genjsdeps, or, externally, DepsWriter.
// http://code.google.com/closure/library/docs/depswriter.html
//
// Because of legacy clients, the DOM loader can't be easily removed from
// base.js.  Work is being done to make it disableable or replaceable for
// different environments (DOM-less JavaScript interpreters like Rhino or V8,
// for example). See bootstrap/ for more information.


/**
 * @define {boolean} Whether to enable the debug loader.
 *
 * If enabled, a call to goog.require() will attempt to load the namespace by
 * appending a script tag to the DOM (if the namespace has been registered).
 *
 * If disabled, goog.require() will simply assert that the namespace has been
 * provided (and depend on the fact that some outside tool correctly ordered
 * the script).
 */
goog.ENABLE_DEBUG_LOADER = true;


/**
 * Implements a system for the dynamic resolution of dependencies
 * that works in parallel with the BUILD system. Note that all calls
 * to goog.require will be stripped by the JSCompiler when the
 * --closure_pass option is used.
 * @see goog.provide
 * @param {string} name Namespace to include (as was given in goog.provide())
 *     in the form "goog.package.part".
 */
goog.require = function(name) {

  // if the object already exists we do not need do do anything
  // TODO(arv): If we start to support require based on file name this has
  //            to change
  // TODO(arv): If we allow goog.foo.* this has to change
  // TODO(arv): If we implement dynamic load after page load we should probably
  //            not remove this code for the compiled output
  if (!COMPILED) {
    if (goog.isProvided_(name)) {
      return;
    }

    if (goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if (path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return;
      }
    }

    var errorMessage = 'goog.require could not find: ' + name;
    if (goog.global.console) {
      goog.global.console['error'](errorMessage);
    }


      throw Error(errorMessage);

  }
};


/**
 * Path for included scripts
 * @type {string}
 */
goog.basePath = '';


/**
 * A hook for overriding the base path.
 * @type {string|undefined}
 */
goog.global.CLOSURE_BASE_PATH;


/**
 * Whether to write out Closure's deps file. By default,
 * the deps are written.
 * @type {boolean|undefined}
 */
goog.global.CLOSURE_NO_DEPS;


/**
 * A function to import a single script. This is meant to be overridden when
 * Closure is being run in non-HTML contexts, such as web workers. It's defined
 * in the global scope so that it can be set before base.js is loaded, which
 * allows deps.js to be imported properly.
 *
 * The function is passed the script source, which is a relative URI. It should
 * return true if the script was imported, false otherwise.
 */
goog.global.CLOSURE_IMPORT_SCRIPT;


/**
 * Null function used for default values of callbacks, etc.
 * @return {void} Nothing.
 */
goog.nullFunction = function() {};


/**
 * The identity function. Returns its first argument.
 *
 * @param {*=} opt_returnValue The single value that will be returned.
 * @param {...*} var_args Optional trailing arguments. These are ignored.
 * @return {?} The first argument. We can't know the type -- just pass it along
 *      without type.
 * @deprecated Use goog.functions.identity instead.
 */
goog.identityFunction = function(opt_returnValue, var_args) {
  return opt_returnValue;
};


/**
 * When defining a class Foo with an abstract method bar(), you can do:
 *
 * Foo.prototype.bar = goog.abstractMethod
 *
 * Now if a subclass of Foo fails to override bar(), an error
 * will be thrown when bar() is invoked.
 *
 * Note: This does not take the name of the function to override as
 * an argument because that would make it more difficult to obfuscate
 * our JavaScript code.
 *
 * @type {!Function}
 * @throws {Error} when invoked to indicate the method should be
 *   overridden.
 */
goog.abstractMethod = function() {
  throw Error('unimplemented abstract method');
};


/**
 * Adds a {@code getInstance} static method that always return the same instance
 * object.
 * @param {!Function} ctor The constructor for the class to add the static
 *     method to.
 */
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if (ctor.instance_) {
      return ctor.instance_;
    }
    if (goog.DEBUG) {
      // NOTE: JSCompiler can't optimize away Array#push.
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor;
    }
    return ctor.instance_ = new ctor;
  };
};


/**
 * All singleton classes that have been instantiated, for testing. Don't read
 * it directly, use the {@code goog.testing.singleton} module. The compiler
 * removes this variable if unused.
 * @type {!Array.<!Function>}
 * @private
 */
goog.instantiatedSingletons_ = [];


if (!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  /**
   * Object used to keep track of urls that have already been added. This
   * record allows the prevention of circular dependencies.
   * @type {Object}
   * @private
   */
  goog.included_ = {};


  /**
   * This object is used to keep track of dependencies and other data that is
   * used for loading scripts
   * @private
   * @type {Object}
   */
  goog.dependencies_ = {
    pathToNames: {}, // 1 to many
    nameToPath: {}, // 1 to 1
    requires: {}, // 1 to many
    // used when resolving dependencies to prevent us from
    // visiting the file twice
    visited: {},
    written: {} // used to keep track of script files we have written
  };


  /**
   * Tries to detect whether is in the context of an HTML document.
   * @return {boolean} True if it looks like HTML document.
   * @private
   */
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != 'undefined' &&
           'write' in doc;  // XULDocument misses write.
  };


  /**
   * Tries to detect the base path of the base.js script that bootstraps Closure
   * @private
   */
  goog.findBasePath_ = function() {
    if (goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return;
    } else if (!goog.inHtmlDocument_()) {
      return;
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName('script');
    // Search backwards since the current script is in almost all cases the one
    // that has base.js.
    for (var i = scripts.length - 1; i >= 0; --i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf('?');
      var l = qmark == -1 ? src.length : qmark;
      if (src.substr(l - 7, 7) == 'base.js') {
        goog.basePath = src.substr(0, l - 7);
        return;
      }
    }
  };


  /**
   * Imports a script if, and only if, that script hasn't already been imported.
   * (Must be called at execution time)
   * @param {string} src Script source.
   * @private
   */
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT ||
        goog.writeScriptTag_;
    if (!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true;
    }
  };


  /**
   * The default implementation of the import function. Writes a script tag to
   * import the script.
   *
   * @param {string} src The script source.
   * @return {boolean} True if the script was imported, false otherwise.
   * @private
   */
  goog.writeScriptTag_ = function(src) {
    if (goog.inHtmlDocument_()) {
      var doc = goog.global.document;

      // If the user tries to require a new symbol after document load,
      // something has gone terribly wrong. Doing a document.write would
      // wipe out the page.
      if (doc.readyState == 'complete') {
        // Certain test frameworks load base.js multiple times, which tries
        // to write deps.js each time. If that happens, just fail silently.
        // These frameworks wipe the page between each load of base.js, so this
        // is OK.
        var isDeps = /\bdeps.js$/.test(src);
        if (isDeps) {
          return false;
        } else {
          throw Error('Cannot write "' + src + '" after document load');
        }
      }

      doc.write(
          '<script type="text/javascript" src="' + src + '"></' + 'script>');
      return true;
    } else {
      return false;
    }
  };


  /**
   * Resolves dependencies based on the dependencies added using addDependency
   * and calls importScript_ in the correct order.
   * @private
   */
  goog.writeScripts_ = function() {
    // the scripts we need to write this time
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;

    function visitNode(path) {
      if (path in deps.written) {
        return;
      }

      // we have already visited this one. We can get here if we have cyclic
      // dependencies
      if (path in deps.visited) {
        if (!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path);
        }
        return;
      }

      deps.visited[path] = true;

      if (path in deps.requires) {
        for (var requireName in deps.requires[path]) {
          // If the required name is defined, we assume that it was already
          // bootstrapped by other means.
          if (!goog.isProvided_(requireName)) {
            if (requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName]);
            } else {
              throw Error('Undefined nameToPath for ' + requireName);
            }
          }
        }
      }

      if (!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path);
      }
    }

    for (var path in goog.included_) {
      if (!deps.written[path]) {
        visitNode(path);
      }
    }

    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i]);
      } else {
        throw Error('Undefined script input');
      }
    }
  };


  /**
   * Looks at the dependency rules and tries to determine the script file that
   * fulfills a particular rule.
   * @param {string} rule In the form goog.namespace.Class or project.script.
   * @return {?string} Url corresponding to the rule, or null.
   * @private
   */
  goog.getPathFromDeps_ = function(rule) {
    if (rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule];
    } else {
      return null;
    }
  };

  goog.findBasePath_();

  // Allow projects to manage the deps files themselves.
  if (!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + 'deps.js');
  }
}



//==============================================================================
// Language Enhancements
//==============================================================================


/**
 * This is a "fixed" version of the typeof operator.  It differs from the typeof
 * operator in such a way that null returns 'null' and arrays return 'array'.
 * @param {*} value The value to get the type of.
 * @return {string} The name of the type.
 */
goog.typeOf = function(value) {
  var s = typeof value;
  if (s == 'object') {
    if (value) {
      // Check these first, so we can avoid calling Object.prototype.toString if
      // possible.
      //
      // IE improperly marshals tyepof across execution contexts, but a
      // cross-context object will still return false for "instanceof Object".
      if (value instanceof Array) {
        return 'array';
      } else if (value instanceof Object) {
        return s;
      }

      // HACK: In order to use an Object prototype method on the arbitrary
      //   value, the compiler requires the value be cast to type Object,
      //   even though the ECMA spec explicitly allows it.
      var className = Object.prototype.toString.call(
          /** @type {Object} */ (value));
      // In Firefox 3.6, attempting to access iframe window objects' length
      // property throws an NS_ERROR_FAILURE, so we need to special-case it
      // here.
      if (className == '[object Window]') {
        return 'object';
      }

      // We cannot always use constructor == Array or instanceof Array because
      // different frames have different Array objects. In IE6, if the iframe
      // where the array was created is destroyed, the array loses its
      // prototype. Then dereferencing val.splice here throws an exception, so
      // we can't use goog.isFunction. Calling typeof directly returns 'unknown'
      // so that will work. In this case, this function will return false and
      // most array functions will still work because the array is still
      // array-like (supports length and []) even though it has lost its
      // prototype.
      // Mark Miller noticed that Object.prototype.toString
      // allows access to the unforgeable [[Class]] property.
      //  15.2.4.2 Object.prototype.toString ( )
      //  When the toString method is called, the following steps are taken:
      //      1. Get the [[Class]] property of this object.
      //      2. Compute a string value by concatenating the three strings
      //         "[object ", Result(1), and "]".
      //      3. Return Result(2).
      // and this behavior survives the destruction of the execution context.
      if ((className == '[object Array]' ||
           // In IE all non value types are wrapped as objects across window
           // boundaries (not iframe though) so we have to do object detection
           // for this edge case
           typeof value.length == 'number' &&
           typeof value.splice != 'undefined' &&
           typeof value.propertyIsEnumerable != 'undefined' &&
           !value.propertyIsEnumerable('splice')

          )) {
        return 'array';
      }
      // HACK: There is still an array case that fails.
      //     function ArrayImpostor() {}
      //     ArrayImpostor.prototype = [];
      //     var impostor = new ArrayImpostor;
      // this can be fixed by getting rid of the fast path
      // (value instanceof Array) and solely relying on
      // (value && Object.prototype.toString.vall(value) === '[object Array]')
      // but that would require many more function calls and is not warranted
      // unless closure code is receiving objects from untrusted sources.

      // IE in cross-window calls does not correctly marshal the function type
      // (it appears just as an object) so we cannot use just typeof val ==
      // 'function'. However, if the object has a call property, it is a
      // function.
      if ((className == '[object Function]' ||
          typeof value.call != 'undefined' &&
          typeof value.propertyIsEnumerable != 'undefined' &&
          !value.propertyIsEnumerable('call'))) {
        return 'function';
      }


    } else {
      return 'null';
    }

  } else if (s == 'function' && typeof value.call == 'undefined') {
    // In Safari typeof nodeList returns 'function', and on Firefox
    // typeof behaves similarly for HTML{Applet,Embed,Object}Elements
    // and RegExps.  We would like to return object for those and we can
    // detect an invalid function by making sure that the function
    // object has a call method.
    return 'object';
  }
  return s;
};


/**
 * Returns true if the specified value is not |undefined|.
 * WARNING: Do not use this to test if an object has a property. Use the in
 * operator instead.  Additionally, this function assumes that the global
 * undefined variable has not been redefined.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined.
 */
goog.isDef = function(val) {
  return val !== undefined;
};


/**
 * Returns true if the specified value is |null|
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is null.
 */
goog.isNull = function(val) {
  return val === null;
};


/**
 * Returns true if the specified value is defined and not null
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined and not null.
 */
goog.isDefAndNotNull = function(val) {
  // Note that undefined == null.
  return val != null;
};


/**
 * Returns true if the specified value is an array
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArray = function(val) {
  return goog.typeOf(val) == 'array';
};


/**
 * Returns true if the object looks like an array. To qualify as array like
 * the value needs to be either a NodeList or an object with a Number length
 * property.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == 'array' || type == 'object' && typeof val.length == 'number';
};


/**
 * Returns true if the object looks like a Date. To qualify as Date-like
 * the value needs to be an object and have a getFullYear() function.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a like a Date.
 */
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == 'function';
};


/**
 * Returns true if the specified value is a string
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a string.
 */
goog.isString = function(val) {
  return typeof val == 'string';
};


/**
 * Returns true if the specified value is a boolean
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is boolean.
 */
goog.isBoolean = function(val) {
  return typeof val == 'boolean';
};


/**
 * Returns true if the specified value is a number
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a number.
 */
goog.isNumber = function(val) {
  return typeof val == 'number';
};


/**
 * Returns true if the specified value is a function
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a function.
 */
goog.isFunction = function(val) {
  return goog.typeOf(val) == 'function';
};


/**
 * Returns true if the specified value is an object.  This includes arrays
 * and functions.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an object.
 */
goog.isObject = function(val) {
  var type = typeof val;
  return type == 'object' && val != null || type == 'function';
  // return Object(val) === val also works, but is slower, especially if val is
  // not an object.
};


/**
 * Gets a unique ID for an object. This mutates the object so that further
 * calls with the same object as a parameter returns the same value. The unique
 * ID is guaranteed to be unique across the current session amongst objects that
 * are passed into {@code getUid}. There is no guarantee that the ID is unique
 * or consistent across sessions. It is unsafe to generate unique ID for
 * function prototypes.
 *
 * @param {Object} obj The object to get the unique ID for.
 * @return {number} The unique ID for the object.
 */
goog.getUid = function(obj) {
  // TODO(arv): Make the type stricter, do not accept null.

  // In Opera window.hasOwnProperty exists but always returns false so we avoid
  // using it. As a consequence the unique ID generated for BaseClass.prototype
  // and SubClass.prototype will be the same.
  return obj[goog.UID_PROPERTY_] ||
      (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_);
};


/**
 * Removes the unique ID from an object. This is useful if the object was
 * previously mutated using {@code goog.getUid} in which case the mutation is
 * undone.
 * @param {Object} obj The object to remove the unique ID field from.
 */
goog.removeUid = function(obj) {
  // TODO(arv): Make the type stricter, do not accept null.

  // DOM nodes in IE are not instance of Object and throws exception
  // for delete. Instead we try to use removeAttribute
  if ('removeAttribute' in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_);
  }
  /** @preserveTry */
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};


/**
 * Name for unique ID property. Initialized in a way to help avoid collisions
 * with other closure javascript on the same page.
 * @type {string}
 * @private
 */
goog.UID_PROPERTY_ = 'closure_uid_' +
    Math.floor(Math.random() * 2147483648).toString(36);


/**
 * Counter for UID.
 * @type {number}
 * @private
 */
goog.uidCounter_ = 0;


/**
 * Adds a hash code field to an object. The hash code is unique for the
 * given object.
 * @param {Object} obj The object to get the hash code for.
 * @return {number} The hash code for the object.
 * @deprecated Use goog.getUid instead.
 */
goog.getHashCode = goog.getUid;


/**
 * Removes the hash code field from an object.
 * @param {Object} obj The object to remove the field from.
 * @deprecated Use goog.removeUid instead.
 */
goog.removeHashCode = goog.removeUid;


/**
 * Clones a value. The input may be an Object, Array, or basic type. Objects and
 * arrays will be cloned recursively.
 *
 * WARNINGS:
 * <code>goog.cloneObject</code> does not detect reference loops. Objects that
 * refer to themselves will cause infinite recursion.
 *
 * <code>goog.cloneObject</code> is unaware of unique identifiers, and copies
 * UIDs created by <code>getUid</code> into cloned results.
 *
 * @param {*} obj The value to clone.
 * @return {*} A clone of the input value.
 * @deprecated goog.cloneObject is unsafe. Prefer the goog.object methods.
 */
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = goog.cloneObject(obj[key]);
    }
    return clone;
  }

  return obj;
};


/**
 * A native implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 * @suppress {deprecated} The compiler thinks that Function.prototype.bind
 *     is deprecated because some people have declared a pure-JS version.
 *     Only the pure-JS version is truly deprecated.
 */
goog.bindNative_ = function(fn, selfObj, var_args) {
  return /** @type {!Function} */ (fn.call.apply(fn.bind, arguments));
};


/**
 * A pure-JS implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 */
goog.bindJs_ = function(fn, selfObj, var_args) {
  if (!fn) {
    throw new Error();
  }

  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      // Prepend the bound arguments to the current arguments.
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs);
    };

  } else {
    return function() {
      return fn.apply(selfObj, arguments);
    };
  }
};


/**
 * Partially applies this function to a particular 'this object' and zero or
 * more arguments. The result is a new function with some arguments of the first
 * function pre-filled and the value of |this| 'pre-specified'.<br><br>
 *
 * Remaining arguments specified at call-time are appended to the pre-
 * specified ones.<br><br>
 *
 * Also see: {@link #partial}.<br><br>
 *
 * Usage:
 * <pre>var barMethBound = bind(myFunction, myObj, 'arg1', 'arg2');
 * barMethBound('arg3', 'arg4');</pre>
 *
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @suppress {deprecated} See above.
 */
goog.bind = function(fn, selfObj, var_args) {
  // TODO(nicksantos): narrow the type signature.
  if (Function.prototype.bind &&
      // NOTE(nicksantos): Somebody pulled base.js into the default
      // Chrome extension environment. This means that for Chrome extensions,
      // they get the implementation of Function.prototype.bind that
      // calls goog.bind instead of the native one. Even worse, we don't want
      // to introduce a circular dependency between goog.bind and
      // Function.prototype.bind, so we have to hack this to make sure it
      // works correctly.
      Function.prototype.bind.toString().indexOf('native code') != -1) {
    goog.bind = goog.bindNative_;
  } else {
    goog.bind = goog.bindJs_;
  }
  return goog.bind.apply(null, arguments);
};


/**
 * Like bind(), except that a 'this object' is not required. Useful when the
 * target function is already bound.
 *
 * Usage:
 * var g = partial(f, arg1, arg2);
 * g(arg3, arg4);
 *
 * @param {Function} fn A function to partially apply.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to fn.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    // Prepend the bound arguments to the current arguments.
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs);
  };
};


/**
 * Copies all the members of a source object to a target object. This method
 * does not work on all browsers for all objects that contain keys such as
 * toString or hasOwnProperty. Use goog.object.extend for this purpose.
 * @param {Object} target Target.
 * @param {Object} source Source.
 */
goog.mixin = function(target, source) {
  for (var x in source) {
    target[x] = source[x];
  }

  // For IE7 or lower, the for-in-loop does not contain any properties that are
  // not enumerable on the prototype object (for example, isPrototypeOf from
  // Object.prototype) but also it will not include 'replace' on objects that
  // extend String and change 'replace' (not that it is common for anyone to
  // extend anything except Object).
};


/**
 * @return {number} An integer value representing the number of milliseconds
 *     between midnight, January 1, 1970 and the current time.
 */
goog.now = Date.now || (function() {
  // Unary plus operator converts its operand to a number which in the case of
  // a date is done by calling getTime().
  return +new Date();
});


/**
 * Evals javascript in the global scope.  In IE this uses execScript, other
 * browsers use goog.global.eval. If goog.global.eval does not evaluate in the
 * global scope (for example, in Safari), appends a script tag instead.
 * Throws an exception if neither execScript or eval is defined.
 * @param {string} script JavaScript string.
 */
goog.globalEval = function(script) {
  if (goog.global.execScript) {
    goog.global.execScript(script, 'JavaScript');
  } else if (goog.global.eval) {
    // Test to see if eval works
    if (goog.evalWorksForGlobals_ == null) {
      goog.global.eval('var _et_ = 1;');
      if (typeof goog.global['_et_'] != 'undefined') {
        delete goog.global['_et_'];
        goog.evalWorksForGlobals_ = true;
      } else {
        goog.evalWorksForGlobals_ = false;
      }
    }

    if (goog.evalWorksForGlobals_) {
      goog.global.eval(script);
    } else {
      var doc = goog.global.document;
      var scriptElt = doc.createElement('script');
      scriptElt.type = 'text/javascript';
      scriptElt.defer = false;
      // Note(user): can't use .innerHTML since "t('<test>')" will fail and
      // .text doesn't work in Safari 2.  Therefore we append a text node.
      scriptElt.appendChild(doc.createTextNode(script));
      doc.body.appendChild(scriptElt);
      doc.body.removeChild(scriptElt);
    }
  } else {
    throw Error('goog.globalEval not available');
  }
};


/**
 * Indicates whether or not we can call 'eval' directly to eval code in the
 * global scope. Set to a Boolean by the first call to goog.globalEval (which
 * empirically tests whether eval works for globals). @see goog.globalEval
 * @type {?boolean}
 * @private
 */
goog.evalWorksForGlobals_ = null;


/**
 * Optional map of CSS class names to obfuscated names used with
 * goog.getCssName().
 * @type {Object|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMapping_;


/**
 * Optional obfuscation style for CSS class names. Should be set to either
 * 'BY_WHOLE' or 'BY_PART' if defined.
 * @type {string|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMappingStyle_;


/**
 * Handles strings that are intended to be used as CSS class names.
 *
 * This function works in tandem with @see goog.setCssNameMapping.
 *
 * Without any mapping set, the arguments are simple joined with a
 * hyphen and passed through unaltered.
 *
 * When there is a mapping, there are two possible styles in which
 * these mappings are used. In the BY_PART style, each part (i.e. in
 * between hyphens) of the passed in css name is rewritten according
 * to the map. In the BY_WHOLE style, the full css name is looked up in
 * the map directly. If a rewrite is not specified by the map, the
 * compiler will output a warning.
 *
 * When the mapping is passed to the compiler, it will replace calls
 * to goog.getCssName with the strings from the mapping, e.g.
 *     var x = goog.getCssName('foo');
 *     var y = goog.getCssName(this.baseClass, 'active');
 *  becomes:
 *     var x= 'foo';
 *     var y = this.baseClass + '-active';
 *
 * If one argument is passed it will be processed, if two are passed
 * only the modifier will be processed, as it is assumed the first
 * argument was generated as a result of calling goog.getCssName.
 *
 * @param {string} className The class name.
 * @param {string=} opt_modifier A modifier to be appended to the class name.
 * @return {string} The class name or the concatenation of the class name and
 *     the modifier.
 */
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName;
  };

  var renameByParts = function(cssName) {
    // Remap all the parts individually.
    var parts = cssName.split('-');
    var mapped = [];
    for (var i = 0; i < parts.length; i++) {
      mapped.push(getMapping(parts[i]));
    }
    return mapped.join('-');
  };

  var rename;
  if (goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == 'BY_WHOLE' ?
        getMapping : renameByParts;
  } else {
    rename = function(a) {
      return a;
    };
  }

  if (opt_modifier) {
    return className + '-' + rename(opt_modifier);
  } else {
    return rename(className);
  }
};


/**
 * Sets the map to check when returning a value from goog.getCssName(). Example:
 * <pre>
 * goog.setCssNameMapping({
 *   "goog": "a",
 *   "disabled": "b",
 * });
 *
 * var x = goog.getCssName('goog');
 * // The following evaluates to: "a a-b".
 * goog.getCssName('goog') + ' ' + goog.getCssName(x, 'disabled')
 * </pre>
 * When declared as a map of string literals to string literals, the JSCompiler
 * will replace all calls to goog.getCssName() using the supplied map if the
 * --closure_pass flag is set.
 *
 * @param {!Object} mapping A map of strings to strings where keys are possible
 *     arguments to goog.getCssName() and values are the corresponding values
 *     that should be returned.
 * @param {string=} opt_style The style of css name mapping. There are two valid
 *     options: 'BY_PART', and 'BY_WHOLE'.
 * @see goog.getCssName for a description.
 */
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style;
};


/**
 * To use CSS renaming in compiled mode, one of the input files should have a
 * call to goog.setCssNameMapping() with an object literal that the JSCompiler
 * can extract and use to replace all calls to goog.getCssName(). In uncompiled
 * mode, JavaScript code should be loaded before this base.js file that declares
 * a global variable, CLOSURE_CSS_NAME_MAPPING, which is used below. This is
 * to ensure that the mapping is loaded before any calls to goog.getCssName()
 * are made in uncompiled mode.
 *
 * A hook for overriding the CSS name mapping.
 * @type {Object|undefined}
 */
goog.global.CLOSURE_CSS_NAME_MAPPING;


if (!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  // This does not call goog.setCssNameMapping() because the JSCompiler
  // requires that goog.setCssNameMapping() be called with an object literal.
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING;
}


/**
 * Gets a localized message.
 *
 * This function is a compiler primitive. If you give the compiler a localized
 * message bundle, it will replace the string at compile-time with a localized
 * version, and expand goog.getMsg call to a concatenated string.
 *
 * Messages must be initialized in the form:
 * <code>
 * var MSG_NAME = goog.getMsg('Hello {$placeholder}', {'placeholder': 'world'});
 * </code>
 *
 * @param {string} str Translatable string, places holders in the form {$foo}.
 * @param {Object=} opt_values Map of place holder name to value.
 * @return {string} message with placeholders filled.
 */
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for (var key in values) {
    var value = ('' + values[key]).replace(/\$/g, '$$$$');
    str = str.replace(new RegExp('\\{\\$' + key + '\\}', 'gi'), value);
  }
  return str;
};


/**
 * Gets a localized message. If the message does not have a translation, gives a
 * fallback message.
 *
 * This is useful when introducing a new message that has not yet been
 * translated into all languages.
 *
 * This function is a compiler primtive. Must be used in the form:
 * <code>var x = goog.getMsgWithFallback(MSG_A, MSG_B);</code>
 * where MSG_A and MSG_B were initialized with goog.getMsg.
 *
 * @param {string} a The preferred message.
 * @param {string} b The fallback message.
 * @return {string} The best translated message.
 */
goog.getMsgWithFallback = function(a, b) {
  return a;
};


/**
 * Exposes an unobfuscated global namespace path for the given object.
 * Note that fields of the exported object *will* be obfuscated,
 * unless they are exported in turn via this function or
 * goog.exportProperty
 *
 * <p>Also handy for making public items that are defined in anonymous
 * closures.
 *
 * ex. goog.exportSymbol('public.path.Foo', Foo);
 *
 * ex. goog.exportSymbol('public.path.Foo.staticFunction',
 *                       Foo.staticFunction);
 *     public.path.Foo.staticFunction();
 *
 * ex. goog.exportSymbol('public.path.Foo.prototype.myMethod',
 *                       Foo.prototype.myMethod);
 *     new public.path.Foo().myMethod();
 *
 * @param {string} publicPath Unobfuscated name to export.
 * @param {*} object Object the name should point to.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 */
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo);
};


/**
 * Exports a property unobfuscated into the object's namespace.
 * ex. goog.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
 * ex. goog.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
 * @param {Object} object Object whose static property is being exported.
 * @param {string} publicName Unobfuscated name to export.
 * @param {*} symbol Object the name should point to.
 */
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol;
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Usage:
 * <pre>
 * function ParentClass(a, b) { }
 * ParentClass.prototype.foo = function(a) { }
 *
 * function ChildClass(a, b, c) {
 *   goog.base(this, a, b);
 * }
 * goog.inherits(ChildClass, ParentClass);
 *
 * var child = new ChildClass('a', 'b', 'see');
 * child.foo(); // works
 * </pre>
 *
 * In addition, a superclass' implementation of a method can be invoked
 * as follows:
 *
 * <pre>
 * ChildClass.prototype.foo = function(a) {
 *   ChildClass.superClass_.foo.call(this, a);
 *   // other code
 * };
 * </pre>
 *
 * @param {Function} childCtor Child class.
 * @param {Function} parentCtor Parent class.
 */
goog.inherits = function(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  /** @override */
  childCtor.prototype.constructor = childCtor;
};


/**
 * Call up to the superclass.
 *
 * If this is called from a constructor, then this calls the superclass
 * contructor with arguments 1-N.
 *
 * If this is called from a prototype method, then you must pass
 * the name of the method as the second argument to this function. If
 * you do not, you will get a runtime error. This calls the superclass'
 * method with arguments 2-N.
 *
 * This function only works if you use goog.inherits to express
 * inheritance relationships between your classes.
 *
 * This function is a compiler primitive. At compile-time, the
 * compiler will do macro expansion to remove a lot of
 * the extra overhead that this function introduces. The compiler
 * will also enforce a lot of the assumptions that this function
 * makes, and treat it as a compiler error if you break them.
 *
 * @param {!Object} me Should always be "this".
 * @param {*=} opt_methodName The method name if calling a super method.
 * @param {...*} var_args The rest of the arguments.
 * @return {*} The return value of the superclass method.
 */
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if (caller.superClass_) {
    // This is a constructor. Call the superclass constructor.
    return caller.superClass_.constructor.apply(
        me, Array.prototype.slice.call(arguments, 1));
  }

  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for (var ctor = me.constructor;
       ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if (ctor.prototype[opt_methodName] === caller) {
      foundCaller = true;
    } else if (foundCaller) {
      return ctor.prototype[opt_methodName].apply(me, args);
    }
  }

  // If we did not find the caller in the prototype chain,
  // then one of two things happened:
  // 1) The caller is an instance method.
  // 2) This method was not called by the right caller.
  if (me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args);
  } else {
    throw Error(
        'goog.base called from a method of one name ' +
        'to a method of a different name');
  }
};


/**
 * Allow for aliasing within scope functions.  This function exists for
 * uncompiled code - in compiled code the calls will be inlined and the
 * aliases applied.  In uncompiled code the function is simply run since the
 * aliases as written are valid JavaScript.
 * @param {function()} fn Function to call.  This function can contain aliases
 *     to namespaces (e.g. "var dom = goog.dom") or classes
 *    (e.g. "var Timer = goog.Timer").
 */
goog.scope = function(fn) {
  fn.call(goog.global);
};



// Input 1
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Provides a base class for custom Error objects such that the
 * stack is correctly maintained.
 *
 * You should never need to throw goog.debug.Error(msg) directly, Error(msg) is
 * sufficient.
 *
 */

goog.provide('goog.debug.Error');



/**
 * Base class for custom error objects.
 * @param {*=} opt_msg The message associated with the error.
 * @constructor
 * @extends {Error}
 */
goog.debug.Error = function(opt_msg) {

  // Ensure there is a stack trace.
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, goog.debug.Error);
  } else {
    this.stack = new Error().stack || '';
  }

  if (opt_msg) {
    this.message = String(opt_msg);
  }
};
goog.inherits(goog.debug.Error, Error);


/** @override */
goog.debug.Error.prototype.name = 'CustomError';

// Input 2
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for string manipulation.
 */


/**
 * Namespace for string utilities
 */
goog.provide('goog.string');
goog.provide('goog.string.Unicode');


/**
 * Common Unicode string characters.
 * @enum {string}
 */
goog.string.Unicode = {
  NBSP: '\xa0'
};


/**
 * Fast prefix-checker.
 * @param {string} str The string to check.
 * @param {string} prefix A string to look for at the start of {@code str}.
 * @return {boolean} True if {@code str} begins with {@code prefix}.
 */
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0;
};


/**
 * Fast suffix-checker.
 * @param {string} str The string to check.
 * @param {string} suffix A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} ends with {@code suffix}.
 */
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l;
};


/**
 * Case-insensitive prefix-checker.
 * @param {string} str The string to check.
 * @param {string} prefix  A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} begins with {@code prefix} (ignoring
 *     case).
 */
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(
      prefix, str.substr(0, prefix.length)) == 0;
};


/**
 * Case-insensitive suffix-checker.
 * @param {string} str The string to check.
 * @param {string} suffix A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} ends with {@code suffix} (ignoring
 *     case).
 */
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(
      suffix, str.substr(str.length - suffix.length, suffix.length)) == 0;
};


/**
 * Does simple python-style string substitution.
 * subs("foo%s hot%s", "bar", "dog") becomes "foobar hotdog".
 * @param {string} str The string containing the pattern.
 * @param {...*} var_args The items to substitute into the pattern.
 * @return {string} A copy of {@code str} in which each occurrence of
 *     {@code %s} has been replaced an argument from {@code var_args}.
 */
goog.string.subs = function(str, var_args) {
  // This appears to be slow, but testing shows it compares more or less
  // equivalent to the regex.exec method.
  for (var i = 1; i < arguments.length; i++) {
    // We cast to String in case an argument is a Function.  Replacing $&, for
    // example, with $$$& stops the replace from subsituting the whole match
    // into the resultant string.  $$$& in the first replace becomes $$& in the
    //  second, which leaves $& in the resultant string.  Also:
    // $$, $`, $', $n $nn
    var replacement = String(arguments[i]).replace(/\$/g, '$$$$');
    str = str.replace(/\%s/, replacement);
  }
  return str;
};


/**
 * Converts multiple whitespace chars (spaces, non-breaking-spaces, new lines
 * and tabs) to a single space, and strips leading and trailing whitespace.
 * @param {string} str Input string.
 * @return {string} A copy of {@code str} with collapsed whitespace.
 */
goog.string.collapseWhitespace = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/[\s\xa0]+/g, ' ').replace(/^\s+|\s+$/g, '');
};


/**
 * Checks if a string is empty or contains only whitespaces.
 * @param {string} str The string to check.
 * @return {boolean} True if {@code str} is empty or whitespace only.
 */
goog.string.isEmpty = function(str) {
  // testing length == 0 first is actually slower in all browsers (about the
  // same in Opera).
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return /^[\s\xa0]*$/.test(str);
};


/**
 * Checks if a string is null, undefined, empty or contains only whitespaces.
 * @param {*} str The string to check.
 * @return {boolean} True if{@code str} is null, undefined, empty, or
 *     whitespace only.
 */
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str));
};


/**
 * Checks if a string is all breaking whitespace.
 * @param {string} str The string to check.
 * @return {boolean} Whether the string is all breaking whitespace.
 */
goog.string.isBreakingWhitespace = function(str) {
  return !/[^\t\n\r ]/.test(str);
};


/**
 * Checks if a string contains all letters.
 * @param {string} str string to check.
 * @return {boolean} True if {@code str} consists entirely of letters.
 */
goog.string.isAlpha = function(str) {
  return !/[^a-zA-Z]/.test(str);
};


/**
 * Checks if a string contains only numbers.
 * @param {*} str string to check. If not a string, it will be
 *     casted to one.
 * @return {boolean} True if {@code str} is numeric.
 */
goog.string.isNumeric = function(str) {
  return !/[^0-9]/.test(str);
};


/**
 * Checks if a string contains only numbers or letters.
 * @param {string} str string to check.
 * @return {boolean} True if {@code str} is alphanumeric.
 */
goog.string.isAlphaNumeric = function(str) {
  return !/[^a-zA-Z0-9]/.test(str);
};


/**
 * Checks if a character is a space character.
 * @param {string} ch Character to check.
 * @return {boolean} True if {code ch} is a space.
 */
goog.string.isSpace = function(ch) {
  return ch == ' ';
};


/**
 * Checks if a character is a valid unicode character.
 * @param {string} ch Character to check.
 * @return {boolean} True if {code ch} is a valid unicode character.
 */
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= ' ' && ch <= '~' ||
         ch >= '\u0080' && ch <= '\uFFFD';
};


/**
 * Takes a string and replaces newlines with a space. Multiple lines are
 * replaced with a single space.
 * @param {string} str The string from which to strip newlines.
 * @return {string} A copy of {@code str} stripped of newlines.
 */
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, ' ');
};


/**
 * Replaces Windows and Mac new lines with unix style: \r or \r\n with \n.
 * @param {string} str The string to in which to canonicalize newlines.
 * @return {string} {@code str} A copy of {@code} with canonicalized newlines.
 */
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, '\n');
};


/**
 * Normalizes whitespace in a string, replacing all whitespace chars with
 * a space.
 * @param {string} str The string in which to normalize whitespace.
 * @return {string} A copy of {@code str} with all whitespace normalized.
 */
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, ' ');
};


/**
 * Normalizes spaces in a string, replacing all consecutive spaces and tabs
 * with a single space. Replaces non-breaking space with a space.
 * @param {string} str The string in which to normalize spaces.
 * @return {string} A copy of {@code str} with all consecutive spaces and tabs
 *    replaced with a single space.
 */
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, ' ');
};


/**
 * Removes the breaking spaces from the left and right of the string and
 * collapses the sequences of breaking spaces in the middle into single spaces.
 * The original and the result strings render the same way in HTML.
 * @param {string} str A string in which to collapse spaces.
 * @return {string} Copy of the string with normalized breaking spaces.
 */
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, ' ').replace(
      /^[\t\r\n ]+|[\t\r\n ]+$/g, '');
};


/**
 * Trims white spaces to the left and right of a string.
 * @param {string} str The string to trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trim = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
};


/**
 * Trims whitespaces at the left end of a string.
 * @param {string} str The string to left trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trimLeft = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/^[\s\xa0]+/, '');
};


/**
 * Trims whitespaces at the right end of a string.
 * @param {string} str The string to right trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trimRight = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/[\s\xa0]+$/, '');
};


/**
 * A string comparator that ignores case.
 * -1 = str1 less than str2
 *  0 = str1 equals str2
 *  1 = str1 greater than str2
 *
 * @param {string} str1 The string to compare.
 * @param {string} str2 The string to compare {@code str1} to.
 * @return {number} The comparator result, as described above.
 */
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();

  if (test1 < test2) {
    return -1;
  } else if (test1 == test2) {
    return 0;
  } else {
    return 1;
  }
};


/**
 * Regular expression used for splitting a string into substrings of fractional
 * numbers, integers, and non-numeric characters.
 * @type {RegExp}
 * @private
 */
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;


/**
 * String comparison function that handles numbers in a way humans might expect.
 * Using this function, the string "File 2.jpg" sorts before "File 10.jpg". The
 * comparison is mostly case-insensitive, though strings that are identical
 * except for case are sorted with the upper-case strings before lower-case.
 *
 * This comparison function is significantly slower (about 500x) than either
 * the default or the case-insensitive compare. It should not be used in
 * time-critical code, but should be fast enough to sort several hundred short
 * strings (like filenames) with a reasonable delay.
 *
 * @param {string} str1 The string to compare in a numerically sensitive way.
 * @param {string} str2 The string to compare {@code str1} to.
 * @return {number} less than 0 if str1 < str2, 0 if str1 == str2, greater than
 *     0 if str1 > str2.
 */
goog.string.numerateCompare = function(str1, str2) {
  if (str1 == str2) {
    return 0;
  }
  if (!str1) {
    return -1;
  }
  if (!str2) {
    return 1;
  }

  // Using match to split the entire string ahead of time turns out to be faster
  // for most inputs than using RegExp.exec or iterating over each character.
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);

  var count = Math.min(tokens1.length, tokens2.length);

  for (var i = 0; i < count; i++) {
    var a = tokens1[i];
    var b = tokens2[i];

    // Compare pairs of tokens, returning if one token sorts before the other.
    if (a != b) {

      // Only if both tokens are integers is a special comparison required.
      // Decimal numbers are sorted as strings (e.g., '.09' < '.1').
      var num1 = parseInt(a, 10);
      if (!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if (!isNaN(num2) && num1 - num2) {
          return num1 - num2;
        }
      }
      return a < b ? -1 : 1;
    }
  }

  // If one string is a substring of the other, the shorter string sorts first.
  if (tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length;
  }

  // The two strings must be equivalent except for case (perfect equality is
  // tested at the head of the function.) Revert to default ASCII-betical string
  // comparison to stablize the sort.
  return str1 < str2 ? -1 : 1;
};


/**
 * URL-encodes a string
 * @param {*} str The string to url-encode.
 * @return {string} An encoded copy of {@code str} that is safe for urls.
 *     Note that '#', ':', and other characters used to delimit portions
 *     of URLs *will* be encoded.
 */
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str));
};


/**
 * URL-decodes the string. We need to specially handle '+'s because
 * the javascript library doesn't convert them to spaces.
 * @param {string} str The string to url decode.
 * @return {string} The decoded {@code str}.
 */
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, ' '));
};


/**
 * Converts \n to <br>s or <br />s.
 * @param {string} str The string in which to convert newlines.
 * @param {boolean=} opt_xml Whether to use XML compatible tags.
 * @return {string} A copy of {@code str} with converted newlines.
 */
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? '<br />' : '<br>');
};


/**
 * Escape double quote '"' characters in addition to '&', '<', and '>' so that a
 * string can be included in an HTML tag attribute value within double quotes.
 *
 * It should be noted that > doesn't need to be escaped for the HTML or XML to
 * be valid, but it has been decided to escape it for consistency with other
 * implementations.
 *
 * NOTE(user):
 * HtmlEscape is often called during the generation of large blocks of HTML.
 * Using statics for the regular expressions and strings is an optimization
 * that can more than half the amount of time IE spends in this function for
 * large apps, since strings and regexes both contribute to GC allocations.
 *
 * Testing for the presence of a character before escaping increases the number
 * of function calls, but actually provides a speed increase for the average
 * case -- since the average case often doesn't require the escaping of all 4
 * characters and indexOf() is much cheaper than replace().
 * The worst case does suffer slightly from the additional calls, therefore the
 * opt_isLikelyToContainHtmlChars option has been included for situations
 * where all 4 HTML entities are very likely to be present and need escaping.
 *
 * Some benchmarks (times tended to fluctuate +-0.05ms):
 *                                     FireFox                     IE6
 * (no chars / average (mix of cases) / all 4 chars)
 * no checks                     0.13 / 0.22 / 0.22         0.23 / 0.53 / 0.80
 * indexOf                       0.08 / 0.17 / 0.26         0.22 / 0.54 / 0.84
 * indexOf + re test             0.07 / 0.17 / 0.28         0.19 / 0.50 / 0.85
 *
 * An additional advantage of checking if replace actually needs to be called
 * is a reduction in the number of object allocations, so as the size of the
 * application grows the difference between the various methods would increase.
 *
 * @param {string} str string to be escaped.
 * @param {boolean=} opt_isLikelyToContainHtmlChars Don't perform a check to see
 *     if the character needs replacing - use this option if you expect each of
 *     the characters to appear often. Leave false if you expect few html
 *     characters to occur in your strings, such as if you are escaping HTML.
 * @return {string} An escaped copy of {@code str}.
 */
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {

  if (opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, '&amp;')
          .replace(goog.string.ltRe_, '&lt;')
          .replace(goog.string.gtRe_, '&gt;')
          .replace(goog.string.quotRe_, '&quot;');

  } else {
    // quick test helps in the case when there are no chars to replace, in
    // worst case this makes barely a difference to the time taken
    if (!goog.string.allRe_.test(str)) return str;

    // str.indexOf is faster than regex.test in this case
    if (str.indexOf('&') != -1) {
      str = str.replace(goog.string.amperRe_, '&amp;');
    }
    if (str.indexOf('<') != -1) {
      str = str.replace(goog.string.ltRe_, '&lt;');
    }
    if (str.indexOf('>') != -1) {
      str = str.replace(goog.string.gtRe_, '&gt;');
    }
    if (str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, '&quot;');
    }
    return str;
  }
};


/**
 * Regular expression that matches an ampersand, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.amperRe_ = /&/g;


/**
 * Regular expression that matches a less than sign, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.ltRe_ = /</g;


/**
 * Regular expression that matches a greater than sign, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.gtRe_ = />/g;


/**
 * Regular expression that matches a double quote, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.quotRe_ = /\"/g;


/**
 * Regular expression that matches any character that needs to be escaped.
 * @type {RegExp}
 * @private
 */
goog.string.allRe_ = /[&<>\"]/;


/**
 * Unescapes an HTML string.
 *
 * @param {string} str The string to unescape.
 * @return {string} An unescaped copy of {@code str}.
 */
goog.string.unescapeEntities = function(str) {
  if (goog.string.contains(str, '&')) {
    // We are careful not to use a DOM if we do not have one. We use the []
    // notation so that the JSCompiler will not complain about these objects and
    // fields in the case where we have no DOM.
    if ('document' in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str);
    } else {
      // Fall back on pure XML entities
      return goog.string.unescapePureXmlEntities_(str);
    }
  }
  return str;
};


/**
 * Unescapes an HTML string using a DOM to resolve non-XML, non-numeric
 * entities. This function is XSS-safe and whitespace-preserving.
 * @private
 * @param {string} str The string to unescape.
 * @return {string} The unescaped {@code str} string.
 */
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"'};
  var div = document.createElement('div');
  // Match as many valid entity characters as possible. If the actual entity
  // happens to be shorter, it will still work as innerHTML will return the
  // trailing characters unchanged. Since the entity characters do not include
  // open angle bracket, there is no chance of XSS from the innerHTML use.
  // Since no whitespace is passed to innerHTML, whitespace is preserved.
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    // Check for cached entity.
    var value = seen[s];
    if (value) {
      return value;
    }
    // Check for numeric entity.
    if (entity.charAt(0) == '#') {
      // Prefix with 0 so that hex entities (e.g. &#x10) parse as hex numbers.
      var n = Number('0' + entity.substr(1));
      if (!isNaN(n)) {
        value = String.fromCharCode(n);
      }
    }
    // Fall back to innerHTML otherwise.
    if (!value) {
      // Append a non-entity character to avoid a bug in Webkit that parses
      // an invalid entity at the end of innerHTML text as the empty string.
      div.innerHTML = s + ' ';
      // Then remove the trailing character from the result.
      value = div.firstChild.nodeValue.slice(0, -1);
    }
    // Cache and return.
    return seen[s] = value;
  });
};


/**
 * Unescapes XML entities.
 * @private
 * @param {string} str The string to unescape.
 * @return {string} An unescaped copy of {@code str}.
 */
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch (entity) {
      case 'amp':
        return '&';
      case 'lt':
        return '<';
      case 'gt':
        return '>';
      case 'quot':
        return '"';
      default:
        if (entity.charAt(0) == '#') {
          // Prefix with 0 so that hex entities (e.g. &#x10) parse as hex.
          var n = Number('0' + entity.substr(1));
          if (!isNaN(n)) {
            return String.fromCharCode(n);
          }
        }
        // For invalid entities we just return the entity
        return s;
    }
  });
};


/**
 * Regular expression that matches an HTML entity.
 * See also HTML5: Tokenization / Tokenizing character references.
 * @private
 * @type {!RegExp}
 */
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;


/**
 * Do escaping of whitespace to preserve spatial formatting. We use character
 * entity #160 to make it safer for xml.
 * @param {string} str The string in which to escape whitespace.
 * @param {boolean=} opt_xml Whether to use XML compatible tags.
 * @return {string} An escaped copy of {@code str}.
 */
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, ' &#160;'), opt_xml);
};


/**
 * Strip quote characters around a string.  The second argument is a string of
 * characters to treat as quotes.  This can be a single character or a string of
 * multiple character and in that case each of those are treated as possible
 * quote characters. For example:
 *
 * <pre>
 * goog.string.stripQuotes('"abc"', '"`') --> 'abc'
 * goog.string.stripQuotes('`abc`', '"`') --> 'abc'
 * </pre>
 *
 * @param {string} str The string to strip.
 * @param {string} quoteChars The quote characters to strip.
 * @return {string} A copy of {@code str} without the quotes.
 */
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for (var i = 0; i < length; i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if (str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1);
    }
  }
  return str;
};


/**
 * Truncates a string to a certain length and adds '...' if necessary.  The
 * length also accounts for the ellipsis, so a maximum length of 10 and a string
 * 'Hello World!' produces 'Hello W...'.
 * @param {string} str The string to truncate.
 * @param {number} chars Max number of characters.
 * @param {boolean=} opt_protectEscapedCharacters Whether to protect escaped
 *     characters from being cut off in the middle.
 * @return {string} The truncated {@code str} string.
 */
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if (opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str);
  }

  if (str.length > chars) {
    str = str.substring(0, chars - 3) + '...';
  }

  if (opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str);
  }

  return str;
};


/**
 * Truncate a string in the middle, adding "..." if necessary,
 * and favoring the beginning of the string.
 * @param {string} str The string to truncate the middle of.
 * @param {number} chars Max number of characters.
 * @param {boolean=} opt_protectEscapedCharacters Whether to protect escaped
 *     characters from being cutoff in the middle.
 * @param {number=} opt_trailingChars Optional number of trailing characters to
 *     leave at the end of the string, instead of truncating as close to the
 *     middle as possible.
 * @return {string} A truncated copy of {@code str}.
 */
goog.string.truncateMiddle = function(str, chars,
    opt_protectEscapedCharacters, opt_trailingChars) {
  if (opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str);
  }

  if (opt_trailingChars && str.length > chars) {
    if (opt_trailingChars > chars) {
      opt_trailingChars = chars;
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + '...' + str.substring(endPoint);
  } else if (str.length > chars) {
    // Favor the beginning of the string:
    var half = Math.floor(chars / 2);
    var endPos = str.length - half;
    half += chars % 2;
    str = str.substring(0, half) + '...' + str.substring(endPos);
  }

  if (opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str);
  }

  return str;
};


/**
 * Special chars that need to be escaped for goog.string.quote.
 * @private
 * @type {Object}
 */
goog.string.specialEscapeChars_ = {
  '\0': '\\0',
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\x0B': '\\x0B', // '\v' is not supported in JScript
  '"': '\\"',
  '\\': '\\\\'
};


/**
 * Character mappings used internally for goog.string.escapeChar.
 * @private
 * @type {Object}
 */
goog.string.jsEscapeCache_ = {
  '\'': '\\\''
};


/**
 * Encloses a string in double quotes and escapes characters so that the
 * string is a valid JS string.
 * @param {string} s The string to quote.
 * @return {string} A copy of {@code s} surrounded by double quotes.
 */
goog.string.quote = function(s) {
  s = String(s);
  if (s.quote) {
    return s.quote();
  } else {
    var sb = ['"'];
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] ||
          ((cc > 31 && cc < 127) ? ch : goog.string.escapeChar(ch));
    }
    sb.push('"');
    return sb.join('');
  }
};


/**
 * Takes a string and returns the escaped string for that character.
 * @param {string} str The string to escape.
 * @return {string} An escaped string representing {@code str}.
 */
goog.string.escapeString = function(str) {
  var sb = [];
  for (var i = 0; i < str.length; i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i));
  }
  return sb.join('');
};


/**
 * Takes a character and returns the escaped string for that character. For
 * example escapeChar(String.fromCharCode(15)) -> "\\x0E".
 * @param {string} c The character to escape.
 * @return {string} An escaped string representing {@code c}.
 */
goog.string.escapeChar = function(c) {
  if (c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c];
  }

  if (c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c];
  }

  var rv = c;
  var cc = c.charCodeAt(0);
  if (cc > 31 && cc < 127) {
    rv = c;
  } else {
    // tab is 9 but handled above
    if (cc < 256) {
      rv = '\\x';
      if (cc < 16 || cc > 256) {
        rv += '0';
      }
    } else {
      rv = '\\u';
      if (cc < 4096) { // \u1000
        rv += '0';
      }
    }
    rv += cc.toString(16).toUpperCase();
  }

  return goog.string.jsEscapeCache_[c] = rv;
};


/**
 * Takes a string and creates a map (Object) in which the keys are the
 * characters in the string. The value for the key is set to true. You can
 * then use goog.object.map or goog.array.map to change the values.
 * @param {string} s The string to build the map from.
 * @return {Object} The map of characters used.
 */
// TODO(arv): It seems like we should have a generic goog.array.toMap. But do
//            we want a dependency on goog.array in goog.string?
goog.string.toMap = function(s) {
  var rv = {};
  for (var i = 0; i < s.length; i++) {
    rv[s.charAt(i)] = true;
  }
  return rv;
};


/**
 * Checks whether a string contains a given substring.
 * @param {string} s The string to test.
 * @param {string} ss The substring to test for.
 * @return {boolean} True if {@code s} contains {@code ss}.
 */
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1;
};


/**
 * Returns the non-overlapping occurrences of ss in s.
 * If either s or ss evalutes to false, then returns zero.
 * @param {string} s The string to look in.
 * @param {string} ss The string to look for.
 * @return {number} Number of occurrences of ss in s.
 */
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0;
};


/**
 * Removes a substring of a specified length at a specific
 * index in a string.
 * @param {string} s The base string from which to remove.
 * @param {number} index The index at which to remove the substring.
 * @param {number} stringLength The length of the substring to remove.
 * @return {string} A copy of {@code s} with the substring removed or the full
 *     string if nothing is removed or the input is invalid.
 */
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  // If the index is greater or equal to 0 then remove substring
  if (index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) +
        s.substr(index + stringLength, s.length - index - stringLength);
  }
  return resultStr;
};


/**
 *  Removes the first occurrence of a substring from a string.
 *  @param {string} s The base string from which to remove.
 *  @param {string} ss The string to remove.
 *  @return {string} A copy of {@code s} with {@code ss} removed or the full
 *      string if nothing is removed.
 */
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), '');
  return s.replace(re, '');
};


/**
 *  Removes all occurrences of a substring from a string.
 *  @param {string} s The base string from which to remove.
 *  @param {string} ss The string to remove.
 *  @return {string} A copy of {@code s} with {@code ss} removed or the full
 *      string if nothing is removed.
 */
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), 'g');
  return s.replace(re, '');
};


/**
 * Escapes characters in the string that are not safe to use in a RegExp.
 * @param {*} s The string to escape. If not a string, it will be casted
 *     to one.
 * @return {string} A RegExp safe, escaped copy of {@code s}.
 */
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').
      replace(/\x08/g, '\\x08');
};


/**
 * Repeats a string n times.
 * @param {string} string The string to repeat.
 * @param {number} length The number of times to repeat.
 * @return {string} A string containing {@code length} repetitions of
 *     {@code string}.
 */
goog.string.repeat = function(string, length) {
  return new Array(length + 1).join(string);
};


/**
 * Pads number to given length and optionally rounds it to a given precision.
 * For example:
 * <pre>padNumber(1.25, 2, 3) -> '01.250'
 * padNumber(1.25, 2) -> '01.25'
 * padNumber(1.25, 2, 1) -> '01.3'
 * padNumber(1.25, 0) -> '1.25'</pre>
 *
 * @param {number} num The number to pad.
 * @param {number} length The desired length.
 * @param {number=} opt_precision The desired precision.
 * @return {string} {@code num} as a string with the given options.
 */
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf('.');
  if (index == -1) {
    index = s.length;
  }
  return goog.string.repeat('0', Math.max(0, length - index)) + s;
};


/**
 * Returns a string representation of the given object, with
 * null and undefined being returned as the empty string.
 *
 * @param {*} obj The object to convert.
 * @return {string} A string representation of the {@code obj}.
 */
goog.string.makeSafe = function(obj) {
  return obj == null ? '' : String(obj);
};


/**
 * Concatenates string expressions. This is useful
 * since some browsers are very inefficient when it comes to using plus to
 * concat strings. Be careful when using null and undefined here since
 * these will not be included in the result. If you need to represent these
 * be sure to cast the argument to a String first.
 * For example:
 * <pre>buildString('a', 'b', 'c', 'd') -> 'abcd'
 * buildString(null, undefined) -> ''
 * </pre>
 * @param {...*} var_args A list of strings to concatenate. If not a string,
 *     it will be casted to one.
 * @return {string} The concatenation of {@code var_args}.
 */
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, '');
};


/**
 * Returns a string with at least 64-bits of randomness.
 *
 * Doesn't trust Javascript's random function entirely. Uses a combination of
 * random and current timestamp, and then encodes the string in base-36 to
 * make it shorter.
 *
 * @return {string} A random string, e.g. sn1s7vb4gcic.
 */
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) +
         Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36);
};


/**
 * Compares two version numbers.
 *
 * @param {string|number} version1 Version of first item.
 * @param {string|number} version2 Version of second item.
 *
 * @return {number}  1 if {@code version1} is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code version2} is higher.
 */
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  // Trim leading and trailing whitespace and split the versions into
  // subversions.
  var v1Subs = goog.string.trim(String(version1)).split('.');
  var v2Subs = goog.string.trim(String(version2)).split('.');
  var subCount = Math.max(v1Subs.length, v2Subs.length);

  // Iterate over the subversions, as long as they appear to be equivalent.
  for (var subIdx = 0; order == 0 && subIdx < subCount; subIdx++) {
    var v1Sub = v1Subs[subIdx] || '';
    var v2Sub = v2Subs[subIdx] || '';

    // Split the subversions into pairs of numbers and qualifiers (like 'b').
    // Two different RegExp objects are needed because they are both using
    // the 'g' flag.
    var v1CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    var v2CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ['', '', ''];
      var v2Comp = v2CompParser.exec(v2Sub) || ['', '', ''];
      // Break if there are no more matches.
      if (v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break;
      }

      // Parse the numeric part of the subversion. A missing number is
      // equivalent to 0.
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);

      // Compare the subversion components. The number has the highest
      // precedence. Next, if the numbers are equal, a subversion without any
      // qualifier is always higher than a subversion with any qualifier. Next,
      // the qualifiers are compared as strings.
      order = goog.string.compareElements_(v1CompNum, v2CompNum) ||
          goog.string.compareElements_(v1Comp[2].length == 0,
              v2Comp[2].length == 0) ||
          goog.string.compareElements_(v1Comp[2], v2Comp[2]);
      // Stop as soon as an inequality is discovered.
    } while (order == 0);
  }

  return order;
};


/**
 * Compares elements of a version number.
 *
 * @param {string|number|boolean} left An element from a version number.
 * @param {string|number|boolean} right An element from a version number.
 *
 * @return {number}  1 if {@code left} is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code right} is higher.
 * @private
 */
goog.string.compareElements_ = function(left, right) {
  if (left < right) {
    return -1;
  } else if (left > right) {
    return 1;
  }
  return 0;
};


/**
 * Maximum value of #goog.string.hashCode, exclusive. 2^32.
 * @type {number}
 * @private
 */
goog.string.HASHCODE_MAX_ = 0x100000000;


/**
 * String hash function similar to java.lang.String.hashCode().
 * The hash code for a string is computed as
 * s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
 * where s[i] is the ith character of the string and n is the length of
 * the string. We mod the result to make it between 0 (inclusive) and 2^32
 * (exclusive).
 * @param {string} str A string.
 * @return {number} Hash value for {@code str}, between 0 (inclusive) and 2^32
 *  (exclusive). The empty string returns 0.
 */
goog.string.hashCode = function(str) {
  var result = 0;
  for (var i = 0; i < str.length; ++i) {
    result = 31 * result + str.charCodeAt(i);
    // Normalize to 4 byte range, 0 ... 2^32.
    result %= goog.string.HASHCODE_MAX_;
  }
  return result;
};


/**
 * The most recent unique ID. |0 is equivalent to Math.floor in this case.
 * @type {number}
 * @private
 */
goog.string.uniqueStringCounter_ = Math.random() * 0x80000000 | 0;


/**
 * Generates and returns a string which is unique in the current document.
 * This is useful, for example, to create unique IDs for DOM elements.
 * @return {string} A unique id.
 */
goog.string.createUniqueString = function() {
  return 'goog_' + goog.string.uniqueStringCounter_++;
};


/**
 * Converts the supplied string to a number, which may be Ininity or NaN.
 * This function strips whitespace: (toNumber(' 123') === 123)
 * This function accepts scientific notation: (toNumber('1e1') === 10)
 *
 * This is better than Javascript's built-in conversions because, sadly:
 *     (Number(' ') === 0) and (parseFloat('123a') === 123)
 *
 * @param {string} str The string to convert.
 * @return {number} The number the supplied string represents, or NaN.
 */
goog.string.toNumber = function(str) {
  var num = Number(str);
  if (num == 0 && goog.string.isEmpty(str)) {
    return NaN;
  }
  return num;
};


/**
 * Converts a string from selector-case to camelCase (e.g. from
 * "multi-part-string" to "multiPartString"), useful for converting
 * CSS selectors and HTML dataset keys to their equivalent JS properties.
 * @param {string} str The string in selector-case form.
 * @return {string} The string in camelCase form.
 */
goog.string.toCamelCase = function(str) {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase();
  });
};


/**
 * Converts a string from camelCase to selector-case (e.g. from
 * "multiPartString" to "multi-part-string"), useful for converting JS
 * style and dataset properties to equivalent CSS selectors and HTML keys.
 * @param {string} str The string in camelCase form.
 * @return {string} The string in selector-case form.
 */
goog.string.toSelectorCase = function(str) {
  return String(str).replace(/([A-Z])/g, '-$1').toLowerCase();
};


/**
 * Converts a string into TitleCase. First character of the string is always
 * capitalized in addition to the first letter of every subsequent word.
 * Words are delimited by one or more whitespaces by default. Custom delimiters
 * can optionally be specified to replace the default, which doesn't preserve
 * whitespace delimiters and instead must be explicitly included if needed.
 *
 * Default delimiter => " ":
 *    goog.string.toTitleCase('oneTwoThree')    => 'OneTwoThree'
 *    goog.string.toTitleCase('one two three')  => 'One Two Three'
 *    goog.string.toTitleCase('  one   two   ') => '  One   Two   '
 *    goog.string.toTitleCase('one_two_three')  => 'One_two_three'
 *    goog.string.toTitleCase('one-two-three')  => 'One-two-three'
 *
 * Custom delimiter => "_-.":
 *    goog.string.toTitleCase('oneTwoThree', '_-.')       => 'OneTwoThree'
 *    goog.string.toTitleCase('one two three', '_-.')     => 'One two three'
 *    goog.string.toTitleCase('  one   two   ', '_-.')    => '  one   two   '
 *    goog.string.toTitleCase('one_two_three', '_-.')     => 'One_Two_Three'
 *    goog.string.toTitleCase('one-two-three', '_-.')     => 'One-Two-Three'
 *    goog.string.toTitleCase('one...two...three', '_-.') => 'One...Two...Three'
 *    goog.string.toTitleCase('one. two. three', '_-.')   => 'One. two. three'
 *    goog.string.toTitleCase('one-two.three', '_-.')     => 'One-Two.Three'
 *
 * @param {string} str String value in camelCase form.
 * @param {string=} opt_delimiters Custom delimiter character set used to
 *      distinguish words in the string value. Each character represents a
 *      single delimiter. When provided, default whitespace delimiter is
 *      overridden and must be explicitly included if needed.
 * @return {string} String value in TitleCase form.
 */
goog.string.toTitleCase = function(str, opt_delimiters) {
  var delimiters = goog.isString(opt_delimiters) ?
      goog.string.regExpEscape(opt_delimiters) : '\\s';

  // For IE8, we need to prevent using an empty character set. Otherwise,
  // incorrect matching will occur.
  delimiters = delimiters ? '|[' + delimiters + ']+' : '';

  var regexp = new RegExp('(^' + delimiters + ')([a-z])', 'g');
  return str.replace(regexp, function(all, p1, p2) {
    return p1 + p2.toUpperCase();
  });
};


/**
 * Parse a string in decimal or hexidecimal ('0xFFFF') form.
 *
 * To parse a particular radix, please use parseInt(string, radix) directly. See
 * https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/parseInt
 *
 * This is a wrapper for the built-in parseInt function that will only parse
 * numbers as base 10 or base 16.  Some JS implementations assume strings
 * starting with "0" are intended to be octal. ES3 allowed but discouraged
 * this behavior. ES5 forbids it.  This function emulates the ES5 behavior.
 *
 * For more information, see Mozilla JS Reference: http://goo.gl/8RiFj
 *
 * @param {string|number|null|undefined} value The value to be parsed.
 * @return {number} The number, parsed. If the string failed to parse, this
 *     will be NaN.
 */
goog.string.parseInt = function(value) {
  // Force finite numbers to strings.
  if (isFinite(value)) {
    value = String(value);
  }

  if (goog.isString(value)) {
    // If the string starts with '0x' or '-0x', parse as hex.
    return /^\s*-?0x/i.test(value) ?
        parseInt(value, 16) : parseInt(value, 10);
  }

  return NaN;
};

// Input 3
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities to check the preconditions, postconditions and
 * invariants runtime.
 *
 * Methods in this package should be given special treatment by the compiler
 * for type-inference. For example, <code>goog.asserts.assert(foo)</code>
 * will restrict <code>foo</code> to a truthy value.
 *
 * The compiler has an option to disable asserts. So code like:
 * <code>
 * var x = goog.asserts.assert(foo()); goog.asserts.assert(bar());
 * </code>
 * will be transformed into:
 * <code>
 * var x = foo();
 * </code>
 * The compiler will leave in foo() (because its return value is used),
 * but it will remove bar() because it assumes it does not have side-effects.
 *
 */

goog.provide('goog.asserts');
goog.provide('goog.asserts.AssertionError');

goog.require('goog.debug.Error');
goog.require('goog.string');


/**
 * @define {boolean} Whether to strip out asserts or to leave them in.
 */
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;



/**
 * Error object for failed assertions.
 * @param {string} messagePattern The pattern that was used to form message.
 * @param {!Array.<*>} messageArgs The items to substitute into the pattern.
 * @constructor
 * @extends {goog.debug.Error}
 */
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  // Remove the messagePattern afterwards to avoid permenantly modifying the
  // passed in array.
  messageArgs.shift();

  /**
   * The message pattern used to format the error message. Error handlers can
   * use this to uniquely identify the assertion.
   * @type {string}
   */
  this.messagePattern = messagePattern;
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);


/** @override */
goog.asserts.AssertionError.prototype.name = 'AssertionError';


/**
 * Throws an exception with the given message and "Assertion failed" prefixed
 * onto it.
 * @param {string} defaultMessage The message to use if givenMessage is empty.
 * @param {Array.<*>} defaultArgs The substitution arguments for defaultMessage.
 * @param {string|undefined} givenMessage Message supplied by the caller.
 * @param {Array.<*>} givenArgs The substitution arguments for givenMessage.
 * @throws {goog.asserts.AssertionError} When the value is not a number.
 * @private
 */
goog.asserts.doAssertFailure_ =
    function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = 'Assertion failed';
  if (givenMessage) {
    message += ': ' + givenMessage;
    var args = givenArgs;
  } else if (defaultMessage) {
    message += ': ' + defaultMessage;
    args = defaultArgs;
  }
  // The '' + works around an Opera 10 bug in the unit tests. Without it,
  // a stack trace is added to var message above. With this, a stack trace is
  // not added until this line (it causes the extra garbage to be added after
  // the assertion message instead of in the middle of it).
  throw new goog.asserts.AssertionError('' + message, args || []);
};


/**
 * Checks if the condition evaluates to true if goog.asserts.ENABLE_ASSERTS is
 * true.
 * @param {*} condition The condition to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {*} The value of the condition.
 * @throws {goog.asserts.AssertionError} When the condition evaluates to false.
 */
goog.asserts.assert = function(condition, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_('', null, opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return condition;
};


/**
 * Fails if goog.asserts.ENABLE_ASSERTS is true. This function is useful in case
 * when we want to add a check in the unreachable area like switch-case
 * statement:
 *
 * <pre>
 *  switch(type) {
 *    case FOO: doSomething(); break;
 *    case BAR: doSomethingElse(); break;
 *    default: goog.assert.fail('Unrecognized type: ' + type);
 *      // We have only 2 types - "default:" section is unreachable code.
 *  }
 * </pre>
 *
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} Failure.
 */
goog.asserts.fail = function(opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError(
        'Failure' + (opt_message ? ': ' + opt_message : ''),
        Array.prototype.slice.call(arguments, 1));
  }
};


/**
 * Checks if the value is a number if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {number} The value, guaranteed to be a number when asserts enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a number.
 */
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_('Expected number but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {number} */ (value);
};


/**
 * Checks if the value is a string if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {string} The value, guaranteed to be a string when asserts enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a string.
 */
goog.asserts.assertString = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_('Expected string but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {string} */ (value);
};


/**
 * Checks if the value is a function if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Function} The value, guaranteed to be a function when asserts
 *     enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a function.
 */
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_('Expected function but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Function} */ (value);
};


/**
 * Checks if the value is an Object if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Object} The value, guaranteed to be a non-null object.
 * @throws {goog.asserts.AssertionError} When the value is not an object.
 */
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_('Expected object but got %s: %s.',
        [goog.typeOf(value), value],
        opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Object} */ (value);
};


/**
 * Checks if the value is an Array if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Array} The value, guaranteed to be a non-null array.
 * @throws {goog.asserts.AssertionError} When the value is not an array.
 */
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_('Expected array but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Array} */ (value);
};


/**
 * Checks if the value is a boolean if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {boolean} The value, guaranteed to be a boolean when asserts are
 *     enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a boolean.
 */
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_('Expected boolean but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {boolean} */ (value);
};


/**
 * Checks if the value is an instance of the user-defined type if
 * goog.asserts.ENABLE_ASSERTS is true.
 *
 * The compiler may tighten the type returned by this function.
 *
 * @param {*} value The value to check.
 * @param {!Function} type A user-defined constructor.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the value is not an instance of
 *     type.
 * @return {!Object}
 */
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_('instanceof check failed.', null,
        opt_message, Array.prototype.slice.call(arguments, 3));
  }
  return /** @type {!Object} */(value);
};


// Input 4
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for manipulating arrays.
 *
 */


goog.provide('goog.array');
goog.provide('goog.array.ArrayLike');

goog.require('goog.asserts');


/**
 * @define {boolean} NATIVE_ARRAY_PROTOTYPES indicates whether the code should
 * rely on Array.prototype functions, if available.
 *
 * The Array.prototype functions can be defined by external libraries like
 * Prototype and setting this flag to false forces closure to use its own
 * goog.array implementation.
 *
 * If your javascript can be loaded by a third party site and you are wary about
 * relying on the prototype functions, specify
 * "--define goog.NATIVE_ARRAY_PROTOTYPES=false" to the JSCompiler.
 */
goog.NATIVE_ARRAY_PROTOTYPES = true;


/**
 * @typedef {Array|NodeList|Arguments|{length: number}}
 */
goog.array.ArrayLike;


/**
 * Returns the last element in an array without removing it.
 * @param {goog.array.ArrayLike} array The array.
 * @return {*} Last item in array.
 */
goog.array.peek = function(array) {
  return array[array.length - 1];
};


/**
 * Reference to the original {@code Array.prototype}.
 * @private
 */
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;


// NOTE(arv): Since most of the array functions are generic it allows you to
// pass an array-like object. Strings have a length and are considered array-
// like. However, the 'in' operator does not work on strings so we cannot just
// use the array path even if the browser supports indexing into strings. We
// therefore end up splitting the string.


/**
 * Returns the index of the first element of an array with a specified
 * value, or -1 if the element is not present in the array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-indexof}
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {*} obj The object for which we are searching.
 * @param {number=} opt_fromIndex The index at which to start the search. If
 *     omitted the search starts at index 0.
 * @return {number} The index of the first matching array element.
 */
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES &&
                     goog.array.ARRAY_PROTOTYPE_.indexOf ?
    function(arr, obj, opt_fromIndex) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex);
    } :
    function(arr, obj, opt_fromIndex) {
      var fromIndex = opt_fromIndex == null ?
          0 : (opt_fromIndex < 0 ?
               Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex);

      if (goog.isString(arr)) {
        // Array.prototype.indexOf uses === so only strings should be found.
        if (!goog.isString(obj) || obj.length != 1) {
          return -1;
        }
        return arr.indexOf(obj, fromIndex);
      }

      for (var i = fromIndex; i < arr.length; i++) {
        if (i in arr && arr[i] === obj)
          return i;
      }
      return -1;
    };


/**
 * Returns the index of the last element of an array with a specified value, or
 * -1 if the element is not present in the array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-lastindexof}
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {*} obj The object for which we are searching.
 * @param {?number=} opt_fromIndex The index at which to start the search. If
 *     omitted the search starts at the end of the array.
 * @return {number} The index of the last matching array element.
 */
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES &&
                         goog.array.ARRAY_PROTOTYPE_.lastIndexOf ?
    function(arr, obj, opt_fromIndex) {
      goog.asserts.assert(arr.length != null);

      // Firefox treats undefined and null as 0 in the fromIndex argument which
      // leads it to always return -1
      var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
      return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex);
    } :
    function(arr, obj, opt_fromIndex) {
      var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;

      if (fromIndex < 0) {
        fromIndex = Math.max(0, arr.length + fromIndex);
      }

      if (goog.isString(arr)) {
        // Array.prototype.lastIndexOf uses === so only strings should be found.
        if (!goog.isString(obj) || obj.length != 1) {
          return -1;
        }
        return arr.lastIndexOf(obj, fromIndex);
      }

      for (var i = fromIndex; i >= 0; i--) {
        if (i in arr && arr[i] === obj)
          return i;
      }
      return -1;
    };


/**
 * Calls a function for each element in an array. Skips holes in the array.
 * See {@link http://tinyurl.com/developer-mozilla-org-array-foreach}
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array like object over
 *     which to iterate.
 * @param {?function(this: S, T, number, ?): ?} f The function to call for every
 *     element. This function takes 3 arguments (the element, the index and the
 *     array). The return value is ignored.
 * @param {S=} opt_obj The object to be used as the value of 'this' within f.
 * @template T,S
 */
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES &&
                     goog.array.ARRAY_PROTOTYPE_.forEach ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          f.call(opt_obj, arr2[i], i, arr);
        }
      }
    };


/**
 * Calls a function for each element in an array, starting from the last
 * element rather than the first.
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this: S, T, number, ?): ?} f The function to call for every
 *     element. This function
 *     takes 3 arguments (the element, the index and the array). The return
 *     value is ignored.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @template T,S
 */
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;  // must be fixed during loop... see docs
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = l - 1; i >= 0; --i) {
    if (i in arr2) {
      f.call(opt_obj, arr2[i], i, arr);
    }
  }
};


/**
 * Calls a function for each element in an array, and if the function returns
 * true adds the element to a new array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-filter}
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?):boolean} f The function to call for
 *     every element. This function
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a Boolean. If the return value is true the element is added to the
 *     result array. If it is false the element is not included.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {!Array} a new array in which only elements that passed the test are
 *     present.
 * @template T,S
 */
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES &&
                    goog.array.ARRAY_PROTOTYPE_.filter ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var res = [];
      var resLength = 0;
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          var val = arr2[i];  // in case f mutates arr2
          if (f.call(opt_obj, val, i, arr)) {
            res[resLength++] = val;
          }
        }
      }
      return res;
    };


/**
 * Calls a function for each element in an array and inserts the result into a
 * new array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-map}
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?):?} f The function to call for every
 *     element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return something. The result will be inserted into a new array.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {!Array} a new array with the results from f.
 * @template T,S
 */
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES &&
                 goog.array.ARRAY_PROTOTYPE_.map ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var res = new Array(l);
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          res[i] = f.call(opt_obj, arr2[i], i, arr);
        }
      }
      return res;
    };


/**
 * Passes every element of an array into a function and accumulates the result.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-reduce}
 *
 * For example:
 * var a = [1, 2, 3, 4];
 * goog.array.reduce(a, function(r, v, i, arr) {return r + v;}, 0);
 * returns 10
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, R, T, number, ?) : R} f The function to call for
 *     every element. This function
 *     takes 4 arguments (the function's previous result or the initial value,
 *     the value of the current array element, the current array index, and the
 *     array itself)
 *     function(previousValue, currentValue, index, array).
 * @param {?} val The initial value to pass into the function on the first call.
 * @param {S=} opt_obj  The object to be used as the value of 'this'
 *     within f.
 * @return {R} Result of evaluating f repeatedly across the values of the array.
 * @template T,S,R
 */
goog.array.reduce = function(arr, f, val, opt_obj) {
  if (arr.reduce) {
    if (opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val);
    } else {
      return arr.reduce(f, val);
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr);
  });
  return rval;
};


/**
 * Passes every element of an array into a function and accumulates the result,
 * starting from the last element and working towards the first.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-reduceright}
 *
 * For example:
 * var a = ['a', 'b', 'c'];
 * goog.array.reduceRight(a, function(r, v, i, arr) {return r + v;}, '');
 * returns 'cba'
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, R, T, number, ?) : R} f The function to call for
 *     every element. This function
 *     takes 4 arguments (the function's previous result or the initial value,
 *     the value of the current array element, the current array index, and the
 *     array itself)
 *     function(previousValue, currentValue, index, array).
 * @param {?} val The initial value to pass into the function on the first call.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {R} Object returned as a result of evaluating f repeatedly across the
 *     values of the array.
 * @template T,S,R
 */
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if (arr.reduceRight) {
    if (opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val);
    } else {
      return arr.reduceRight(f, val);
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr);
  });
  return rval;
};


/**
 * Calls f for each element of an array. If any call returns true, some()
 * returns true (without checking the remaining elements). If all calls
 * return false, some() returns false.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-some}
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call for
 *     for every element. This function takes 3 arguments (the element, the
 *     index and the array) and should return a boolean.
 * @param {S=} opt_obj  The object to be used as the value of 'this'
 *     within f.
 * @return {boolean} true if any element passes the test.
 * @template T,S
 */
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES &&
                  goog.array.ARRAY_PROTOTYPE_.some ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
          return true;
        }
      }
      return false;
    };


/**
 * Call f for each element of an array. If all calls return true, every()
 * returns true. If any call returns false, every() returns false and
 * does not continue to check the remaining elements.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-every}
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call for
 *     for every element. This function takes 3 arguments (the element, the
 *     index and the array) and should return a boolean.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {boolean} false if any element fails the test.
 * @template T,S
 */
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES &&
                   goog.array.ARRAY_PROTOTYPE_.every ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
          return false;
        }
      }
      return true;
    };


/**
 * Counts the array elements that fulfill the predicate, i.e. for which the
 * callback function returns true. Skips holes in the array.
 *
 * @param {!(Array.<T>|goog.array.ArrayLike)} arr Array or array like object
 *     over which to iterate.
 * @param {function(this: S, T, number, ?): boolean} f The function to call for
 *     every element. Takes 3 arguments (the element, the index and the array).
 * @param {S=} opt_obj The object to be used as the value of 'this' within f.
 * @return {number} The number of the matching elements.
 * @template T,S
 */
goog.array.count = function(arr, f, opt_obj) {
  var count = 0;
  goog.array.forEach(arr, function(element, index, arr) {
    if (f.call(opt_obj, element, index, arr)) {
      ++count;
    }
  }, opt_obj);
  return count;
};


/**
 * Search an array for the first element that satisfies a given condition and
 * return that element.
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call
 *     for every element. This function takes 3 arguments (the element, the
 *     index and the array) and should return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {T} The first array element that passes the test, or null if no
 *     element is found.
 * @template T,S
 */
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};


/**
 * Search an array for the first element that satisfies a given condition and
 * return its index.
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call for
 *     every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {number} The index of the first array element that passes the test,
 *     or -1 if no element is found.
 * @template T,S
 */
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;  // must be fixed during loop... see docs
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = 0; i < l; i++) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return -1;
};


/**
 * Search an array (in reverse order) for the last element that satisfies a
 * given condition and return that element.
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call
 *     for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {T} The last array element that passes the test, or null if no
 *     element is found.
 * @template T,S
 */
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};


/**
 * Search an array (in reverse order) for the last element that satisfies a
 * given condition and return its index.
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call
 *     for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {Object=} opt_obj An optional "this" context for the function.
 * @return {number} The index of the last array element that passes the test,
 *     or -1 if no element is found.
 * @template T,S
 */
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;  // must be fixed during loop... see docs
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = l - 1; i >= 0; i--) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return -1;
};


/**
 * Whether the array contains the given object.
 * @param {goog.array.ArrayLike} arr The array to test for the presence of the
 *     element.
 * @param {*} obj The object for which to test.
 * @return {boolean} true if obj is present.
 */
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0;
};


/**
 * Whether the array is empty.
 * @param {goog.array.ArrayLike} arr The array to test.
 * @return {boolean} true if empty.
 */
goog.array.isEmpty = function(arr) {
  return arr.length == 0;
};


/**
 * Clears the array.
 * @param {goog.array.ArrayLike} arr Array or array like object to clear.
 */
goog.array.clear = function(arr) {
  // For non real arrays we don't have the magic length so we delete the
  // indices.
  if (!goog.isArray(arr)) {
    for (var i = arr.length - 1; i >= 0; i--) {
      delete arr[i];
    }
  }
  arr.length = 0;
};


/**
 * Pushes an item into an array, if it's not already in the array.
 * @param {Array.<T>} arr Array into which to insert the item.
 * @param {T} obj Value to add.
 * @template T
 */
goog.array.insert = function(arr, obj) {
  if (!goog.array.contains(arr, obj)) {
    arr.push(obj);
  }
};


/**
 * Inserts an object at the given index of the array.
 * @param {goog.array.ArrayLike} arr The array to modify.
 * @param {*} obj The object to insert.
 * @param {number=} opt_i The index at which to insert the object. If omitted,
 *      treated as 0. A negative index is counted from the end of the array.
 */
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj);
};


/**
 * Inserts at the given index of the array, all elements of another array.
 * @param {goog.array.ArrayLike} arr The array to modify.
 * @param {goog.array.ArrayLike} elementsToAdd The array of elements to add.
 * @param {number=} opt_i The index at which to insert the object. If omitted,
 *      treated as 0. A negative index is counted from the end of the array.
 */
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd);
};


/**
 * Inserts an object into an array before a specified object.
 * @param {Array.<T>} arr The array to modify.
 * @param {T} obj The object to insert.
 * @param {T=} opt_obj2 The object before which obj should be inserted. If obj2
 *     is omitted or not found, obj is inserted at the end of the array.
 * @template T
 */
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if (arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj);
  } else {
    goog.array.insertAt(arr, obj, i);
  }
};


/**
 * Removes the first occurrence of a particular value from an array.
 * @param {goog.array.ArrayLike} arr Array from which to remove value.
 * @param {*} obj Object to remove.
 * @return {boolean} True if an element was removed.
 */
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if ((rv = i >= 0)) {
    goog.array.removeAt(arr, i);
  }
  return rv;
};


/**
 * Removes from an array the element at index i
 * @param {goog.array.ArrayLike} arr Array or array like object from which to
 *     remove value.
 * @param {number} i The index to remove.
 * @return {boolean} True if an element was removed.
 */
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);

  // use generic form of splice
  // splice returns the removed items and if successful the length of that
  // will be 1
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1;
};


/**
 * Removes the first value that satisfies the given condition.
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call
 *     for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {boolean} True if an element was removed.
 * @template T,S
 */
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if (i >= 0) {
    goog.array.removeAt(arr, i);
    return true;
  }
  return false;
};


/**
 * Returns a new array that is the result of joining the arguments.  If arrays
 * are passed then their items are added, however, if non-arrays are passed they
 * will be added to the return array as is.
 *
 * Note that ArrayLike objects will be added as is, rather than having their
 * items added.
 *
 * goog.array.concat([1, 2], [3, 4]) -> [1, 2, 3, 4]
 * goog.array.concat(0, [1, 2]) -> [0, 1, 2]
 * goog.array.concat([1, 2], null) -> [1, 2, null]
 *
 * There is bug in all current versions of IE (6, 7 and 8) where arrays created
 * in an iframe become corrupted soon (not immediately) after the iframe is
 * destroyed. This is common if loading data via goog.net.IframeIo, for example.
 * This corruption only affects the concat method which will start throwing
 * Catastrophic Errors (#-2147418113).
 *
 * See http://endoflow.com/scratch/corrupted-arrays.html for a test case.
 *
 * Internally goog.array should use this, so that all methods will continue to
 * work on these broken array objects.
 *
 * @param {...*} var_args Items to concatenate.  Arrays will have each item
 *     added, while primitives and objects will be added as is.
 * @return {!Array} The new resultant array.
 */
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(
      goog.array.ARRAY_PROTOTYPE_, arguments);
};


/**
 * Converts an object to an array.
 * @param {goog.array.ArrayLike} object  The object to convert to an array.
 * @return {!Array} The object converted into an array. If object has a
 *     length property, every property indexed with a non-negative number
 *     less than length will be included in the result. If object does not
 *     have a length property, an empty array will be returned.
 */
goog.array.toArray = function(object) {
  var length = object.length;

  // If length is not a number the following it false. This case is kept for
  // backwards compatibility since there are callers that pass objects that are
  // not array like.
  if (length > 0) {
    var rv = new Array(length);
    for (var i = 0; i < length; i++) {
      rv[i] = object[i];
    }
    return rv;
  }
  return [];
};


/**
 * Does a shallow copy of an array.
 * @param {goog.array.ArrayLike} arr  Array or array-like object to clone.
 * @return {!Array} Clone of the input array.
 */
goog.array.clone = goog.array.toArray;


/**
 * Extends an array with another array, element, or "array like" object.
 * This function operates 'in-place', it does not create a new Array.
 *
 * Example:
 * var a = [];
 * goog.array.extend(a, [0, 1]);
 * a; // [0, 1]
 * goog.array.extend(a, 2);
 * a; // [0, 1, 2]
 *
 * @param {Array} arr1  The array to modify.
 * @param {...*} var_args The elements or arrays of elements to add to arr1.
 */
goog.array.extend = function(arr1, var_args) {
  for (var i = 1; i < arguments.length; i++) {
    var arr2 = arguments[i];
    // If we have an Array or an Arguments object we can just call push
    // directly.
    var isArrayLike;
    if (goog.isArray(arr2) ||
        // Detect Arguments. ES5 says that the [[Class]] of an Arguments object
        // is "Arguments" but only V8 and JSC/Safari gets this right. We instead
        // detect Arguments by checking for array like and presence of "callee".
        (isArrayLike = goog.isArrayLike(arr2)) &&
            // The getter for callee throws an exception in strict mode
            // according to section 10.6 in ES5 so check for presence instead.
            Object.prototype.hasOwnProperty.call(arr2, 'callee')) {
      arr1.push.apply(arr1, arr2);
    } else if (isArrayLike) {
      // Otherwise loop over arr2 to prevent copying the object.
      var len1 = arr1.length;
      var len2 = arr2.length;
      for (var j = 0; j < len2; j++) {
        arr1[len1 + j] = arr2[j];
      }
    } else {
      arr1.push(arr2);
    }
  }
};


/**
 * Adds or removes elements from an array. This is a generic version of Array
 * splice. This means that it might work on other objects similar to arrays,
 * such as the arguments object.
 *
 * @param {goog.array.ArrayLike} arr The array to modify.
 * @param {number|undefined} index The index at which to start changing the
 *     array. If not defined, treated as 0.
 * @param {number} howMany How many elements to remove (0 means no removal. A
 *     value below 0 is treated as zero and so is any other non number. Numbers
 *     are floored).
 * @param {...*} var_args Optional, additional elements to insert into the
 *     array.
 * @return {!Array} the removed elements.
 */
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);

  return goog.array.ARRAY_PROTOTYPE_.splice.apply(
      arr, goog.array.slice(arguments, 1));
};


/**
 * Returns a new array from a segment of an array. This is a generic version of
 * Array slice. This means that it might work on other objects similar to
 * arrays, such as the arguments object.
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr The array from
 * which to copy a segment.
 * @param {number} start The index of the first element to copy.
 * @param {number=} opt_end The index after the last element to copy.
 * @return {!Array.<T>} A new array containing the specified segment of the
 *     original array.
 * @template T
 */
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);

  // passing 1 arg to slice is not the same as passing 2 where the second is
  // null or undefined (in that case the second argument is treated as 0).
  // we could use slice on the arguments object and then use apply instead of
  // testing the length
  if (arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start);
  } else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end);
  }
};


/**
 * Removes all duplicates from an array (retaining only the first
 * occurrence of each array element).  This function modifies the
 * array in place and doesn't change the order of the non-duplicate items.
 *
 * For objects, duplicates are identified as having the same unique ID as
 * defined by {@link goog.getUid}.
 *
 * Runtime: N,
 * Worstcase space: 2N (no dupes)
 *
 * @param {goog.array.ArrayLike} arr The array from which to remove duplicates.
 * @param {Array=} opt_rv An optional array in which to return the results,
 *     instead of performing the removal inplace.  If specified, the original
 *     array will remain unchanged.
 */
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;

  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while (cursorRead < arr.length) {
    var current = arr[cursorRead++];

    // Prefix each type with a single character representing the type to
    // prevent conflicting keys (e.g. true and 'true').
    var key = goog.isObject(current) ?
        'o' + goog.getUid(current) :
        (typeof current).charAt(0) + current;

    if (!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current;
    }
  }
  returnArray.length = cursorInsert;
};


/**
 * Searches the specified array for the specified target using the binary
 * search algorithm.  If no opt_compareFn is specified, elements are compared
 * using <code>goog.array.defaultCompare</code>, which compares the elements
 * using the built in < and > operators.  This will produce the expected
 * behavior for homogeneous arrays of String(s) and Number(s). The array
 * specified <b>must</b> be sorted in ascending order (as defined by the
 * comparison function).  If the array is not sorted, results are undefined.
 * If the array contains multiple instances of the specified target value, any
 * of these instances may be found.
 *
 * Runtime: O(log n)
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {*} target The sought value.
 * @param {Function=} opt_compareFn Optional comparison function by which the
 *     array is ordered. Should take 2 arguments to compare, and return a
 *     negative number, zero, or a positive number depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 * @return {number} Lowest index of the target value if found, otherwise
 *     (-(insertion point) - 1). The insertion point is where the value should
 *     be inserted into arr to preserve the sorted property.  Return value >= 0
 *     iff target is found.
 */
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr,
      opt_compareFn || goog.array.defaultCompare, false /* isEvaluator */,
      target);
};


/**
 * Selects an index in the specified array using the binary search algorithm.
 * The evaluator receives an element and determines whether the desired index
 * is before, at, or after it.  The evaluator must be consistent (formally,
 * goog.array.map(goog.array.map(arr, evaluator, opt_obj), goog.math.sign)
 * must be monotonically non-increasing).
 *
 * Runtime: O(log n)
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {Function} evaluator Evaluator function that receives 3 arguments
 *     (the element, the index and the array). Should return a negative number,
 *     zero, or a positive number depending on whether the desired index is
 *     before, at, or after the element passed to it.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within evaluator.
 * @return {number} Index of the leftmost element matched by the evaluator, if
 *     such exists; otherwise (-(insertion point) - 1). The insertion point is
 *     the index of the first element for which the evaluator returns negative,
 *     or arr.length if no such element exists. The return value is non-negative
 *     iff a match is found.
 */
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true /* isEvaluator */,
      undefined /* opt_target */, opt_obj);
};


/**
 * Implementation of a binary search algorithm which knows how to use both
 * comparison functions and evaluators. If an evaluator is provided, will call
 * the evaluator with the given optional data object, conforming to the
 * interface defined in binarySelect. Otherwise, if a comparison function is
 * provided, will call the comparison function against the given data object.
 *
 * This implementation purposefully does not use goog.bind or goog.partial for
 * performance reasons.
 *
 * Runtime: O(log n)
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {Function} compareFn Either an evaluator or a comparison function,
 *     as defined by binarySearch and binarySelect above.
 * @param {boolean} isEvaluator Whether the function is an evaluator or a
 *     comparison function.
 * @param {*=} opt_target If the function is a comparison function, then this is
 *     the target to binary search for.
 * @param {Object=} opt_selfObj If the function is an evaluator, this is an
  *    optional this object for the evaluator.
 * @return {number} Lowest index of the target value if found, otherwise
 *     (-(insertion point) - 1). The insertion point is where the value should
 *     be inserted into arr to preserve the sorted property.  Return value >= 0
 *     iff target is found.
 * @private
 */
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target,
    opt_selfObj) {
  var left = 0;  // inclusive
  var right = arr.length;  // exclusive
  var found;
  while (left < right) {
    var middle = (left + right) >> 1;
    var compareResult;
    if (isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr);
    } else {
      compareResult = compareFn(opt_target, arr[middle]);
    }
    if (compareResult > 0) {
      left = middle + 1;
    } else {
      right = middle;
      // We are looking for the lowest index so we can't return immediately.
      found = !compareResult;
    }
  }
  // left is the index if found, or the insertion point otherwise.
  // ~left is a shorthand for -left - 1.
  return found ? left : ~left;
};


/**
 * Sorts the specified array into ascending order.  If no opt_compareFn is
 * specified, elements are compared using
 * <code>goog.array.defaultCompare</code>, which compares the elements using
 * the built in < and > operators.  This will produce the expected behavior
 * for homogeneous arrays of String(s) and Number(s), unlike the native sort,
 * but will give unpredictable results for heterogenous lists of strings and
 * numbers with different numbers of digits.
 *
 * This sort is not guaranteed to be stable.
 *
 * Runtime: Same as <code>Array.prototype.sort</code>
 *
 * @param {Array.<T>} arr The array to be sorted.
 * @param {?function(T,T):number=} opt_compareFn Optional comparison
 *     function by which the
 *     array is to be ordered. Should take 2 arguments to compare, and return a
 *     negative number, zero, or a positive number depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 * @template T
 */
goog.array.sort = function(arr, opt_compareFn) {
  // TODO(arv): Update type annotation since null is not accepted.
  goog.asserts.assert(arr.length != null);

  goog.array.ARRAY_PROTOTYPE_.sort.call(
      arr, opt_compareFn || goog.array.defaultCompare);
};


/**
 * Sorts the specified array into ascending order in a stable way.  If no
 * opt_compareFn is specified, elements are compared using
 * <code>goog.array.defaultCompare</code>, which compares the elements using
 * the built in < and > operators.  This will produce the expected behavior
 * for homogeneous arrays of String(s) and Number(s).
 *
 * Runtime: Same as <code>Array.prototype.sort</code>, plus an additional
 * O(n) overhead of copying the array twice.
 *
 * @param {Array.<T>} arr The array to be sorted.
 * @param {?function(T, T): number=} opt_compareFn Optional comparison function
 *     by which the array is to be ordered. Should take 2 arguments to compare,
 *     and return a negative number, zero, or a positive number depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 * @template T
 */
goog.array.stableSort = function(arr, opt_compareFn) {
  for (var i = 0; i < arr.length; i++) {
    arr[i] = {index: i, value: arr[i]};
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index;
  };
  goog.array.sort(arr, stableCompareFn);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = arr[i].value;
  }
};


/**
 * Sorts an array of objects by the specified object key and compare
 * function. If no compare function is provided, the key values are
 * compared in ascending order using <code>goog.array.defaultCompare</code>.
 * This won't work for keys that get renamed by the compiler. So use
 * {'foo': 1, 'bar': 2} rather than {foo: 1, bar: 2}.
 * @param {Array.<Object>} arr An array of objects to sort.
 * @param {string} key The object key to sort by.
 * @param {Function=} opt_compareFn The function to use to compare key
 *     values.
 */
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key]);
  });
};


/**
 * Tells if the array is sorted.
 * @param {!Array.<T>} arr The array.
 * @param {?function(T,T):number=} opt_compareFn Function to compare the
 *     array elements.
 *     Should take 2 arguments to compare, and return a negative number, zero,
 *     or a positive number depending on whether the first argument is less
 *     than, equal to, or greater than the second.
 * @param {boolean=} opt_strict If true no equal elements are allowed.
 * @return {boolean} Whether the array is sorted.
 * @template T
 */
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for (var i = 1; i < arr.length; i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if (compareResult > 0 || compareResult == 0 && opt_strict) {
      return false;
    }
  }
  return true;
};


/**
 * Compares two arrays for equality. Two arrays are considered equal if they
 * have the same length and their corresponding elements are equal according to
 * the comparison function.
 *
 * @param {goog.array.ArrayLike} arr1 The first array to compare.
 * @param {goog.array.ArrayLike} arr2 The second array to compare.
 * @param {Function=} opt_equalsFn Optional comparison function.
 *     Should take 2 arguments to compare, and return true if the arguments
 *     are equal. Defaults to {@link goog.array.defaultCompareEquality} which
 *     compares the elements using the built-in '===' operator.
 * @return {boolean} Whether the two arrays are equal.
 */
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if (!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) ||
      arr1.length != arr2.length) {
    return false;
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for (var i = 0; i < l; i++) {
    if (!equalsFn(arr1[i], arr2[i])) {
      return false;
    }
  }
  return true;
};


/**
 * @deprecated Use {@link goog.array.equals}.
 * @param {goog.array.ArrayLike} arr1 See {@link goog.array.equals}.
 * @param {goog.array.ArrayLike} arr2 See {@link goog.array.equals}.
 * @param {Function=} opt_equalsFn See {@link goog.array.equals}.
 * @return {boolean} See {@link goog.array.equals}.
 */
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn);
};


/**
 * 3-way array compare function.
 * @param {!goog.array.ArrayLike} arr1 The first array to compare.
 * @param {!goog.array.ArrayLike} arr2 The second array to compare.
 * @param {?function(?, ?): number=} opt_compareFn Optional comparison function
 *     by which the array is to be ordered. Should take 2 arguments to compare,
 *     and return a negative number, zero, or a positive number depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 * @return {number} Negative number, zero, or a positive number depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 */
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for (var i = 0; i < l; i++) {
    var result = compare(arr1[i], arr2[i]);
    if (result != 0) {
      return result;
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length);
};


/**
 * Compares its two arguments for order, using the built in < and >
 * operators.
 * @param {*} a The first object to be compared.
 * @param {*} b The second object to be compared.
 * @return {number} A negative number, zero, or a positive number as the first
 *     argument is less than, equal to, or greater than the second.
 */
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
};


/**
 * Compares its two arguments for equality, using the built in === operator.
 * @param {*} a The first object to compare.
 * @param {*} b The second object to compare.
 * @return {boolean} True if the two arguments are equal, false otherwise.
 */
goog.array.defaultCompareEquality = function(a, b) {
  return a === b;
};


/**
 * Inserts a value into a sorted array. The array is not modified if the
 * value is already present.
 * @param {Array.<T>} array The array to modify.
 * @param {T} value The object to insert.
 * @param {?function(T,T):number=} opt_compareFn Optional comparison function by
 *     which the
 *     array is ordered. Should take 2 arguments to compare, and return a
 *     negative number, zero, or a positive number depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 * @return {boolean} True if an element was inserted.
 * @template T
 */
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if (index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true;
  }
  return false;
};


/**
 * Removes a value from a sorted array.
 * @param {Array} array The array to modify.
 * @param {*} value The object to remove.
 * @param {Function=} opt_compareFn Optional comparison function by which the
 *     array is ordered. Should take 2 arguments to compare, and return a
 *     negative number, zero, or a positive number depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 * @return {boolean} True if an element was removed.
 */
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return (index >= 0) ? goog.array.removeAt(array, index) : false;
};


/**
 * Splits an array into disjoint buckets according to a splitting function.
 * @param {Array.<T>} array The array.
 * @param {function(T,number,Array.<T>):?} sorter Function to call for every
 *     element.  This
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a valid object key (a string, number, etc), or undefined, if
 *     that object should not be placed in a bucket.
 * @return {!Object} An object, with keys being all of the unique return values
 *     of sorter, and values being arrays containing the items for
 *     which the splitter returned that key.
 * @template T
 */
goog.array.bucket = function(array, sorter) {
  var buckets = {};

  for (var i = 0; i < array.length; i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if (goog.isDef(key)) {
      // Push the value to the right bucket, creating it if necessary.
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value);
    }
  }

  return buckets;
};


/**
 * Creates a new object built from the provided array and the key-generation
 * function.
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array like object over
 *     which to iterate whose elements will be the values in the new object.
 * @param {?function(this:S, T, number, ?) : string} keyFunc The function to
 *     call for every element. This function takes 3 arguments (the element, the
 *     index and the array) and should return a string that will be used as the
 *     key for the element in the new object. If the function returns the same
 *     key for more than one element, the value for that key is
 *     implementation-defined.
 * @param {S=} opt_obj  The object to be used as the value of 'this'
 *     within keyFunc.
 * @return {!Object.<T>} The new object.
 * @template T,S
 */
goog.array.toObject = function(arr, keyFunc, opt_obj) {
  var ret = {};
  goog.array.forEach(arr, function(element, index) {
    ret[keyFunc.call(opt_obj, element, index, arr)] = element;
  });
  return ret;
};


/**
 * Returns an array consisting of the given value repeated N times.
 *
 * @param {*} value The value to repeat.
 * @param {number} n The repeat count.
 * @return {!Array} An array with the repeated value.
 */
goog.array.repeat = function(value, n) {
  var array = [];
  for (var i = 0; i < n; i++) {
    array[i] = value;
  }
  return array;
};


/**
 * Returns an array consisting of every argument with all arrays
 * expanded in-place recursively.
 *
 * @param {...*} var_args The values to flatten.
 * @return {!Array} An array containing the flattened values.
 */
goog.array.flatten = function(var_args) {
  var result = [];
  for (var i = 0; i < arguments.length; i++) {
    var element = arguments[i];
    if (goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element));
    } else {
      result.push(element);
    }
  }
  return result;
};


/**
 * Rotates an array in-place. After calling this method, the element at
 * index i will be the element previously at index (i - n) %
 * array.length, for all values of i between 0 and array.length - 1,
 * inclusive.
 *
 * For example, suppose list comprises [t, a, n, k, s]. After invoking
 * rotate(array, 1) (or rotate(array, -4)), array will comprise [s, t, a, n, k].
 *
 * @param {!Array.<T>} array The array to rotate.
 * @param {number} n The amount to rotate.
 * @return {!Array.<T>} The array.
 * @template T
 */
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);

  if (array.length) {
    n %= array.length;
    if (n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n));
    } else if (n < 0) {
      goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n));
    }
  }
  return array;
};


/**
 * Creates a new array for which the element at position i is an array of the
 * ith element of the provided arrays.  The returned array will only be as long
 * as the shortest array provided; additional values are ignored.  For example,
 * the result of zipping [1, 2] and [3, 4, 5] is [[1,3], [2, 4]].
 *
 * This is similar to the zip() function in Python.  See {@link
 * http://docs.python.org/library/functions.html#zip}
 *
 * @param {...!goog.array.ArrayLike} var_args Arrays to be combined.
 * @return {!Array.<!Array>} A new array of arrays created from provided arrays.
 */
goog.array.zip = function(var_args) {
  if (!arguments.length) {
    return [];
  }
  var result = [];
  for (var i = 0; true; i++) {
    var value = [];
    for (var j = 0; j < arguments.length; j++) {
      var arr = arguments[j];
      // If i is larger than the array length, this is the shortest array.
      if (i >= arr.length) {
        return result;
      }
      value.push(arr[i]);
    }
    result.push(value);
  }
};


/**
 * Shuffles the values in the specified array using the Fisher-Yates in-place
 * shuffle (also known as the Knuth Shuffle). By default, calls Math.random()
 * and so resets the state of that random number generator. Similarly, may reset
 * the state of the any other specified random number generator.
 *
 * Runtime: O(n)
 *
 * @param {!Array} arr The array to be shuffled.
 * @param {function():number=} opt_randFn Optional random function to use for
 *     shuffling.
 *     Takes no arguments, and returns a random number on the interval [0, 1).
 *     Defaults to Math.random() using JavaScript's built-in Math library.
 */
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;

  for (var i = arr.length - 1; i > 0; i--) {
    // Choose a random array index in [0, i] (inclusive with i).
    var j = Math.floor(randFn() * (i + 1));

    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
};

// Input 5
// Copyright 2010 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Typedefs for working with dates.
 *
 * @author nicksantos@google.com (Nick Santos)
 */

goog.provide('goog.date.DateLike');


/**
 * @typedef {(Date|goog.date.Date)}
 */
goog.date.DateLike;

// Input 6
// Copyright 2011 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Date/time formatting symbols for all locales.
 *
 * This file is autogenerated by script.  See
 * http://go/generate_datetime_constants.py using the --for_closure flag.
 *
 * To reduce the file size (which may cause issues in some JS
 * developing environments), this file will only contain locales
 * that are usually supported by google products. It is a super
 * set of 40 languages. Rest of the data can be found in another file
 * named "datetimesymbolsext.js", which will be generated at the same
 * time as this file.
 * Before checkin, this file could have been manually edited. This is
 * to incorporate changes before we could correct CLDR. All manual
 * modification must be documented in this section, and should be
 * removed after those changes land to CLDR.
 */

goog.provide('goog.i18n.DateTimeSymbols');
goog.provide('goog.i18n.DateTimeSymbols_af');
goog.provide('goog.i18n.DateTimeSymbols_am');
goog.provide('goog.i18n.DateTimeSymbols_ar');
goog.provide('goog.i18n.DateTimeSymbols_bg');
goog.provide('goog.i18n.DateTimeSymbols_bn');
goog.provide('goog.i18n.DateTimeSymbols_ca');
goog.provide('goog.i18n.DateTimeSymbols_chr');
goog.provide('goog.i18n.DateTimeSymbols_cs');
goog.provide('goog.i18n.DateTimeSymbols_cy');
goog.provide('goog.i18n.DateTimeSymbols_da');
goog.provide('goog.i18n.DateTimeSymbols_de');
goog.provide('goog.i18n.DateTimeSymbols_de_AT');
goog.provide('goog.i18n.DateTimeSymbols_de_CH');
goog.provide('goog.i18n.DateTimeSymbols_el');
goog.provide('goog.i18n.DateTimeSymbols_en');
goog.provide('goog.i18n.DateTimeSymbols_en_AU');
goog.provide('goog.i18n.DateTimeSymbols_en_GB');
goog.provide('goog.i18n.DateTimeSymbols_en_IE');
goog.provide('goog.i18n.DateTimeSymbols_en_IN');
goog.provide('goog.i18n.DateTimeSymbols_en_ISO');
goog.provide('goog.i18n.DateTimeSymbols_en_SG');
goog.provide('goog.i18n.DateTimeSymbols_en_US');
goog.provide('goog.i18n.DateTimeSymbols_en_ZA');
goog.provide('goog.i18n.DateTimeSymbols_es');
goog.provide('goog.i18n.DateTimeSymbols_es_419');
goog.provide('goog.i18n.DateTimeSymbols_et');
goog.provide('goog.i18n.DateTimeSymbols_eu');
goog.provide('goog.i18n.DateTimeSymbols_fa');
goog.provide('goog.i18n.DateTimeSymbols_fi');
goog.provide('goog.i18n.DateTimeSymbols_fil');
goog.provide('goog.i18n.DateTimeSymbols_fr');
goog.provide('goog.i18n.DateTimeSymbols_fr_CA');
goog.provide('goog.i18n.DateTimeSymbols_gl');
goog.provide('goog.i18n.DateTimeSymbols_gsw');
goog.provide('goog.i18n.DateTimeSymbols_gu');
goog.provide('goog.i18n.DateTimeSymbols_haw');
goog.provide('goog.i18n.DateTimeSymbols_he');
goog.provide('goog.i18n.DateTimeSymbols_hi');
goog.provide('goog.i18n.DateTimeSymbols_hr');
goog.provide('goog.i18n.DateTimeSymbols_hu');
goog.provide('goog.i18n.DateTimeSymbols_id');
goog.provide('goog.i18n.DateTimeSymbols_in');
goog.provide('goog.i18n.DateTimeSymbols_is');
goog.provide('goog.i18n.DateTimeSymbols_it');
goog.provide('goog.i18n.DateTimeSymbols_iw');
goog.provide('goog.i18n.DateTimeSymbols_ja');
goog.provide('goog.i18n.DateTimeSymbols_kn');
goog.provide('goog.i18n.DateTimeSymbols_ko');
goog.provide('goog.i18n.DateTimeSymbols_ln');
goog.provide('goog.i18n.DateTimeSymbols_lt');
goog.provide('goog.i18n.DateTimeSymbols_lv');
goog.provide('goog.i18n.DateTimeSymbols_ml');
goog.provide('goog.i18n.DateTimeSymbols_mr');
goog.provide('goog.i18n.DateTimeSymbols_ms');
goog.provide('goog.i18n.DateTimeSymbols_mt');
goog.provide('goog.i18n.DateTimeSymbols_nl');
goog.provide('goog.i18n.DateTimeSymbols_no');
goog.provide('goog.i18n.DateTimeSymbols_or');
goog.provide('goog.i18n.DateTimeSymbols_pl');
goog.provide('goog.i18n.DateTimeSymbols_pt');
goog.provide('goog.i18n.DateTimeSymbols_pt_BR');
goog.provide('goog.i18n.DateTimeSymbols_pt_PT');
goog.provide('goog.i18n.DateTimeSymbols_ro');
goog.provide('goog.i18n.DateTimeSymbols_ru');
goog.provide('goog.i18n.DateTimeSymbols_sk');
goog.provide('goog.i18n.DateTimeSymbols_sl');
goog.provide('goog.i18n.DateTimeSymbols_sq');
goog.provide('goog.i18n.DateTimeSymbols_sr');
goog.provide('goog.i18n.DateTimeSymbols_sv');
goog.provide('goog.i18n.DateTimeSymbols_sw');
goog.provide('goog.i18n.DateTimeSymbols_ta');
goog.provide('goog.i18n.DateTimeSymbols_te');
goog.provide('goog.i18n.DateTimeSymbols_th');
goog.provide('goog.i18n.DateTimeSymbols_tl');
goog.provide('goog.i18n.DateTimeSymbols_tr');
goog.provide('goog.i18n.DateTimeSymbols_uk');
goog.provide('goog.i18n.DateTimeSymbols_ur');
goog.provide('goog.i18n.DateTimeSymbols_vi');
goog.provide('goog.i18n.DateTimeSymbols_zh');
goog.provide('goog.i18n.DateTimeSymbols_zh_CN');
goog.provide('goog.i18n.DateTimeSymbols_zh_HK');
goog.provide('goog.i18n.DateTimeSymbols_zh_TW');
goog.provide('goog.i18n.DateTimeSymbols_zu');


/**
 * Date/time formatting symbols for locale en_ISO.
 */
goog.i18n.DateTimeSymbols_en_ISO = {
  ERAS: ['BC', 'AD'],
  ERANAMES: ['Before Christ', 'Anno Domini'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'],
  STANDALONEMONTHS: ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'],
  SHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
      'Oct', 'Nov', 'Dec'],
  STANDALONESHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
      'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  WEEKDAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
      'Saturday'],
  STANDALONEWEEKDAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
      'Friday', 'Saturday'],
  SHORTWEEKDAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  STANDALONESHORTWEEKDAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  NARROWWEEKDAYS: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  STANDALONENARROWWEEKDAYS: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['1st quarter', '2nd quarter', '3rd quarter', '4th quarter'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE, y MMMM dd', 'y MMMM d', 'y MMM d', 'yyyy-MM-dd'],
  TIMEFORMATS: ['HH:mm:ss v', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  AVAILABLEFORMATS: {'Md': 'M/d', 'MMMMd': 'MMMM d', 'MMMd': 'MMM d'},
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale af.
 */
goog.i18n.DateTimeSymbols_af = {
  ERAS: ['v.C.', 'n.C.'],
  ERANAMES: ['voor Christus', 'na Christus'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['Januarie', 'Februarie', 'Maart', 'April', 'Mei', 'Junie', 'Julie',
      'Augustus', 'September', 'Oktober', 'November', 'Desember'],
  STANDALONEMONTHS: ['Januarie', 'Februarie', 'Maart', 'April', 'Mei', 'Junie',
      'Julie', 'Augustus', 'September', 'Oktober', 'November', 'Desember'],
  SHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep',
      'Okt', 'Nov', 'Des'],
  STANDALONESHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul',
      'Aug', 'Sep', 'Okt', 'Nov', 'Des'],
  WEEKDAYS: ['Sondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrydag',
      'Saterdag'],
  STANDALONEWEEKDAYS: ['Sondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag',
      'Vrydag', 'Saterdag'],
  SHORTWEEKDAYS: ['So', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Sa'],
  STANDALONESHORTWEEKDAYS: ['So', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Sa'],
  NARROWWEEKDAYS: ['S', 'M', 'D', 'W', 'D', 'V', 'S'],
  STANDALONENARROWWEEKDAYS: ['S', 'M', 'D', 'W', 'D', 'V', 'S'],
  SHORTQUARTERS: ['K1', 'K2', 'K3', 'K4'],
  QUARTERS: ['1ste kwartaal', '2de kwartaal', '3de kwartaal', '4de kwartaal'],
  AMPMS: ['vm.', 'nm.'],
  DATEFORMATS: ['EEEE dd MMMM y', 'dd MMMM y', 'dd MMM y', 'yyyy-MM-dd'],
  TIMEFORMATS: ['h:mm:ss a zzzz', 'h:mm:ss a z', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale am.
 */
goog.i18n.DateTimeSymbols_am = {
  ERAS: ['ዓ/ዓ', 'ዓ/ም'],
  ERANAMES: ['ዓመተ ዓለም', 'ዓመተ ምሕረት'],
  NARROWMONTHS: ['ጃ', 'ፌ', 'ማ', 'ኤ', 'ሜ', 'ጁ', 'ጁ', 'ኦ', 'ሴ',
      'ኦ', 'ኖ', 'ዲ'],
  STANDALONENARROWMONTHS: ['ጃ', 'ፌ', 'ማ', 'ኤ', 'ሜ', 'ጁ', 'ጁ',
      'ኦ', 'ሴ', 'ኦ', 'ኖ', 'ዲ'],
  MONTHS: ['ጃንዩወሪ', 'ፌብሩወሪ', 'ማርች', 'ኤፕረል',
      'ሜይ', 'ጁን', 'ጁላይ', 'ኦገስት', 'ሴፕቴምበር',
      'ኦክተውበር', 'ኖቬምበር', 'ዲሴምበር'],
  STANDALONEMONTHS: ['ጃንዩወሪ', 'ፌብሩወሪ', 'ማርች',
      'ኤፕረል', 'ሜይ', 'ጁን', 'ጁላይ', 'ኦገስት',
      'ሴፕቴምበር', 'ኦክተውበር', 'ኖቬምበር',
      'ዲሴምበር'],
  SHORTMONTHS: ['ጃንዩ', 'ፌብሩ', 'ማርች', 'ኤፕረ', 'ሜይ',
      'ጁን', 'ጁላይ', 'ኦገስ', 'ሴፕቴ', 'ኦክተ', 'ኖቬም',
      'ዲሴም'],
  STANDALONESHORTMONTHS: ['ጃንዩ', 'ፌብሩ', 'ማርች', 'ኤፕረ',
      'ሜይ', 'ጁን', 'ጁላይ', 'ኦገስ', 'ሴፕቴ', 'ኦክተ',
      'ኖቬም', 'ዲሴም'],
  WEEKDAYS: ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ',
      'ዓርብ', 'ቅዳሜ'],
  STANDALONEWEEKDAYS: ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ',
      'ሐሙስ', 'ዓርብ', 'ቅዳሜ'],
  SHORTWEEKDAYS: ['እሑድ', 'ሰኞ', 'ማክሰ', 'ረቡዕ', 'ሐሙስ',
      'ዓርብ', 'ቅዳሜ'],
  STANDALONESHORTWEEKDAYS: ['እሑድ', 'ሰኞ', 'ማክሰ', 'ረቡዕ',
      'ሐሙስ', 'ዓርብ', 'ቅዳሜ'],
  NARROWWEEKDAYS: ['እ', 'ሰ', 'ማ', 'ረ', 'ሐ', 'ዓ', 'ቅ'],
  STANDALONENARROWWEEKDAYS: ['እ', 'ሰ', 'ማ', 'ረ', 'ሐ', 'ዓ', 'ቅ'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['1ኛው ሩብ', 'ሁለተኛው ሩብ', '3ኛው ሩብ',
      '4ኛው ሩብ'],
  AMPMS: ['ጡዋት', 'ከሳዓት'],
  DATEFORMATS: ['EEEE, d MMMM y', 'd MMMM y', 'd MMM y', 'dd/MM/yyyy'],
  TIMEFORMATS: ['h:mm:ss a zzzz', 'h:mm:ss a z', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale ar.
 */
goog.i18n.DateTimeSymbols_ar = {
  ZERODIGIT: 0x0660,
  ERAS: ['ق.م', 'م'],
  ERANAMES: ['قبل الميلاد', 'ميلادي'],
  NARROWMONTHS: ['ي', 'ف', 'م', 'أ', 'و', 'ن', 'ل', 'غ', 'س', 'ك',
      'ب', 'د'],
  STANDALONENARROWMONTHS: ['ي', 'ف', 'م', 'أ', 'و', 'ن', 'ل', 'غ', 'س',
      'ك', 'ب', 'د'],
  MONTHS: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو',
      'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر',
      'نوفمبر', 'ديسمبر'],
  STANDALONEMONTHS: ['يناير', 'فبراير', 'مارس', 'أبريل',
      'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر',
      'أكتوبر', 'نوفمبر', 'ديسمبر'],
  SHORTMONTHS: ['يناير', 'فبراير', 'مارس', 'أبريل',
      'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر',
      'أكتوبر', 'نوفمبر', 'ديسمبر'],
  STANDALONESHORTMONTHS: ['يناير', 'فبراير', 'مارس',
      'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس',
      'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  WEEKDAYS: ['الأحد', 'الاثنين', 'الثلاثاء',
      'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  STANDALONEWEEKDAYS: ['الأحد', 'الاثنين', 'الثلاثاء',
      'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  SHORTWEEKDAYS: ['الأحد', 'الاثنين', 'الثلاثاء',
      'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  STANDALONESHORTWEEKDAYS: ['الأحد', 'الاثنين', 'الثلاثاء',
      'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  NARROWWEEKDAYS: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'],
  STANDALONENARROWWEEKDAYS: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'],
  SHORTQUARTERS: ['الربع الأول', 'الربع الثاني',
      'الربع الثالث', 'الربع الرابع'],
  QUARTERS: ['الربع الأول', 'الربع الثاني',
      'الربع الثالث', 'الربع الرابع'],
  AMPMS: ['ص', 'م'],
  DATEFORMATS: ['EEEE، d MMMM، y', 'd MMMM، y', 'dd‏/MM‏/yyyy',
      'd‏/M‏/yyyy'],
  TIMEFORMATS: ['zzzz h:mm:ss a', 'z h:mm:ss a', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 5,
  WEEKENDRANGE: [4, 5],
  FIRSTWEEKCUTOFFDAY: 4
};


/**
 * Date/time formatting symbols for locale bg.
 */
goog.i18n.DateTimeSymbols_bg = {
  ERAS: ['пр. н. е.', 'от н. е.'],
  ERANAMES: ['пр.Хр.', 'сл.Хр.'],
  NARROWMONTHS: ['я', 'ф', 'м', 'а', 'м', 'ю', 'ю', 'а', 'с', 'о',
      'н', 'д'],
  STANDALONENARROWMONTHS: ['я', 'ф', 'м', 'а', 'м', 'ю', 'ю', 'а', 'с',
      'о', 'н', 'д'],
  MONTHS: ['януари', 'февруари', 'март', 'април',
      'май', 'юни', 'юли', 'август', 'септември',
      'октомври', 'ноември', 'декември'],
  STANDALONEMONTHS: ['януари', 'февруари', 'март',
      'април', 'май', 'юни', 'юли', 'август',
      'септември', 'октомври', 'ноември',
      'декември'],
  SHORTMONTHS: ['ян.', 'февр.', 'март', 'апр.', 'май', 'юни',
      'юли', 'авг.', 'септ.', 'окт.', 'ноем.', 'дек.'],
  STANDALONESHORTMONTHS: ['ян.', 'февр.', 'март', 'апр.', 'май',
      'юни', 'юли', 'авг.', 'септ.', 'окт.', 'ноем.',
      'дек.'],
  WEEKDAYS: ['неделя', 'понеделник', 'вторник',
      'сряда', 'четвъртък', 'петък', 'събота'],
  STANDALONEWEEKDAYS: ['неделя', 'понеделник', 'вторник',
      'сряда', 'четвъртък', 'петък', 'събота'],
  SHORTWEEKDAYS: ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'],
  STANDALONESHORTWEEKDAYS: ['нд', 'пн', 'вт', 'ср', 'чт', 'пт',
      'сб'],
  NARROWWEEKDAYS: ['н', 'п', 'в', 'с', 'ч', 'п', 'с'],
  STANDALONENARROWWEEKDAYS: ['н', 'п', 'в', 'с', 'ч', 'п', 'с'],
  SHORTQUARTERS: ['I трим.', 'II трим.', 'III трим.',
      'IV трим.'],
  QUARTERS: ['1-во тримесечие', '2-ро тримесечие',
      '3-то тримесечие', '4-то тримесечие'],
  AMPMS: ['пр. об.', 'сл. об.'],
  DATEFORMATS: ['dd MMMM y, EEEE', 'dd MMMM y', 'dd.MM.yyyy', 'dd.MM.yy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale bn.
 */
goog.i18n.DateTimeSymbols_bn = {
  ZERODIGIT: 0x09E6,
  ERAS: ['খৃষ্টপূর্ব', 'খৃষ্টাব্দ'],
  ERANAMES: ['খৃষ্টপূর্ব', 'খৃষ্টাব্দ'],
  NARROWMONTHS: ['জা', 'ফে', 'মা', 'এ', 'মে', 'জুন',
      'জু', 'আ', 'সে', 'অ', 'ন', 'ডি'],
  STANDALONENARROWMONTHS: ['জা', 'ফে', 'মা', 'এ', 'মে',
      'জুন', 'জু', 'আ', 'সে', 'অ', 'ন', 'ডি'],
  MONTHS: ['জানুয়ারী', 'ফেব্রুয়ারী',
      'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর',
      'অক্টোবর', 'নভেম্বর',
      'ডিসেম্বর'],
  STANDALONEMONTHS: ['জানুয়ারী',
      'ফেব্রুয়ারী', 'মার্চ',
      'এপ্রিল', 'মে', 'জুন', 'জুলাই',
      'আগস্ট', 'সেপ্টেম্বর',
      'অক্টোবর', 'নভেম্বর',
      'ডিসেম্বর'],
  SHORTMONTHS: ['জানুয়ারী',
      'ফেব্রুয়ারী', 'মার্চ',
      'এপ্রিল', 'মে', 'জুন', 'জুলাই',
      'আগস্ট', 'সেপ্টেম্বর',
      'অক্টোবর', 'নভেম্বর',
      'ডিসেম্বর'],
  STANDALONESHORTMONTHS: ['জানুয়ারী',
      'ফেব্রুয়ারী', 'মার্চ',
      'এপ্রিল', 'মে', 'জুন', 'জুলাই',
      'আগস্ট', 'সেপ্টেম্বর',
      'অক্টোবর', 'নভেম্বর',
      'ডিসেম্বর'],
  WEEKDAYS: ['রবিবার', 'সোমবার',
      'মঙ্গলবার', 'বুধবার',
      'বৃহষ্পতিবার', 'শুক্রবার',
      'শনিবার'],
  STANDALONEWEEKDAYS: ['রবিবার', 'সোমবার',
      'মঙ্গলবার', 'বুধবার',
      'বৃহষ্পতিবার', 'শুক্রবার',
      'শনিবার'],
  SHORTWEEKDAYS: ['রবি', 'সোম', 'মঙ্গল', 'বুধ',
      'বৃহস্পতি', 'শুক্র', 'শনি'],
  STANDALONESHORTWEEKDAYS: ['রবি', 'সোম', 'মঙ্গল',
      'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'],
  NARROWWEEKDAYS: ['র', 'সো', 'ম', 'বু', 'বৃ', 'শু', 'শ'],
  STANDALONENARROWWEEKDAYS: ['র', 'সো', 'ম', 'বু', 'বৃ',
      'শু', 'শ'],
  SHORTQUARTERS: ['চতুর্থাংশ ১',
      'চতুর্থাংশ ২', 'চতুর্থাংশ ৩',
      'চতুর্থাংশ ৪'],
  QUARTERS: ['প্রথম চতুর্থাংশ',
      'দ্বিতীয় চতুর্থাংশ',
      'তৃতীয় চতুর্থাংশ',
      'চতুর্থ চতুর্থাংশ'],
  AMPMS: ['am', 'pm'],
  DATEFORMATS: ['EEEE, d MMMM, y', 'd MMMM, y', 'd MMM, y', 'd/M/yy'],
  TIMEFORMATS: ['h:mm:ss a zzzz', 'h:mm:ss a z', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 4,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale ca.
 */
goog.i18n.DateTimeSymbols_ca = {
  ERAS: ['aC', 'dC'],
  ERANAMES: ['abans de Crist', 'després de Crist'],
  NARROWMONTHS: ['G', 'F', 'M', 'A', 'M', 'J', 'G', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['g', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o',
      'n', 'd'],
  MONTHS: ['de gener', 'de febrer', 'de març', 'd’abril', 'de maig',
      'de juny', 'de juliol', 'd’agost', 'de setembre', 'd’octubre',
      'de novembre', 'de desembre'],
  STANDALONEMONTHS: ['gener', 'febrer', 'març', 'abril', 'maig', 'juny',
      'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'],
  SHORTMONTHS: ['de gen.', 'de febr.', 'de març', 'd’abr.', 'de maig',
      'de juny', 'de jul.', 'd’ag.', 'de set.', 'd’oct.', 'de nov.',
      'de des.'],
  STANDALONESHORTMONTHS: ['gen.', 'febr.', 'març', 'abr.', 'maig', 'juny',
      'jul.', 'ag.', 'set.', 'oct.', 'nov.', 'des.'],
  WEEKDAYS: ['diumenge', 'dilluns', 'dimarts', 'dimecres', 'dijous',
      'divendres', 'dissabte'],
  STANDALONEWEEKDAYS: ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous',
      'Divendres', 'Dissabte'],
  SHORTWEEKDAYS: ['dg.', 'dl.', 'dt.', 'dc.', 'dj.', 'dv.', 'ds.'],
  STANDALONESHORTWEEKDAYS: ['dg', 'dl', 'dt', 'dc', 'dj', 'dv', 'ds'],
  NARROWWEEKDAYS: ['G', 'l', 'T', 'C', 'J', 'V', 'S'],
  STANDALONENARROWWEEKDAYS: ['g', 'l', 't', 'c', 'j', 'v', 's'],
  SHORTQUARTERS: ['1T', '2T', '3T', '4T'],
  QUARTERS: ['1r trimestre', '2n trimestre', '3r trimestre', '4t trimestre'],
  AMPMS: ['a.m.', 'p.m.'],
  DATEFORMATS: ['EEEE d MMMM \'de\' y', 'd MMMM \'de\' y', 'dd/MM/yyyy',
      'dd/MM/yy'],
  TIMEFORMATS: ['H:mm:ss zzzz', 'H:mm:ss z', 'H:mm:ss', 'H:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale chr.
 */
goog.i18n.DateTimeSymbols_chr = {
  ERAS: ['ᎤᏓᎷᎸ', 'ᎤᎶᏐᏅ'],
  ERANAMES: ['Ꮟ ᏥᏌ ᎾᏕᎲᏍᎬᎾ',
      'ᎠᎩᏃᎮᎵᏓᏍᏗᏱ ᎠᏕᏘᏱᏍᎬ ᏱᎰᏩ ᏧᏓᏂᎸᎢᏍᏗ'],
  NARROWMONTHS: ['Ꭴ', 'Ꭷ', 'Ꭰ', 'Ꭷ', 'Ꭰ', 'Ꮥ', 'Ꭻ', 'Ꭶ', 'Ꮪ',
      'Ꮪ', 'Ꮕ', 'Ꭴ'],
  STANDALONENARROWMONTHS: ['Ꭴ', 'Ꭷ', 'Ꭰ', 'Ꭷ', 'Ꭰ', 'Ꮥ', 'Ꭻ',
      'Ꭶ', 'Ꮪ', 'Ꮪ', 'Ꮕ', 'Ꭴ'],
  MONTHS: ['ᎤᏃᎸᏔᏅ', 'ᎧᎦᎵ', 'ᎠᏅᏱ', 'ᎧᏬᏂ',
      'ᎠᏂᏍᎬᏘ', 'ᏕᎭᎷᏱ', 'ᎫᏰᏉᏂ', 'ᎦᎶᏂ',
      'ᏚᎵᏍᏗ', 'ᏚᏂᏅᏗ', 'ᏅᏓᏕᏆ', 'ᎤᏍᎩᏱ'],
  STANDALONEMONTHS: ['ᎤᏃᎸᏔᏅ', 'ᎧᎦᎵ', 'ᎠᏅᏱ', 'ᎧᏬᏂ',
      'ᎠᏂᏍᎬᏘ', 'ᏕᎭᎷᏱ', 'ᎫᏰᏉᏂ', 'ᎦᎶᏂ',
      'ᏚᎵᏍᏗ', 'ᏚᏂᏅᏗ', 'ᏅᏓᏕᏆ', 'ᎤᏍᎩᏱ'],
  SHORTMONTHS: ['ᎤᏃ', 'ᎧᎦ', 'ᎠᏅ', 'ᎧᏬ', 'ᎠᏂ', 'ᏕᎭ',
      'ᎫᏰ', 'ᎦᎶ', 'ᏚᎵ', 'ᏚᏂ', 'ᏅᏓ', 'ᎤᏍ'],
  STANDALONESHORTMONTHS: ['ᎤᏃ', 'ᎧᎦ', 'ᎠᏅ', 'ᎧᏬ', 'ᎠᏂ',
      'ᏕᎭ', 'ᎫᏰ', 'ᎦᎶ', 'ᏚᎵ', 'ᏚᏂ', 'ᏅᏓ', 'ᎤᏍ'],
  WEEKDAYS: ['ᎤᎾᏙᏓᏆᏍᎬ', 'ᎤᎾᏙᏓᏉᏅᎯ',
      'ᏔᎵᏁᎢᎦ', 'ᏦᎢᏁᎢᎦ', 'ᏅᎩᏁᎢᎦ',
      'ᏧᎾᎩᎶᏍᏗ', 'ᎤᎾᏙᏓᏈᏕᎾ'],
  STANDALONEWEEKDAYS: ['ᎤᎾᏙᏓᏆᏍᎬ', 'ᎤᎾᏙᏓᏉᏅᎯ',
      'ᏔᎵᏁᎢᎦ', 'ᏦᎢᏁᎢᎦ', 'ᏅᎩᏁᎢᎦ',
      'ᏧᎾᎩᎶᏍᏗ', 'ᎤᎾᏙᏓᏈᏕᎾ'],
  SHORTWEEKDAYS: ['ᏆᏍᎬ', 'ᏉᏅᎯ', 'ᏔᎵᏁ', 'ᏦᎢᏁ',
      'ᏅᎩᏁ', 'ᏧᎾᎩ', 'ᏈᏕᎾ'],
  STANDALONESHORTWEEKDAYS: ['ᏆᏍᎬ', 'ᏉᏅᎯ', 'ᏔᎵᏁ', 'ᏦᎢᏁ',
      'ᏅᎩᏁ', 'ᏧᎾᎩ', 'ᏈᏕᎾ'],
  NARROWWEEKDAYS: ['Ꮖ', 'Ꮙ', 'Ꮤ', 'Ꮶ', 'Ꮕ', 'Ꮷ', 'Ꭴ'],
  STANDALONENARROWWEEKDAYS: ['Ꮖ', 'Ꮙ', 'Ꮤ', 'Ꮶ', 'Ꮕ', 'Ꮷ', 'Ꭴ'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  AMPMS: ['ᏌᎾᎴ', 'ᏒᎯᏱᎢᏗᏢ'],
  DATEFORMATS: ['EEEE, MMMM d, y', 'MMMM d, y', 'MMM d, y', 'M/d/yy'],
  TIMEFORMATS: ['h:mm:ss a zzzz', 'h:mm:ss a z', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 6
};


/**
 * Date/time formatting symbols for locale cs.
 */
goog.i18n.DateTimeSymbols_cs = {
  ERAS: ['př. n. l.', 'n. l.'],
  ERANAMES: ['př. n. l.', 'n. l.'],
  NARROWMONTHS: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  STANDALONENARROWMONTHS: ['l', 'ú', 'b', 'd', 'k', 'č', 'č', 's', 'z', 'ř',
      'l', 'p'],
  MONTHS: ['ledna', 'února', 'března', 'dubna', 'května', 'června',
      'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'],
  STANDALONEMONTHS: ['leden', 'únor', 'březen', 'duben', 'květen', 'červen',
      'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'],
  SHORTMONTHS: ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer', 'Čvc', 'Srp',
      'Zář', 'Říj', 'Lis', 'Pro'],
  STANDALONESHORTMONTHS: ['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.',
      '10.', '11.', '12.'],
  WEEKDAYS: ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek',
      'sobota'],
  STANDALONEWEEKDAYS: ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek',
      'pátek', 'sobota'],
  SHORTWEEKDAYS: ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'],
  STANDALONESHORTWEEKDAYS: ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'],
  NARROWWEEKDAYS: ['N', 'P', 'Ú', 'S', 'Č', 'P', 'S'],
  STANDALONENARROWWEEKDAYS: ['N', 'P', 'Ú', 'S', 'Č', 'P', 'S'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['1. čtvrtletí', '2. čtvrtletí', '3. čtvrtletí',
      '4. čtvrtletí'],
  AMPMS: ['dop.', 'odp.'],
  DATEFORMATS: ['EEEE, d. MMMM y', 'd. MMMM y', 'd. M. yyyy', 'dd.MM.yy'],
  TIMEFORMATS: ['H:mm:ss zzzz', 'H:mm:ss z', 'H:mm:ss', 'H:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale cy.
 */
goog.i18n.DateTimeSymbols_cy = {
  ERAS: ['CC', 'OC'],
  ERANAMES: ['Cyn Crist', 'Oed Crist'],
  NARROWMONTHS: ['I', 'C', 'M', 'E', 'M', 'M', 'G', 'A', 'M', 'H', 'T', 'R'],
  STANDALONENARROWMONTHS: ['I', 'C', 'M', 'E', 'M', 'M', 'G', 'A', 'M', 'H',
      'T', 'R'],
  MONTHS: ['Ionawr', 'Chwefror', 'Mawrth', 'Ebrill', 'Mai', 'Mehefin',
      'Gorffenaf', 'Awst', 'Medi', 'Hydref', 'Tachwedd', 'Rhagfyr'],
  STANDALONEMONTHS: ['Ionawr', 'Chwefror', 'Mawrth', 'Ebrill', 'Mai', 'Mehefin',
      'Gorffennaf', 'Awst', 'Medi', 'Hydref', 'Tachwedd', 'Rhagfyr'],
  SHORTMONTHS: ['Ion', 'Chwef', 'Mawrth', 'Ebrill', 'Mai', 'Meh', 'Gorff',
      'Awst', 'Medi', 'Hyd', 'Tach', 'Rhag'],
  STANDALONESHORTMONTHS: ['Ion', 'Chwe', 'Maw', 'Ebr', 'Mai', 'Meh', 'Gor',
      'Awst', 'Medi', 'Hyd', 'Tach', 'Rhag'],
  WEEKDAYS: ['Dydd Sul', 'Dydd Llun', 'Dydd Mawrth', 'Dydd Mercher', 'Dydd Iau',
      'Dydd Gwener', 'Dydd Sadwrn'],
  STANDALONEWEEKDAYS: ['Dydd Sul', 'Dydd Llun', 'Dydd Mawrth', 'Dydd Mercher',
      'Dydd Iau', 'Dydd Gwener', 'Dydd Sadwrn'],
  SHORTWEEKDAYS: ['Sul', 'Llun', 'Maw', 'Mer', 'Iau', 'Gwen', 'Sad'],
  STANDALONESHORTWEEKDAYS: ['Sul', 'Llun', 'Maw', 'Mer', 'Iau', 'Gwe', 'Sad'],
  NARROWWEEKDAYS: ['S', 'L', 'M', 'M', 'I', 'G', 'S'],
  STANDALONENARROWWEEKDAYS: ['S', 'L', 'M', 'M', 'I', 'G', 'S'],
  SHORTQUARTERS: ['Ch1', 'Ch2', 'Ch3', 'Ch4'],
  QUARTERS: ['Chwarter 1af', '2il chwarter', '3ydd chwarter', '4ydd chwarter'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE, d MMMM y', 'd MMMM y', 'd MMM y', 'dd/MM/yyyy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale da.
 */
goog.i18n.DateTimeSymbols_da = {
  ERAS: ['f.Kr.', 'e.Kr.'],
  ERANAMES: ['f.Kr.', 'e.Kr.'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli',
      'august', 'september', 'oktober', 'november', 'december'],
  STANDALONEMONTHS: ['januar', 'februar', 'marts', 'april', 'maj', 'juni',
      'juli', 'august', 'september', 'oktober', 'november', 'december'],
  SHORTMONTHS: ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'aug.',
      'sep.', 'okt.', 'nov.', 'dec.'],
  STANDALONESHORTMONTHS: ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul',
      'aug', 'sep', 'okt', 'nov', 'dec'],
  WEEKDAYS: ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag',
      'lørdag'],
  STANDALONEWEEKDAYS: ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag',
      'fredag', 'lørdag'],
  SHORTWEEKDAYS: ['søn', 'man', 'tir', 'ons', 'tor', 'fre', 'lør'],
  STANDALONESHORTWEEKDAYS: ['søn', 'man', 'tir', 'ons', 'tor', 'fre', 'lør'],
  NARROWWEEKDAYS: ['S', 'M', 'T', 'O', 'T', 'F', 'L'],
  STANDALONENARROWWEEKDAYS: ['S', 'M', 'T', 'O', 'T', 'F', 'L'],
  SHORTQUARTERS: ['K1', 'K2', 'K3', 'K4'],
  QUARTERS: ['1. kvartal', '2. kvartal', '3. kvartal', '4. kvartal'],
  AMPMS: ['f.m.', 'e.m.'],
  DATEFORMATS: ['EEEE \'den\' d. MMMM y', 'd. MMM y', 'dd/MM/yyyy', 'dd/MM/yy'],
  TIMEFORMATS: ['HH.mm.ss zzzz', 'HH.mm.ss z', 'HH.mm.ss', 'HH.mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale de.
 */
goog.i18n.DateTimeSymbols_de = {
  ERAS: ['v. Chr.', 'n. Chr.'],
  ERANAMES: ['v. Chr.', 'n. Chr.'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
      'August', 'September', 'Oktober', 'November', 'Dezember'],
  STANDALONEMONTHS: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  SHORTMONTHS: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep',
      'Okt', 'Nov', 'Dez'],
  STANDALONESHORTMONTHS: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul',
      'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
  WEEKDAYS: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag',
      'Freitag', 'Samstag'],
  STANDALONEWEEKDAYS: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch',
      'Donnerstag', 'Freitag', 'Samstag'],
  SHORTWEEKDAYS: ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'],
  STANDALONESHORTWEEKDAYS: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  NARROWWEEKDAYS: ['S', 'M', 'D', 'M', 'D', 'F', 'S'],
  STANDALONENARROWWEEKDAYS: ['S', 'M', 'D', 'M', 'D', 'F', 'S'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['1. Quartal', '2. Quartal', '3. Quartal', '4. Quartal'],
  AMPMS: ['vorm.', 'nachm.'],
  DATEFORMATS: ['EEEE, d. MMMM y', 'd. MMMM y', 'dd.MM.yyyy', 'dd.MM.yy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale de_AT.
 */
goog.i18n.DateTimeSymbols_de_AT = {
  ERAS: ['v. Chr.', 'n. Chr.'],
  ERANAMES: ['v. Chr.', 'n. Chr.'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
      'August', 'September', 'Oktober', 'November', 'Dezember'],
  STANDALONEMONTHS: ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  SHORTMONTHS: ['Jän', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep',
      'Okt', 'Nov', 'Dez'],
  STANDALONESHORTMONTHS: ['Jän', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul',
      'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
  WEEKDAYS: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag',
      'Freitag', 'Samstag'],
  STANDALONEWEEKDAYS: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch',
      'Donnerstag', 'Freitag', 'Samstag'],
  SHORTWEEKDAYS: ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'],
  STANDALONESHORTWEEKDAYS: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  NARROWWEEKDAYS: ['S', 'M', 'D', 'M', 'D', 'F', 'S'],
  STANDALONENARROWWEEKDAYS: ['S', 'M', 'D', 'M', 'D', 'F', 'S'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['1. Quartal', '2. Quartal', '3. Quartal', '4. Quartal'],
  AMPMS: ['vorm.', 'nachm.'],
  DATEFORMATS: ['EEEE, dd. MMMM y', 'dd. MMMM y', 'dd.MM.yyyy', 'dd.MM.yy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale de_CH.
 */
goog.i18n.DateTimeSymbols_de_CH = goog.i18n.DateTimeSymbols_de;


/**
 * Date/time formatting symbols for locale el.
 */
goog.i18n.DateTimeSymbols_el = {
  ERAS: ['π.Χ.', 'μ.Χ.'],
  ERANAMES: ['π.Χ.', 'μ.Χ.'],
  NARROWMONTHS: ['Ι', 'Φ', 'Μ', 'Α', 'Μ', 'Ι', 'Ι', 'Α', 'Σ', 'Ο',
      'Ν', 'Δ'],
  STANDALONENARROWMONTHS: ['Ι', 'Φ', 'Μ', 'Α', 'Μ', 'Ι', 'Ι', 'Α', 'Σ',
      'Ο', 'Ν', 'Δ'],
  MONTHS: ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου',
      'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου',
      'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου',
      'Νοεμβρίου', 'Δεκεμβρίου'],
  STANDALONEMONTHS: ['Ιανουάριος', 'Φεβρουάριος',
      'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
      'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος',
      'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'],
  SHORTMONTHS: ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαϊ', 'Ιουν',
      'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'],
  STANDALONESHORTMONTHS: ['Ιαν', 'Φεβ', 'Μάρ', 'Απρ', 'Μάι',
      'Ιούν', 'Ιούλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοέ', 'Δεκ'],
  WEEKDAYS: ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη',
      'Πέμπτη', 'Παρασκευή', 'Σάββατο'],
  STANDALONEWEEKDAYS: ['Κυριακή', 'Δευτέρα', 'Τρίτη',
      'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'],
  SHORTWEEKDAYS: ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ',
      'Σαβ'],
  STANDALONESHORTWEEKDAYS: ['Κυρ', 'Δευ', 'Τρί', 'Τετ', 'Πέμ',
      'Παρ', 'Σάβ'],
  NARROWWEEKDAYS: ['Κ', 'Δ', 'Τ', 'Τ', 'Π', 'Π', 'Σ'],
  STANDALONENARROWWEEKDAYS: ['Κ', 'Δ', 'Τ', 'Τ', 'Π', 'Π', 'Σ'],
  SHORTQUARTERS: ['Τ1', 'Τ2', 'Τ3', 'Τ4'],
  QUARTERS: ['1ο τρίμηνο', '2ο τρίμηνο', '3ο τρίμηνο',
      '4ο τρίμηνο'],
  AMPMS: ['π.μ.', 'μ.μ.'],
  DATEFORMATS: ['EEEE, d MMMM y', 'd MMMM y', 'd MMM y', 'd/M/yy'],
  TIMEFORMATS: ['h:mm:ss a zzzz', 'h:mm:ss a z', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale en.
 */
goog.i18n.DateTimeSymbols_en = {
  ERAS: ['BC', 'AD'],
  ERANAMES: ['Before Christ', 'Anno Domini'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'],
  STANDALONEMONTHS: ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'],
  SHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
      'Oct', 'Nov', 'Dec'],
  STANDALONESHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
      'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  WEEKDAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
      'Saturday'],
  STANDALONEWEEKDAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
      'Friday', 'Saturday'],
  SHORTWEEKDAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  STANDALONESHORTWEEKDAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  NARROWWEEKDAYS: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  STANDALONENARROWWEEKDAYS: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['1st quarter', '2nd quarter', '3rd quarter', '4th quarter'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE, MMMM d, y', 'MMMM d, y', 'MMM d, y', 'M/d/yy'],
  TIMEFORMATS: ['h:mm:ss a zzzz', 'h:mm:ss a z', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale en_AU.
 */
goog.i18n.DateTimeSymbols_en_AU = {
  ERAS: ['BC', 'AD'],
  ERANAMES: ['Before Christ', 'Anno Domini'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'],
  STANDALONEMONTHS: ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'],
  SHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
      'Oct', 'Nov', 'Dec'],
  STANDALONESHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
      'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  WEEKDAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
      'Saturday'],
  STANDALONEWEEKDAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
      'Friday', 'Saturday'],
  SHORTWEEKDAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  STANDALONESHORTWEEKDAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  NARROWWEEKDAYS: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  STANDALONENARROWWEEKDAYS: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['1st quarter', '2nd quarter', '3rd quarter', '4th quarter'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE, d MMMM y', 'd MMMM y', 'dd/MM/yyyy', 'd/MM/yy'],
  TIMEFORMATS: ['h:mm:ss a zzzz', 'h:mm:ss a z', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale en_GB.
 */
goog.i18n.DateTimeSymbols_en_GB = {
  ERAS: ['BC', 'AD'],
  ERANAMES: ['Before Christ', 'Anno Domini'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'],
  STANDALONEMONTHS: ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'],
  SHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
      'Oct', 'Nov', 'Dec'],
  STANDALONESHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
      'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  WEEKDAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
      'Saturday'],
  STANDALONEWEEKDAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
      'Friday', 'Saturday'],
  SHORTWEEKDAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  STANDALONESHORTWEEKDAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  NARROWWEEKDAYS: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  STANDALONENARROWWEEKDAYS: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['1st quarter', '2nd quarter', '3rd quarter', '4th quarter'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE, d MMMM y', 'd MMMM y', 'd MMM y', 'dd/MM/yyyy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale en_IE.
 */
goog.i18n.DateTimeSymbols_en_IE = {
  ERAS: ['BC', 'AD'],
  ERANAMES: ['Before Christ', 'Anno Domini'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'],
  STANDALONEMONTHS: ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'],
  SHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
      'Oct', 'Nov', 'Dec'],
  STANDALONESHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
      'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  WEEKDAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
      'Saturday'],
  STANDALONEWEEKDAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
      'Friday', 'Saturday'],
  SHORTWEEKDAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  STANDALONESHORTWEEKDAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  NARROWWEEKDAYS: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  STANDALONENARROWWEEKDAYS: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['1st quarter', '2nd quarter', '3rd quarter', '4th quarter'],
  AMPMS: ['a.m.', 'p.m.'],
  DATEFORMATS: ['EEEE d MMMM y', 'd MMMM y', 'd MMM y', 'dd/MM/yyyy'],
  TIMEFORMATS: ['h:mm:ss a zzzz', 'h:mm:ss a z', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale en_IN.
 */
goog.i18n.DateTimeSymbols_en_IN = {
  ERAS: ['BC', 'AD'],
  ERANAMES: ['Before Christ', 'Anno Domini'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'],
  STANDALONEMONTHS: ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'],
  SHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
      'Oct', 'Nov', 'Dec'],
  STANDALONESHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
      'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  WEEKDAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
      'Saturday'],
  STANDALONEWEEKDAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
      'Friday', 'Saturday'],
  SHORTWEEKDAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  STANDALONESHORTWEEKDAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  NARROWWEEKDAYS: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  STANDALONENARROWWEEKDAYS: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['1st quarter', '2nd quarter', '3rd quarter', '4th quarter'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE d MMMM y', 'd MMMM y', 'dd-MMM-y', 'dd/MM/yy'],
  TIMEFORMATS: ['h:mm:ss a zzzz', 'h:mm:ss a z', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [6, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale en_SG.
 */
goog.i18n.DateTimeSymbols_en_SG = {
  ERAS: ['BC', 'AD'],
  ERANAMES: ['Before Christ', 'Anno Domini'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'],
  STANDALONEMONTHS: ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'],
  SHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
      'Oct', 'Nov', 'Dec'],
  STANDALONESHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
      'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  WEEKDAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
      'Saturday'],
  STANDALONEWEEKDAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
      'Friday', 'Saturday'],
  SHORTWEEKDAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  STANDALONESHORTWEEKDAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  NARROWWEEKDAYS: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  STANDALONENARROWWEEKDAYS: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['1st quarter', '2nd quarter', '3rd quarter', '4th quarter'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE, d MMMM, y', 'd MMMM, y', 'd MMM, y', 'd/M/yy'],
  TIMEFORMATS: ['h:mm:ss a zzzz', 'h:mm:ss a z', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale en_US.
 */
goog.i18n.DateTimeSymbols_en_US = goog.i18n.DateTimeSymbols_en;


/**
 * Date/time formatting symbols for locale en_ZA.
 */
goog.i18n.DateTimeSymbols_en_ZA = {
  ERAS: ['BC', 'AD'],
  ERANAMES: ['Before Christ', 'Anno Domini'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'],
  STANDALONEMONTHS: ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'],
  SHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
      'Oct', 'Nov', 'Dec'],
  STANDALONESHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
      'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  WEEKDAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
      'Saturday'],
  STANDALONEWEEKDAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
      'Friday', 'Saturday'],
  SHORTWEEKDAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  STANDALONESHORTWEEKDAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  NARROWWEEKDAYS: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  STANDALONENARROWWEEKDAYS: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['1st quarter', '2nd quarter', '3rd quarter', '4th quarter'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE dd MMMM y', 'dd MMMM y', 'dd MMM y', 'yyyy/MM/dd'],
  TIMEFORMATS: ['h:mm:ss a zzzz', 'h:mm:ss a z', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale es.
 */
goog.i18n.DateTimeSymbols_es = {
  ERAS: ['a.C.', 'd.C.'],
  ERANAMES: ['antes de Cristo', 'anno Dómini'],
  NARROWMONTHS: ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
      'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  STANDALONEMONTHS: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  SHORTMONTHS: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep',
      'oct', 'nov', 'dic'],
  STANDALONESHORTMONTHS: ['ene', 'feb', 'mar', 'abr', 'mayo', 'jun', 'jul',
      'ago', 'sep', 'oct', 'nov', 'dic'],
  WEEKDAYS: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes',
      'sábado'],
  STANDALONEWEEKDAYS: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves',
      'viernes', 'sábado'],
  SHORTWEEKDAYS: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
  STANDALONESHORTWEEKDAYS: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
  NARROWWEEKDAYS: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
  STANDALONENARROWWEEKDAYS: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
  SHORTQUARTERS: ['T1', 'T2', 'T3', 'T4'],
  QUARTERS: ['1er trimestre', '2º trimestre', '3er trimestre',
      '4º trimestre'],
  AMPMS: ['a.m.', 'p.m.'],
  DATEFORMATS: ['EEEE, d \'de\' MMMM \'de\' y', 'd \'de\' MMMM \'de\' y',
      'dd/MM/yyyy', 'dd/MM/yy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale es_419.
 */
goog.i18n.DateTimeSymbols_es_419 = {
  ERAS: ['a.C.', 'd.C.'],
  ERANAMES: ['antes de Cristo', 'anno Dómini'],
  NARROWMONTHS: ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
      'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  STANDALONEMONTHS: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  SHORTMONTHS: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep',
      'oct', 'nov', 'dic'],
  STANDALONESHORTMONTHS: ['ene', 'feb', 'mar', 'abr', 'mayo', 'jun', 'jul',
      'ago', 'sep', 'oct', 'nov', 'dic'],
  WEEKDAYS: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes',
      'sábado'],
  STANDALONEWEEKDAYS: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves',
      'viernes', 'sábado'],
  SHORTWEEKDAYS: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
  STANDALONESHORTWEEKDAYS: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
  NARROWWEEKDAYS: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
  STANDALONENARROWWEEKDAYS: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
  SHORTQUARTERS: ['T1', 'T2', 'T3', 'T4'],
  QUARTERS: ['1er trimestre', '2º trimestre', '3er trimestre',
      '4º trimestre'],
  AMPMS: ['a.m.', 'p.m.'],
  DATEFORMATS: ['EEEE, d \'de\' MMMM \'de\' y', 'd \'de\' MMMM \'de\' y',
      'dd/MM/yyyy', 'dd/MM/yy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale et.
 */
goog.i18n.DateTimeSymbols_et = {
  ERAS: ['e.m.a.', 'm.a.j.'],
  ERANAMES: ['enne meie aega', 'meie aja järgi'],
  NARROWMONTHS: ['J', 'V', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'V', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['jaanuar', 'veebruar', 'märts', 'aprill', 'mai', 'juuni', 'juuli',
      'august', 'september', 'oktoober', 'november', 'detsember'],
  STANDALONEMONTHS: ['jaanuar', 'veebruar', 'märts', 'aprill', 'mai', 'juuni',
      'juuli', 'august', 'september', 'oktoober', 'november', 'detsember'],
  SHORTMONTHS: ['jaan', 'veebr', 'märts', 'apr', 'mai', 'juuni', 'juuli',
      'aug', 'sept', 'okt', 'nov', 'dets'],
  STANDALONESHORTMONTHS: ['jaan', 'veebr', 'märts', 'apr', 'mai', 'juuni',
      'juuli', 'aug', 'sept', 'okt', 'nov', 'dets'],
  WEEKDAYS: ['pühapäev', 'esmaspäev', 'teisipäev', 'kolmapäev',
      'neljapäev', 'reede', 'laupäev'],
  STANDALONEWEEKDAYS: ['pühapäev', 'esmaspäev', 'teisipäev', 'kolmapäev',
      'neljapäev', 'reede', 'laupäev'],
  SHORTWEEKDAYS: ['P', 'E', 'T', 'K', 'N', 'R', 'L'],
  STANDALONESHORTWEEKDAYS: ['P', 'E', 'T', 'K', 'N', 'R', 'L'],
  NARROWWEEKDAYS: ['P', 'E', 'T', 'K', 'N', 'R', 'L'],
  STANDALONENARROWWEEKDAYS: ['P', 'E', 'T', 'K', 'N', 'R', 'L'],
  SHORTQUARTERS: ['K1', 'K2', 'K3', 'K4'],
  QUARTERS: ['1. kvartal', '2. kvartal', '3. kvartal', '4. kvartal'],
  AMPMS: ['enne keskpäeva', 'pärast keskpäeva'],
  DATEFORMATS: ['EEEE, d. MMMM y', 'd. MMMM y', 'dd.MM.yyyy', 'dd.MM.yy'],
  TIMEFORMATS: ['H:mm.ss zzzz', 'H:mm.ss z', 'H:mm.ss', 'H:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale eu.
 */
goog.i18n.DateTimeSymbols_eu = {
  ERAS: ['K.a.', 'K.o.'],
  ERANAMES: ['K.a.', 'K.o.'],
  NARROWMONTHS: ['U', 'O', 'M', 'A', 'M', 'E', 'U', 'A', 'I', 'U', 'A', 'A'],
  STANDALONENARROWMONTHS: ['U', 'O', 'M', 'A', 'M', 'E', 'U', 'A', 'I', 'U',
      'A', 'A'],
  MONTHS: ['urtarrila', 'otsaila', 'martxoa', 'apirila', 'maiatza', 'ekaina',
      'uztaila', 'abuztua', 'iraila', 'urria', 'azaroa', 'abendua'],
  STANDALONEMONTHS: ['urtarrila', 'otsaila', 'martxoa', 'apirila', 'maiatza',
      'ekaina', 'uztaila', 'abuztua', 'iraila', 'urria', 'azaroa', 'abendua'],
  SHORTMONTHS: ['urt', 'ots', 'mar', 'api', 'mai', 'eka', 'uzt', 'abu', 'ira',
      'urr', 'aza', 'abe'],
  STANDALONESHORTMONTHS: ['urt', 'ots', 'mar', 'api', 'mai', 'eka', 'uzt',
      'abu', 'ira', 'urr', 'aza', 'abe'],
  WEEKDAYS: ['igandea', 'astelehena', 'asteartea', 'asteazkena', 'osteguna',
      'ostirala', 'larunbata'],
  STANDALONEWEEKDAYS: ['igandea', 'astelehena', 'asteartea', 'asteazkena',
      'osteguna', 'ostirala', 'larunbata'],
  SHORTWEEKDAYS: ['ig', 'al', 'as', 'az', 'og', 'or', 'lr'],
  STANDALONESHORTWEEKDAYS: ['ig', 'al', 'as', 'az', 'og', 'or', 'lr'],
  NARROWWEEKDAYS: ['I', 'M', 'A', 'A', 'A', 'O', 'I'],
  STANDALONENARROWWEEKDAYS: ['I', 'M', 'A', 'L', 'A', 'O', 'I'],
  SHORTQUARTERS: ['1Hh', '2Hh', '3Hh', '4Hh'],
  QUARTERS: ['1. hiruhilekoa', '2. hiruhilekoa', '3. hiruhilekoa',
      '4. hiruhilekoa'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE, y\'eko\' MMMM\'ren\' dd\'a\'',
      'y\'eko\' MMM\'ren\' dd\'a\'', 'y MMM d', 'yyyy-MM-dd'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale fa.
 */
goog.i18n.DateTimeSymbols_fa = {
  ZERODIGIT: 0x06F0,
  ERAS: ['ق.م.', 'م.'],
  ERANAMES: ['قبل از میلاد', 'میلادی'],
  NARROWMONTHS: ['ژ', 'ف', 'م', 'آ', 'م', 'ژ', 'ژ', 'ا', 'س', 'ا',
      'ن', 'د'],
  STANDALONENARROWMONTHS: ['ژ', 'ف', 'م', 'آ', 'م', 'ژ', 'ژ', 'ا', 'س',
      'ا', 'ن', 'د'],
  MONTHS: ['ژانویهٔ', 'فوریهٔ', 'مارس', 'آوریل', 'مهٔ',
      'ژوئن', 'ژوئیهٔ', 'اوت', 'سپتامبر', 'اکتبر',
      'نوامبر', 'دسامبر'],
  STANDALONEMONTHS: ['ژانویه', 'فوریه', 'مارس', 'آوریل',
      'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر',
      'اکتبر', 'نوامبر', 'دسامبر'],
  SHORTMONTHS: ['ژانویهٔ', 'فوریهٔ', 'مارس', 'آوریل',
      'مهٔ', 'ژوئن', 'ژوئیهٔ', 'اوت', 'سپتامبر',
      'اکتبر', 'نوامبر', 'دسامبر'],
  STANDALONESHORTMONTHS: ['ژانویه', 'فوریه', 'مارس',
      'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت',
      'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'],
  WEEKDAYS: ['یکشنبه', 'دوشنبه', 'سه‌شنبه',
      'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'],
  STANDALONEWEEKDAYS: ['یکشنبه', 'دوشنبه', 'سه‌شنبه',
      'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'],
  SHORTWEEKDAYS: ['یکشنبه', 'دوشنبه', 'سه‌شنبه',
      'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'],
  STANDALONESHORTWEEKDAYS: ['یکشنبه', 'دوشنبه', 'سه‌شنبه',
      'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'],
  NARROWWEEKDAYS: ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'],
  STANDALONENARROWWEEKDAYS: ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'],
  SHORTQUARTERS: ['س‌م۱', 'س‌م۲', 'س‌م۳', 'س‌م۴'],
  QUARTERS: ['سه‌ماههٔ اول', 'سه‌ماههٔ دوم',
      'سه‌ماههٔ سوم', 'سه‌ماههٔ چهارم'],
  AMPMS: ['قبل‌ازظهر', 'بعدازظهر'],
  DATEFORMATS: ['EEEE d MMMM y', 'd MMMM y', 'd MMM y', 'yyyy/M/d'],
  TIMEFORMATS: ['H:mm:ss (zzzz)', 'H:mm:ss (z)', 'H:mm:ss', 'H:mm'],
  FIRSTDAYOFWEEK: 5,
  WEEKENDRANGE: [3, 4],
  FIRSTWEEKCUTOFFDAY: 4
};


/**
 * Date/time formatting symbols for locale fi.
 */
goog.i18n.DateTimeSymbols_fi = {
  ERAS: ['eKr.', 'jKr.'],
  ERANAMES: ['ennen Kristuksen syntymää', 'jälkeen Kristuksen syntymän'],
  NARROWMONTHS: ['T', 'H', 'M', 'H', 'T', 'K', 'H', 'E', 'S', 'L', 'M', 'J'],
  STANDALONENARROWMONTHS: ['T', 'H', 'M', 'H', 'T', 'K', 'H', 'E', 'S', 'L',
      'M', 'J'],
  MONTHS: ['tammikuuta', 'helmikuuta', 'maaliskuuta', 'huhtikuuta',
      'toukokuuta', 'kesäkuuta', 'heinäkuuta', 'elokuuta', 'syyskuuta',
      'lokakuuta', 'marraskuuta', 'joulukuuta'],
  STANDALONEMONTHS: ['tammikuu', 'helmikuu', 'maaliskuu', 'huhtikuu',
      'toukokuu', 'kesäkuu', 'heinäkuu', 'elokuu', 'syyskuu', 'lokakuu',
      'marraskuu', 'joulukuu'],
  SHORTMONTHS: ['tammikuuta', 'helmikuuta', 'maaliskuuta', 'huhtikuuta',
      'toukokuuta', 'kesäkuuta', 'heinäkuuta', 'elokuuta', 'syyskuuta',
      'lokakuuta', 'marraskuuta', 'joulukuuta'],
  STANDALONESHORTMONTHS: ['tammi', 'helmi', 'maalis', 'huhti', 'touko', 'kesä',
      'heinä', 'elo', 'syys', 'loka', 'marras', 'joulu'],
  WEEKDAYS: ['sunnuntaina', 'maanantaina', 'tiistaina', 'keskiviikkona',
      'torstaina', 'perjantaina', 'lauantaina'],
  STANDALONEWEEKDAYS: ['sunnuntai', 'maanantai', 'tiistai', 'keskiviikko',
      'torstai', 'perjantai', 'lauantai'],
  SHORTWEEKDAYS: ['su', 'ma', 'ti', 'ke', 'to', 'pe', 'la'],
  STANDALONESHORTWEEKDAYS: ['su', 'ma', 'ti', 'ke', 'to', 'pe', 'la'],
  NARROWWEEKDAYS: ['S', 'M', 'T', 'K', 'T', 'P', 'L'],
  STANDALONENARROWWEEKDAYS: ['S', 'M', 'T', 'K', 'T', 'P', 'L'],
  SHORTQUARTERS: ['1. nelj.', '2. nelj.', '3. nelj.', '4. nelj.'],
  QUARTERS: ['1. neljännes', '2. neljännes', '3. neljännes',
      '4. neljännes'],
  AMPMS: ['ap.', 'ip.'],
  DATEFORMATS: ['cccc, d. MMMM y', 'd. MMMM y', 'd.M.yyyy', 'd.M.yyyy'],
  TIMEFORMATS: ['H.mm.ss zzzz', 'H.mm.ss z', 'H.mm.ss', 'H.mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale fil.
 */
goog.i18n.DateTimeSymbols_fil = {
  ERAS: ['BC', 'AD'],
  ERANAMES: ['BC', 'AD'],
  NARROWMONTHS: ['E', 'P', 'M', 'A', 'M', 'H', 'H', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['E', 'P', 'M', 'A', 'M', 'H', 'H', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['Enero', 'Pebrero', 'Marso', 'Abril', 'Mayo', 'Hunyo', 'Hulyo',
      'Agosto', 'Setyembre', 'Oktubre', 'Nobyembre', 'Disyembre'],
  STANDALONEMONTHS: ['Enero', 'Pebrero', 'Marso', 'Abril', 'Mayo', 'Hunyo',
      'Hulyo', 'Agosto', 'Setyembre', 'Oktubre', 'Nobyembre', 'Disyembre'],
  SHORTMONTHS: ['Ene', 'Peb', 'Mar', 'Abr', 'May', 'Hun', 'Hul', 'Ago', 'Set',
      'Okt', 'Nob', 'Dis'],
  STANDALONESHORTMONTHS: ['Ene', 'Peb', 'Mar', 'Abr', 'May', 'Hun', 'Hul',
      'Ago', 'Set', 'Okt', 'Nob', 'Dis'],
  WEEKDAYS: ['Linggo', 'Lunes', 'Martes', 'Miyerkules', 'Huwebes', 'Biyernes',
      'Sabado'],
  STANDALONEWEEKDAYS: ['Linggo', 'Lunes', 'Martes', 'Miyerkules', 'Huwebes',
      'Biyernes', 'Sabado'],
  SHORTWEEKDAYS: ['Lin', 'Lun', 'Mar', 'Mye', 'Huw', 'Bye', 'Sab'],
  STANDALONESHORTWEEKDAYS: ['Lin', 'Lun', 'Mar', 'Miy', 'Huw', 'Biy', 'Sab'],
  NARROWWEEKDAYS: ['L', 'L', 'M', 'M', 'H', 'B', 'S'],
  STANDALONENARROWWEEKDAYS: ['L', 'L', 'M', 'M', 'H', 'B', 'S'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['ika-1 sangkapat', 'ika-2 sangkapat', 'ika-3 quarter',
      'ika-4 na quarter'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE, MMMM dd y', 'MMMM d, y', 'MMM d, y', 'M/d/yy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale fr.
 */
goog.i18n.DateTimeSymbols_fr = {
  ERAS: ['av. J.-C.', 'ap. J.-C.'],
  ERANAMES: ['avant Jésus-Christ', 'après Jésus-Christ'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
      'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  STANDALONEMONTHS: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  SHORTMONTHS: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.',
      'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  STANDALONESHORTMONTHS: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
      'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  WEEKDAYS: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi',
      'samedi'],
  STANDALONEWEEKDAYS: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi',
      'vendredi', 'samedi'],
  SHORTWEEKDAYS: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
  STANDALONESHORTWEEKDAYS: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.',
      'sam.'],
  NARROWWEEKDAYS: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
  STANDALONENARROWWEEKDAYS: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
  SHORTQUARTERS: ['T1', 'T2', 'T3', 'T4'],
  QUARTERS: ['1er trimestre', '2e trimestre', '3e trimestre', '4e trimestre'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE d MMMM y', 'd MMMM y', 'd MMM y', 'dd/MM/yy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale fr_CA.
 */
goog.i18n.DateTimeSymbols_fr_CA = {
  ERAS: ['av. J.-C.', 'ap. J.-C.'],
  ERANAMES: ['avant Jésus-Christ', 'après Jésus-Christ'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
      'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  STANDALONEMONTHS: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  SHORTMONTHS: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.',
      'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  STANDALONESHORTMONTHS: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
      'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  WEEKDAYS: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi',
      'samedi'],
  STANDALONEWEEKDAYS: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi',
      'vendredi', 'samedi'],
  SHORTWEEKDAYS: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
  STANDALONESHORTWEEKDAYS: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.',
      'sam.'],
  NARROWWEEKDAYS: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
  STANDALONENARROWWEEKDAYS: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
  SHORTQUARTERS: ['T1', 'T2', 'T3', 'T4'],
  QUARTERS: ['1er trimestre', '2e trimestre', '3e trimestre', '4e trimestre'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE d MMMM y', 'd MMMM y', 'yyyy-MM-dd', 'yy-MM-dd'],
  TIMEFORMATS: ['HH \'h\' mm \'min\' ss \'s\' zzzz', 'HH:mm:ss z', 'HH:mm:ss',
      'HH:mm'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale gl.
 */
goog.i18n.DateTimeSymbols_gl = {
  ERAS: ['a.C.', 'd.C.'],
  ERANAMES: ['antes de Cristo', 'despois de Cristo'],
  NARROWMONTHS: ['X', 'F', 'M', 'A', 'M', 'X', 'X', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['X', 'F', 'M', 'A', 'M', 'X', 'X', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['Xaneiro', 'Febreiro', 'Marzo', 'Abril', 'Maio', 'Xuño', 'Xullo',
      'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Decembro'],
  STANDALONEMONTHS: ['Xaneiro', 'Febreiro', 'Marzo', 'Abril', 'Maio', 'Xuño',
      'Xullo', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Decembro'],
  SHORTMONTHS: ['Xan', 'Feb', 'Mar', 'Abr', 'Mai', 'Xuñ', 'Xul', 'Ago', 'Set',
      'Out', 'Nov', 'Dec'],
  STANDALONESHORTMONTHS: ['Xan', 'Feb', 'Mar', 'Abr', 'Mai', 'Xuñ', 'Xul',
      'Ago', 'Set', 'Out', 'Nov', 'Dec'],
  WEEKDAYS: ['Domingo', 'Luns', 'Martes', 'Mércores', 'Xoves', 'Venres',
      'Sábado'],
  STANDALONEWEEKDAYS: ['Domingo', 'Luns', 'Martes', 'Mércores', 'Xoves',
      'Venres', 'Sábado'],
  SHORTWEEKDAYS: ['Dom', 'Lun', 'Mar', 'Mér', 'Xov', 'Ven', 'Sáb'],
  STANDALONESHORTWEEKDAYS: ['Dom', 'Lun', 'Mar', 'Mér', 'Xov', 'Ven', 'Sáb'],
  NARROWWEEKDAYS: ['D', 'L', 'M', 'M', 'X', 'V', 'S'],
  STANDALONENARROWWEEKDAYS: ['D', 'L', 'M', 'M', 'X', 'V', 'S'],
  SHORTQUARTERS: ['T1', 'T2', 'T3', 'T4'],
  QUARTERS: ['1o trimestre', '2o trimestre', '3o trimestre', '4o trimestre'],
  AMPMS: ['a.m.', 'p.m.'],
  DATEFORMATS: ['EEEE dd MMMM y', 'dd MMMM y', 'd MMM, y', 'dd/MM/yy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale gsw.
 */
goog.i18n.DateTimeSymbols_gsw = {
  ERAS: ['v. Chr.', 'n. Chr.'],
  ERANAMES: ['v. Chr.', 'n. Chr.'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
      'Auguscht', 'Septämber', 'Oktoober', 'Novämber', 'Dezämber'],
  STANDALONEMONTHS: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'Auguscht', 'Septämber', 'Oktoober', 'Novämber', 'Dezämber'],
  SHORTMONTHS: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep',
      'Okt', 'Nov', 'Dez'],
  STANDALONESHORTMONTHS: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul',
      'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
  WEEKDAYS: ['Sunntig', 'Määntig', 'Ziischtig', 'Mittwuch', 'Dunschtig',
      'Friitig', 'Samschtig'],
  STANDALONEWEEKDAYS: ['Sunntig', 'Määntig', 'Ziischtig', 'Mittwuch',
      'Dunschtig', 'Friitig', 'Samschtig'],
  SHORTWEEKDAYS: ['Su.', 'Mä.', 'Zi.', 'Mi.', 'Du.', 'Fr.', 'Sa.'],
  STANDALONESHORTWEEKDAYS: ['Su.', 'Mä.', 'Zi.', 'Mi.', 'Du.', 'Fr.', 'Sa.'],
  NARROWWEEKDAYS: ['S', 'M', 'D', 'M', 'D', 'F', 'S'],
  STANDALONENARROWWEEKDAYS: ['S', 'M', 'D', 'M', 'D', 'F', 'S'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['1. Quartal', '2. Quartal', '3. Quartal', '4. Quartal'],
  AMPMS: ['vorm.', 'nam.'],
  DATEFORMATS: ['EEEE, d. MMMM y', 'd. MMMM y', 'dd.MM.yyyy', 'dd.MM.yy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 6
};


/**
 * Date/time formatting symbols for locale gu.
 */
goog.i18n.DateTimeSymbols_gu = {
  ERAS: ['ઈલુના જન્મ પહેસાં',
      'ઇસવીસન'],
  ERANAMES: ['ઈસવીસન પૂર્વે', 'ઇસવીસન'],
  NARROWMONTHS: ['જા', 'ફે', 'મા', 'એ', 'મે', 'જૂ',
      'જુ', 'ઑ', 'સ', 'ઑ', 'ન', 'ડિ'],
  STANDALONENARROWMONTHS: ['જા', 'ફે', 'મા', 'એ', 'મે',
      'જૂ', 'જુ', 'ઑ', 'સ', 'ઑ', 'ન', 'ડિ'],
  MONTHS: ['જાન્યુઆરી', 'ફેબ્રુઆરી',
      'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન',
      'જુલાઈ', 'ઑગસ્ટ', 'સપ્ટેમ્બર',
      'ઑક્ટોબર', 'નવેમ્બર',
      'ડિસેમ્બર'],
  STANDALONEMONTHS: ['જાન્યુઆરી',
      'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ',
      'મે', 'જૂન', 'જુલાઈ', 'ઑગસ્ટ',
      'સપ્ટેમ્બર', 'ઑક્ટોબર',
      'નવેમ્બર', 'ડિસેમ્બર'],
  SHORTMONTHS: ['જાન્યુ', 'ફેબ્રુ', 'માર્ચ',
      'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ',
      'ઑગસ્ટ', 'સપ્ટે', 'ઑક્ટો', 'નવે',
      'ડિસે'],
  STANDALONESHORTMONTHS: ['જાન્યુ', 'ફેબ્રુ',
      'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન',
      'જુલાઈ', 'ઑગસ્ટ', 'સપ્ટે',
      'ઑક્ટો', 'નવે', 'ડિસે'],
  WEEKDAYS: ['રવિવાર', 'સોમવાર',
      'મંગળવાર', 'બુધવાર', 'ગુરુવાર',
      'શુક્રવાર', 'શનિવાર'],
  STANDALONEWEEKDAYS: ['રવિવાર', 'સોમવાર',
      'મંગળવાર', 'બુધવાર', 'ગુરુવાર',
      'શુક્રવાર', 'શનિવાર'],
  SHORTWEEKDAYS: ['રવિ', 'સોમ', 'મંગળ', 'બુધ',
      'ગુરુ', 'શુક્ર', 'શનિ'],
  STANDALONESHORTWEEKDAYS: ['રવિ', 'સોમ', 'મંગળ',
      'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ'],
  NARROWWEEKDAYS: ['ર', 'સો', 'મં', 'બુ', 'ગુ', 'શુ',
      'શ'],
  STANDALONENARROWWEEKDAYS: ['ર', 'સો', 'મં', 'બુ', 'ગુ',
      'શુ', 'શ'],
  SHORTQUARTERS: ['પેહલા હંત 1', 'Q2', 'Q3',
      'ચૌતા હંત 4'],
  QUARTERS: ['પેહલા હંત 1', 'ડૂસઋા હંત 2',
      'તીસઋા હંત 3', 'ચૌતા હંત 4'],
  AMPMS: ['am', 'pm'],
  DATEFORMATS: ['EEEE, d MMMM, y', 'd MMMM, y', 'd MMM, y', 'd-MM-yy'],
  TIMEFORMATS: ['hh:mm:ss a zzzz', 'hh:mm:ss a z', 'hh:mm:ss a', 'hh:mm a'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [6, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale haw.
 */
goog.i18n.DateTimeSymbols_haw = {
  ERAS: ['BCE', 'CE'],
  ERANAMES: ['BCE', 'CE'],
  NARROWMONTHS: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  STANDALONENARROWMONTHS: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
      '11', '12'],
  MONTHS: ['Ianuali', 'Pepeluali', 'Malaki', 'ʻApelila', 'Mei', 'Iune',
      'Iulai', 'ʻAukake', 'Kepakemapa', 'ʻOkakopa', 'Nowemapa', 'Kekemapa'],
  STANDALONEMONTHS: ['Ianuali', 'Pepeluali', 'Malaki', 'ʻApelila', 'Mei',
      'Iune', 'Iulai', 'ʻAukake', 'Kepakemapa', 'ʻOkakopa', 'Nowemapa',
      'Kekemapa'],
  SHORTMONTHS: ['Ian.', 'Pep.', 'Mal.', 'ʻAp.', 'Mei', 'Iun.', 'Iul.', 'ʻAu.',
      'Kep.', 'ʻOk.', 'Now.', 'Kek.'],
  STANDALONESHORTMONTHS: ['Ian.', 'Pep.', 'Mal.', 'ʻAp.', 'Mei', 'Iun.',
      'Iul.', 'ʻAu.', 'Kep.', 'ʻOk.', 'Now.', 'Kek.'],
  WEEKDAYS: ['Lāpule', 'Poʻakahi', 'Poʻalua', 'Poʻakolu', 'Poʻahā',
      'Poʻalima', 'Poʻaono'],
  STANDALONEWEEKDAYS: ['Lāpule', 'Poʻakahi', 'Poʻalua', 'Poʻakolu',
      'Poʻahā', 'Poʻalima', 'Poʻaono'],
  SHORTWEEKDAYS: ['LP', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
  STANDALONESHORTWEEKDAYS: ['LP', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
  NARROWWEEKDAYS: ['1', '2', '3', '4', '5', '6', '7'],
  STANDALONENARROWWEEKDAYS: ['1', '2', '3', '4', '5', '6', '7'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE, d MMMM y', 'd MMMM y', 'd MMM y', 'd/M/yy'],
  TIMEFORMATS: ['h:mm:ss a zzzz', 'h:mm:ss a z', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale he.
 */
goog.i18n.DateTimeSymbols_he = {
  ERAS: ['לפנה״ס', 'לסה״נ'],
  ERANAMES: ['לפני הספירה', 'לספירה'],
  NARROWMONTHS: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  STANDALONENARROWMONTHS: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
      '11', '12'],
  MONTHS: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי',
      'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר',
      'נובמבר', 'דצמבר'],
  STANDALONEMONTHS: ['ינואר', 'פברואר', 'מרץ', 'אפריל',
      'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר',
      'אוקטובר', 'נובמבר', 'דצמבר'],
  SHORTMONTHS: ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ',
      'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'],
  STANDALONESHORTMONTHS: ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳',
      'מאי', 'יונ׳', 'יול׳', 'אוג׳', 'ספט׳', 'אוק׳',
      'נוב׳', 'דצמ׳'],
  WEEKDAYS: ['יום ראשון', 'יום שני', 'יום שלישי',
      'יום רביעי', 'יום חמישי', 'יום שישי',
      'יום שבת'],
  STANDALONEWEEKDAYS: ['יום ראשון', 'יום שני',
      'יום שלישי', 'יום רביעי', 'יום חמישי',
      'יום שישי', 'יום שבת'],
  SHORTWEEKDAYS: ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳',
      'יום ה׳', 'יום ו׳', 'שבת'],
  STANDALONESHORTWEEKDAYS: ['יום א׳', 'יום ב׳', 'יום ג׳',
      'יום ד׳', 'יום ה׳', 'יום ו׳', 'שבת'],
  NARROWWEEKDAYS: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
  STANDALONENARROWWEEKDAYS: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
  SHORTQUARTERS: ['רבעון 1', 'רבעון 2', 'רבעון 3',
      'רבעון 4'],
  QUARTERS: ['רבעון 1', 'רבעון 2', 'רבעון 3', 'רבעון 4'],
  AMPMS: ['לפנה״צ', 'אחה״צ'],
  DATEFORMATS: ['EEEE, d בMMMM y', 'd בMMMM y', 'd בMMM yyyy', 'dd/MM/yy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [4, 5],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale hi.
 */
goog.i18n.DateTimeSymbols_hi = {
  ERAS: ['ईसापूर्व', 'सन'],
  ERANAMES: ['ईसापूर्व', 'सन'],
  NARROWMONTHS: ['ज', 'फ़', 'मा', 'अ', 'म', 'जू', 'जु',
      'अ', 'सि', 'अ', 'न', 'दि'],
  STANDALONENARROWMONTHS: ['ज', 'फ़', 'मा', 'अ', 'म', 'जू',
      'जु', 'अ', 'सि', 'अ', 'न', 'दि'],
  MONTHS: ['जनवरी', 'फरवरी', 'मार्च',
      'अप्रैल', 'मई', 'जून', 'जुलाई',
      'अगस्त', 'सितम्बर', 'अक्तूबर',
      'नवम्बर', 'दिसम्बर'],
  STANDALONEMONTHS: ['जनवरी', 'फरवरी', 'मार्च',
      'अप्रैल', 'मई', 'जून', 'जुलाई',
      'अगस्त', 'सितम्बर', 'अक्तूबर',
      'नवम्बर', 'दिसम्बर'],
  SHORTMONTHS: ['जनवरी', 'फरवरी', 'मार्च',
      'अप्रैल', 'मई', 'जून', 'जुलाई',
      'अगस्त', 'सितम्बर', 'अक्तूबर',
      'नवम्बर', 'दिसम्बर'],
  STANDALONESHORTMONTHS: ['जनवरी', 'फरवरी',
      'मार्च', 'अप्रैल', 'मई', 'जून',
      'जुलाई', 'अगस्त', 'सितम्बर',
      'अक्तूबर', 'नवम्बर', 'दिसम्बर'],
  WEEKDAYS: ['रविवार', 'सोमवार',
      'मंगलवार', 'बुधवार',
      'बृहस्पतिवार', 'शुक्रवार',
      'शनिवार'],
  STANDALONEWEEKDAYS: ['रविवार', 'सोमवार',
      'मंगलवार', 'बुधवार',
      'बृहस्पतिवार', 'शुक्रवार',
      'शनिवार'],
  SHORTWEEKDAYS: ['रवि.', 'सोम.', 'मंगल.', 'बुध.',
      'बृह.', 'शुक्र.', 'शनि.'],
  STANDALONESHORTWEEKDAYS: ['रवि.', 'सोम.', 'मंगल.',
      'बुध.', 'बृह.', 'शुक्र.', 'शनि.'],
  NARROWWEEKDAYS: ['र', 'सो', 'मं', 'बु', 'गु', 'शु',
      'श'],
  STANDALONENARROWWEEKDAYS: ['र', 'सो', 'मं', 'बु', 'गु',
      'शु', 'श'],
  SHORTQUARTERS: ['तिमाही', 'दूसरी तिमाही',
      'तीसरी तिमाही', 'चौथी तिमाही'],
  QUARTERS: ['तिमाही', 'दूसरी तिमाही',
      'तीसरी तिमाही', 'चौथी तिमाही'],
  AMPMS: ['am', 'pm'],
  DATEFORMATS: ['EEEE, d MMMM y', 'd MMMM y', 'dd-MM-yyyy', 'd-M-yy'],
  TIMEFORMATS: ['h:mm:ss a zzzz', 'h:mm:ss a z', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [6, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale hr.
 */
goog.i18n.DateTimeSymbols_hr = {
  ERAS: ['p. n. e.', 'A. D.'],
  ERANAMES: ['Prije Krista', 'Poslije Krista'],
  NARROWMONTHS: ['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.',
      '11.', '12.'],
  STANDALONENARROWMONTHS: ['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.',
      '10.', '11.', '12.'],
  MONTHS: ['siječnja', 'veljače', 'ožujka', 'travnja', 'svibnja', 'lipnja',
      'srpnja', 'kolovoza', 'rujna', 'listopada', 'studenoga', 'prosinca'],
  STANDALONEMONTHS: ['siječanj', 'veljača', 'ožujak', 'travanj', 'svibanj',
      'lipanj', 'srpanj', 'kolovoz', 'rujan', 'listopad', 'studeni',
      'prosinac'],
  SHORTMONTHS: ['sij', 'velj', 'ožu', 'tra', 'svi', 'lip', 'srp', 'kol', 'ruj',
      'lis', 'stu', 'pro'],
  STANDALONESHORTMONTHS: ['sij', 'velj', 'ožu', 'tra', 'svi', 'lip', 'srp',
      'kol', 'ruj', 'lis', 'stu', 'pro'],
  WEEKDAYS: ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak',
      'petak', 'subota'],
  STANDALONEWEEKDAYS: ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda',
      'četvrtak', 'petak', 'subota'],
  SHORTWEEKDAYS: ['ned', 'pon', 'uto', 'sri', 'čet', 'pet', 'sub'],
  STANDALONESHORTWEEKDAYS: ['ned', 'pon', 'uto', 'sri', 'čet', 'pet', 'sub'],
  NARROWWEEKDAYS: ['N', 'P', 'U', 'S', 'Č', 'P', 'S'],
  STANDALONENARROWWEEKDAYS: ['n', 'p', 'u', 's', 'č', 'p', 's'],
  SHORTQUARTERS: ['1kv', '2kv', '3kv', '4kv'],
  QUARTERS: ['1. kvartal', '2. kvartal', '3. kvartal', '4. kvartal'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE, d. MMMM y.', 'd. MMMM y.', 'd. M. y.', 'd.M.y.'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 6
};


/**
 * Date/time formatting symbols for locale hu.
 */
goog.i18n.DateTimeSymbols_hu = {
  ERAS: ['i. e.', 'i. sz.'],
  ERANAMES: ['időszámításunk előtt', 'időszámításunk szerint'],
  NARROWMONTHS: ['J', 'F', 'M', 'Á', 'M', 'J', 'J', 'Á', 'Sz', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'Á', 'M', 'J', 'J', 'A', 'Sz', 'O',
      'N', 'D'],
  MONTHS: ['január', 'február', 'március', 'április', 'május', 'június',
      'július', 'augusztus', 'szeptember', 'október', 'november', 'december'],
  STANDALONEMONTHS: ['január', 'február', 'március', 'április', 'május',
      'június', 'július', 'augusztus', 'szeptember', 'október', 'november',
      'december'],
  SHORTMONTHS: ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.',
      'aug.', 'szept.', 'okt.', 'nov.', 'dec.'],
  STANDALONESHORTMONTHS: ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.',
      'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'],
  WEEKDAYS: ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök',
      'péntek', 'szombat'],
  STANDALONEWEEKDAYS: ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök',
      'péntek', 'szombat'],
  SHORTWEEKDAYS: ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'],
  STANDALONESHORTWEEKDAYS: ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'],
  NARROWWEEKDAYS: ['V', 'H', 'K', 'Sz', 'Cs', 'P', 'Sz'],
  STANDALONENARROWWEEKDAYS: ['V', 'H', 'K', 'Sz', 'Cs', 'P', 'Sz'],
  SHORTQUARTERS: ['N1', 'N2', 'N3', 'N4'],
  QUARTERS: ['I. negyedév', 'II. negyedév', 'III. negyedév',
      'IV. negyedév'],
  AMPMS: ['de.', 'du.'],
  DATEFORMATS: ['y. MMMM d., EEEE', 'y. MMMM d.', 'yyyy.MM.dd.', 'yyyy.MM.dd.'],
  TIMEFORMATS: ['H:mm:ss zzzz', 'H:mm:ss z', 'H:mm:ss', 'H:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 6
};


/**
 * Date/time formatting symbols for locale id.
 */
goog.i18n.DateTimeSymbols_id = {
  ERAS: ['SM', 'M'],
  ERANAMES: ['SM', 'M'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
      'Agustus', 'September', 'Oktober', 'November', 'Desember'],
  STANDALONEMONTHS: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
  SHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep',
      'Okt', 'Nov', 'Des'],
  STANDALONESHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul',
      'Agt', 'Sep', 'Okt', 'Nov', 'Des'],
  WEEKDAYS: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  STANDALONEWEEKDAYS: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat',
      'Sabtu'],
  SHORTWEEKDAYS: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
  STANDALONESHORTWEEKDAYS: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
  NARROWWEEKDAYS: ['M', 'S', 'S', 'R', 'K', 'J', 'S'],
  STANDALONENARROWWEEKDAYS: ['M', 'S', 'S', 'R', 'K', 'J', 'S'],
  SHORTQUARTERS: ['K1', 'K2', 'K3', 'K4'],
  QUARTERS: ['kuartal pertama', 'kuartal kedua', 'kuartal ketiga',
      'kuartal keempat'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE, dd MMMM yyyy', 'd MMMM yyyy', 'd MMM yyyy', 'dd/MM/yy'],
  TIMEFORMATS: ['H:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale in.
 */
goog.i18n.DateTimeSymbols_in = {
  ERAS: ['SM', 'M'],
  ERANAMES: ['SM', 'M'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
      'Agustus', 'September', 'Oktober', 'November', 'Desember'],
  STANDALONEMONTHS: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
  SHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep',
      'Okt', 'Nov', 'Des'],
  STANDALONESHORTMONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul',
      'Agt', 'Sep', 'Okt', 'Nov', 'Des'],
  WEEKDAYS: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  STANDALONEWEEKDAYS: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat',
      'Sabtu'],
  SHORTWEEKDAYS: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
  STANDALONESHORTWEEKDAYS: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
  NARROWWEEKDAYS: ['M', 'S', 'S', 'R', 'K', 'J', 'S'],
  STANDALONENARROWWEEKDAYS: ['M', 'S', 'S', 'R', 'K', 'J', 'S'],
  SHORTQUARTERS: ['K1', 'K2', 'K3', 'K4'],
  QUARTERS: ['kuartal pertama', 'kuartal kedua', 'kuartal ketiga',
      'kuartal keempat'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE, dd MMMM yyyy', 'd MMMM yyyy', 'd MMM yyyy', 'dd/MM/yy'],
  TIMEFORMATS: ['H:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale is.
 */
goog.i18n.DateTimeSymbols_is = {
  ERAS: ['fyrir Krist', 'eftir Krist'],
  ERANAMES: ['fyrir Krist', 'eftir Krist'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'Á', 'L', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['j', 'f', 'm', 'a', 'm', 'j', 'j', 'á', 's', 'o',
      'n', 'd'],
  MONTHS: ['janúar', 'febrúar', 'mars', 'apríl', 'maí', 'júní', 'júlí',
      'ágúst', 'september', 'október', 'nóvember', 'desember'],
  STANDALONEMONTHS: ['janúar', 'febrúar', 'mars', 'apríl', 'maí', 'júní',
      'júlí', 'ágúst', 'september', 'október', 'nóvember', 'desember'],
  SHORTMONTHS: ['jan', 'feb', 'mar', 'apr', 'maí', 'jún', 'júl', 'ágú',
      'sep', 'okt', 'nóv', 'des'],
  STANDALONESHORTMONTHS: ['jan', 'feb', 'mar', 'apr', 'maí', 'jún', 'júl',
      'ágú', 'sep', 'okt', 'nóv', 'des'],
  WEEKDAYS: ['sunnudagur', 'mánudagur', 'þriðjudagur', 'miðvikudagur',
      'fimmtudagur', 'föstudagur', 'laugardagur'],
  STANDALONEWEEKDAYS: ['sunnudagur', 'mánudagur', 'þriðjudagur',
      'miðvikudagur', 'fimmtudagur', 'föstudagur', 'laugardagur'],
  SHORTWEEKDAYS: ['sun', 'mán', 'þri', 'mið', 'fim', 'fös', 'lau'],
  STANDALONESHORTWEEKDAYS: ['sun', 'mán', 'þri', 'mið', 'fim', 'fös',
      'lau'],
  NARROWWEEKDAYS: ['S', 'M', 'Þ', 'M', 'F', 'F', 'L'],
  STANDALONENARROWWEEKDAYS: ['s', 'm', 'þ', 'm', 'f', 'f', 'l'],
  SHORTQUARTERS: ['F1', 'F2', 'F3', 'F4'],
  QUARTERS: ['1st fjórðungur', '2nd fjórðungur', '3rd fjórðungur',
      '4th fjórðungur'],
  AMPMS: ['f.h.', 'e.h.'],
  DATEFORMATS: ['EEEE, d. MMMM y', 'd. MMMM y', 'd.M.yyyy', 'd.M.yyyy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale it.
 */
goog.i18n.DateTimeSymbols_it = {
  ERAS: ['aC', 'dC'],
  ERANAMES: ['a.C.', 'd.C'],
  NARROWMONTHS: ['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
      'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
  STANDALONEMONTHS: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio',
      'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre',
      'Dicembre'],
  SHORTMONTHS: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set',
      'ott', 'nov', 'dic'],
  STANDALONESHORTMONTHS: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug',
      'ago', 'set', 'ott', 'nov', 'dic'],
  WEEKDAYS: ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì',
      'venerdì', 'sabato'],
  STANDALONEWEEKDAYS: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì',
      'Giovedì', 'Venerdì', 'Sabato'],
  SHORTWEEKDAYS: ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'],
  STANDALONESHORTWEEKDAYS: ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'],
  NARROWWEEKDAYS: ['D', 'L', 'M', 'M', 'G', 'V', 'S'],
  STANDALONENARROWWEEKDAYS: ['D', 'L', 'M', 'M', 'G', 'V', 'S'],
  SHORTQUARTERS: ['T1', 'T2', 'T3', 'T4'],
  QUARTERS: ['1o trimestre', '2o trimestre', '3o trimestre', '4o trimestre'],
  AMPMS: ['m.', 'p.'],
  DATEFORMATS: ['EEEE d MMMM y', 'dd MMMM y', 'dd/MMM/y', 'dd/MM/yy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale iw.
 */
goog.i18n.DateTimeSymbols_iw = {
  ERAS: ['לפנה״ס', 'לסה״נ'],
  ERANAMES: ['לפני הספירה', 'לספירה'],
  NARROWMONTHS: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  STANDALONENARROWMONTHS: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
      '11', '12'],
  MONTHS: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי',
      'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר',
      'נובמבר', 'דצמבר'],
  STANDALONEMONTHS: ['ינואר', 'פברואר', 'מרץ', 'אפריל',
      'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר',
      'אוקטובר', 'נובמבר', 'דצמבר'],
  SHORTMONTHS: ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ',
      'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'],
  STANDALONESHORTMONTHS: ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳',
      'מאי', 'יונ׳', 'יול׳', 'אוג׳', 'ספט׳', 'אוק׳',
      'נוב׳', 'דצמ׳'],
  WEEKDAYS: ['יום ראשון', 'יום שני', 'יום שלישי',
      'יום רביעי', 'יום חמישי', 'יום שישי',
      'יום שבת'],
  STANDALONEWEEKDAYS: ['יום ראשון', 'יום שני',
      'יום שלישי', 'יום רביעי', 'יום חמישי',
      'יום שישי', 'יום שבת'],
  SHORTWEEKDAYS: ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳',
      'יום ה׳', 'יום ו׳', 'שבת'],
  STANDALONESHORTWEEKDAYS: ['יום א׳', 'יום ב׳', 'יום ג׳',
      'יום ד׳', 'יום ה׳', 'יום ו׳', 'שבת'],
  NARROWWEEKDAYS: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
  STANDALONENARROWWEEKDAYS: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
  SHORTQUARTERS: ['רבעון 1', 'רבעון 2', 'רבעון 3',
      'רבעון 4'],
  QUARTERS: ['רבעון 1', 'רבעון 2', 'רבעון 3', 'רבעון 4'],
  AMPMS: ['לפנה״צ', 'אחה״צ'],
  DATEFORMATS: ['EEEE, d בMMMM y', 'd בMMMM y', 'd בMMM yyyy', 'dd/MM/yy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [4, 5],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale ja.
 */
goog.i18n.DateTimeSymbols_ja = {
  ERAS: ['紀元前', '西暦'],
  ERANAMES: ['紀元前', '西暦'],
  NARROWMONTHS: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  STANDALONENARROWMONTHS: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
      '11', '12'],
  MONTHS: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月',
      '9月', '10月', '11月', '12月'],
  STANDALONEMONTHS: ['1月', '2月', '3月', '4月', '5月', '6月', '7月',
      '8月', '9月', '10月', '11月', '12月'],
  SHORTMONTHS: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月',
      '9月', '10月', '11月', '12月'],
  STANDALONESHORTMONTHS: ['1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'],
  WEEKDAYS: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日',
      '金曜日', '土曜日'],
  STANDALONEWEEKDAYS: ['日曜日', '月曜日', '火曜日', '水曜日',
      '木曜日', '金曜日', '土曜日'],
  SHORTWEEKDAYS: ['日', '月', '火', '水', '木', '金', '土'],
  STANDALONESHORTWEEKDAYS: ['日', '月', '火', '水', '木', '金', '土'],
  NARROWWEEKDAYS: ['日', '月', '火', '水', '木', '金', '土'],
  STANDALONENARROWWEEKDAYS: ['日', '月', '火', '水', '木', '金', '土'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['第1四半期', '第2四半期', '第3四半期',
      '第4四半期'],
  AMPMS: ['午前', '午後'],
  DATEFORMATS: ['y年M月d日EEEE', 'y年M月d日', 'yyyy/MM/dd', 'yyyy/MM/dd'],
  TIMEFORMATS: ['H時mm分ss秒 zzzz', 'H:mm:ss z', 'H:mm:ss', 'H:mm'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale kn.
 */
goog.i18n.DateTimeSymbols_kn = {
  ERAS: ['ಕ್ರಿ.ಪೂ', 'ಜಾಹೀ'],
  ERANAMES: ['ಈಸಪೂವ೯.', 'ಕ್ರಿಸ್ತ ಶಕ'],
  NARROWMONTHS: ['ಜ', 'ಫೆ', 'ಮಾ', 'ಎ', 'ಮೇ', 'ಜೂ', 'ಜು',
      'ಆ', 'ಸೆ', 'ಅ', 'ನ', 'ಡಿ'],
  STANDALONENARROWMONTHS: ['ಜ', 'ಫೆ', 'ಮಾ', 'ಎ', 'ಮೇ', 'ಜೂ',
      'ಜು', 'ಆ', 'ಸೆ', 'ಅ', 'ನ', 'ಡಿ'],
  MONTHS: ['ಜನವರೀ', 'ಫೆಬ್ರವರೀ', 'ಮಾರ್ಚ್',
      'ಎಪ್ರಿಲ್', 'ಮೆ', 'ಜೂನ್', 'ಜುಲೈ',
      'ಆಗಸ್ಟ್', 'ಸಪ್ಟೆಂಬರ್',
      'ಅಕ್ಟೋಬರ್', 'ನವೆಂಬರ್',
      'ಡಿಸೆಂಬರ್'],
  STANDALONEMONTHS: ['ಜನವರೀ', 'ಫೆಬ್ರವರೀ',
      'ಮಾರ್ಚ್', 'ಎಪ್ರಿಲ್', 'ಮೆ', 'ಜೂನ್',
      'ಜುಲೈ', 'ಆಗಸ್ಟ್', 'ಸಪ್ಟೆಂಬರ್',
      'ಅಕ್ಟೋಬರ್', 'ನವೆಂಬರ್',
      'ಡಿಸೆಂಬರ್'],
  SHORTMONTHS: ['ಜನವರೀ', 'ಫೆಬ್ರವರೀ',
      'ಮಾರ್ಚ್', 'ಎಪ್ರಿಲ್', 'ಮೆ', 'ಜೂನ್',
      'ಜುಲೈ', 'ಆಗಸ್ಟ್', 'ಸಪ್ಟೆಂಬರ್',
      'ಅಕ್ಟೋಬರ್', 'ನವೆಂಬರ್',
      'ಡಿಸೆಂಬರ್'],
  STANDALONESHORTMONTHS: ['ಜನವರೀ', 'ಫೆಬ್ರವರೀ',
      'ಮಾರ್ಚ್', 'ಎಪ್ರಿಲ್', 'ಮೆ', 'ಜೂನ್',
      'ಜುಲೈ', 'ಆಗಸ್ಟ್', 'ಸಪ್ಟೆಂಬರ್',
      'ಅಕ್ಟೋಬರ್', 'ನವೆಂಬರ್',
      'ಡಿಸೆಂಬರ್'],
  WEEKDAYS: ['ರವಿವಾರ', 'ಸೋಮವಾರ',
      'ಮಂಗಳವಾರ', 'ಬುಧವಾರ', 'ಗುರುವಾರ',
      'ಶುಕ್ರವಾರ', 'ಶನಿವಾರ'],
  STANDALONEWEEKDAYS: ['ರವಿವಾರ', 'ಸೋಮವಾರ',
      'ಮಂಗಳವಾರ', 'ಬುಧವಾರ', 'ಗುರುವಾರ',
      'ಶುಕ್ರವಾರ', 'ಶನಿವಾರ'],
  SHORTWEEKDAYS: ['ರ.', 'ಸೋ.', 'ಮಂ.', 'ಬು.', 'ಗು.', 'ಶು.',
      'ಶನಿ.'],
  STANDALONESHORTWEEKDAYS: ['ರ.', 'ಸೋ.', 'ಮಂ.', 'ಬು.', 'ಗು.',
      'ಶು.', 'ಶನಿ.'],
  NARROWWEEKDAYS: ['ರ', 'ಸೋ', 'ಮಂ', 'ಬು', 'ಗು', 'ಶು',
      'ಶ'],
  STANDALONENARROWWEEKDAYS: ['ರ', 'ಸೋ', 'ಮಂ', 'ಬು', 'ಗು',
      'ಶು', 'ಶ'],
  SHORTQUARTERS: ['ಒಂದು 1', 'ಎರಡು 2', 'ಮೂರು 3',
      'ನಾಲೃಕ 4'],
  QUARTERS: ['ಒಂದು 1', 'ಎರಡು 2', 'ಮೂರು 3',
      'ನಾಲೃಕ 4'],
  AMPMS: ['am', 'pm'],
  DATEFORMATS: ['EEEE d MMMM y', 'd MMMM y', 'd MMM y', 'd-M-yy'],
  TIMEFORMATS: ['hh:mm:ss a zzzz', 'hh:mm:ss a z', 'hh:mm:ss a', 'hh:mm a'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [6, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale ko.
 */
goog.i18n.DateTimeSymbols_ko = {
  ERAS: ['기원전', '서기'],
  ERANAMES: ['서력기원전', '서력기원'],
  NARROWMONTHS: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월',
      '9월', '10월', '11월', '12월'],
  STANDALONENARROWMONTHS: ['1월', '2월', '3월', '4월', '5월', '6월',
      '7월', '8월', '9월', '10월', '11월', '12월'],
  MONTHS: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월',
      '9월', '10월', '11월', '12월'],
  STANDALONEMONTHS: ['1월', '2월', '3월', '4월', '5월', '6월', '7월',
      '8월', '9월', '10월', '11월', '12월'],
  SHORTMONTHS: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월',
      '9월', '10월', '11월', '12월'],
  STANDALONESHORTMONTHS: ['1월', '2월', '3월', '4월', '5월', '6월',
      '7월', '8월', '9월', '10월', '11월', '12월'],
  WEEKDAYS: ['일요일', '월요일', '화요일', '수요일', '목요일',
      '금요일', '토요일'],
  STANDALONEWEEKDAYS: ['일요일', '월요일', '화요일', '수요일',
      '목요일', '금요일', '토요일'],
  SHORTWEEKDAYS: ['일', '월', '화', '수', '목', '금', '토'],
  STANDALONESHORTWEEKDAYS: ['일', '월', '화', '수', '목', '금', '토'],
  NARROWWEEKDAYS: ['일', '월', '화', '수', '목', '금', '토'],
  STANDALONENARROWWEEKDAYS: ['일', '월', '화', '수', '목', '금', '토'],
  SHORTQUARTERS: ['1분기', '2분기', '3분기', '4분기'],
  QUARTERS: ['제 1/4분기', '제 2/4분기', '제 3/4분기',
      '제 4/4분기'],
  AMPMS: ['오전', '오후'],
  DATEFORMATS: ['y년 M월 d일 EEEE', 'y년 M월 d일', 'yyyy. M. d.',
      'yy. M. d.'],
  TIMEFORMATS: ['a h시 m분 s초 zzzz', 'a h시 m분 s초 z', 'a h:mm:ss',
      'a h:mm'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale ln.
 */
goog.i18n.DateTimeSymbols_ln = {
  ERAS: ['libóso ya', 'nsima ya Y'],
  ERANAMES: ['Yambo ya Yézu Krís', 'Nsima ya Yézu Krís'],
  NARROWMONTHS: ['y', 'f', 'm', 'a', 'm', 'y', 'y', 'a', 's', 'ɔ', 'n', 'd'],
  STANDALONENARROWMONTHS: ['y', 'f', 'm', 'a', 'm', 'y', 'y', 'a', 's', 'ɔ',
      'n', 'd'],
  MONTHS: ['sánzá ya yambo', 'sánzá ya míbalé', 'sánzá ya mísáto',
      'sánzá ya mínei', 'sánzá ya mítáno', 'sánzá ya motóbá',
      'sánzá ya nsambo', 'sánzá ya mwambe', 'sánzá ya libwa',
      'sánzá ya zómi', 'sánzá ya zómi na mɔ̌kɔ́',
      'sánzá ya zómi na míbalé'],
  STANDALONEMONTHS: ['sánzá ya yambo', 'sánzá ya míbalé',
      'sánzá ya mísáto', 'sánzá ya mínei', 'sánzá ya mítáno',
      'sánzá ya motóbá', 'sánzá ya nsambo', 'sánzá ya mwambe',
      'sánzá ya libwa', 'sánzá ya zómi', 'sánzá ya zómi na mɔ̌kɔ́',
      'sánzá ya zómi na míbalé'],
  SHORTMONTHS: ['yan', 'fbl', 'msi', 'apl', 'mai', 'yun', 'yul', 'agt', 'stb',
      'ɔtb', 'nvb', 'dsb'],
  STANDALONESHORTMONTHS: ['yan', 'fbl', 'msi', 'apl', 'mai', 'yun', 'yul',
      'agt', 'stb', 'ɔtb', 'nvb', 'dsb'],
  WEEKDAYS: ['eyenga', 'mokɔlɔ mwa yambo', 'mokɔlɔ mwa míbalé',
      'mokɔlɔ mwa mísáto', 'mokɔlɔ ya mínéi', 'mokɔlɔ ya mítáno',
      'mpɔ́sɔ'],
  STANDALONEWEEKDAYS: ['eyenga', 'mokɔlɔ mwa yambo', 'mokɔlɔ mwa míbalé',
      'mokɔlɔ mwa mísáto', 'mokɔlɔ ya mínéi', 'mokɔlɔ ya mítáno',
      'mpɔ́sɔ'],
  SHORTWEEKDAYS: ['eye', 'ybo', 'mbl', 'mst', 'min', 'mtn', 'mps'],
  STANDALONESHORTWEEKDAYS: ['eye', 'ybo', 'mbl', 'mst', 'min', 'mtn', 'mps'],
  NARROWWEEKDAYS: ['e', 'y', 'm', 'm', 'm', 'm', 'p'],
  STANDALONENARROWWEEKDAYS: ['e', 'y', 'm', 'm', 'm', 'm', 'p'],
  SHORTQUARTERS: ['SM1', 'SM2', 'SM3', 'SM4'],
  QUARTERS: ['sánzá mísáto ya yambo', 'sánzá mísáto ya míbalé',
      'sánzá mísáto ya mísáto', 'sánzá mísáto ya mínei'],
  AMPMS: ['ntɔ́ngɔ́', 'mpókwa'],
  DATEFORMATS: ['EEEE d MMMM y', 'd MMMM y', 'd MMM y', 'd/M/yyyy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 6
};


/**
 * Date/time formatting symbols for locale lt.
 */
goog.i18n.DateTimeSymbols_lt = {
  ERAS: ['pr. Kr.', 'po Kr.'],
  ERANAMES: ['prieš Kristų', 'po Kristaus'],
  NARROWMONTHS: ['S', 'V', 'K', 'B', 'G', 'B', 'L', 'R', 'R', 'S', 'L', 'G'],
  STANDALONENARROWMONTHS: ['S', 'V', 'K', 'B', 'G', 'B', 'L', 'R', 'R', 'S',
      'L', 'G'],
  MONTHS: ['sausio', 'vasaris', 'kovas', 'balandis', 'gegužė', 'birželis',
      'liepa', 'rugpjūtis', 'rugsėjis', 'spalis', 'lapkritis', 'gruodis'],
  STANDALONEMONTHS: ['Sausis', 'Vasaris', 'Kovas', 'Balandis', 'Gegužė',
      'Birželis', 'Liepa', 'Rugpjūtis', 'Rugsėjis', 'Spalis', 'Lapkritis',
      'Gruodis'],
  SHORTMONTHS: ['Saus.', 'Vas', 'Kov.', 'Bal.', 'Geg.', 'Bir.', 'Liep.',
      'Rugp.', 'Rugs.', 'Spal.', 'Lapkr.', 'Gruod.'],
  STANDALONESHORTMONTHS: ['Saus.', 'Vas.', 'Kov.', 'Bal.', 'Geg.', 'Bir.',
      'Liep.', 'Rugp.', 'Rugs.', 'Spal.', 'Lapkr.', 'Gruod.'],
  WEEKDAYS: ['sekmadienis', 'pirmadienis', 'antradienis', 'trečiadienis',
      'ketvirtadienis', 'penktadienis', 'šeštadienis'],
  STANDALONEWEEKDAYS: ['sekmadienis', 'pirmadienis', 'antradienis',
      'trečiadienis', 'ketvirtadienis', 'penktadienis', 'šeštadienis'],
  SHORTWEEKDAYS: ['Sk', 'Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št'],
  STANDALONESHORTWEEKDAYS: ['Sk', 'Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št'],
  NARROWWEEKDAYS: ['S', 'P', 'A', 'T', 'K', 'P', 'Š'],
  STANDALONENARROWWEEKDAYS: ['S', 'P', 'A', 'T', 'K', 'P', 'Š'],
  SHORTQUARTERS: ['I k.', 'II k.', 'III k.', 'IV ketv.'],
  QUARTERS: ['I ketvirtis', 'II ketvirtis', 'III ketvirtis', 'IV ketvirtis'],
  AMPMS: ['priešpiet', 'popiet'],
  DATEFORMATS: ['y \'m\'. MMMM d \'d\'., EEEE', 'y \'m\'. MMMM d \'d\'.',
      'y MMM d', 'yyyy-MM-dd'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale lv.
 */
goog.i18n.DateTimeSymbols_lv = {
  ERAS: ['p.m.ē.', 'm.ē.'],
  ERANAMES: ['pirms mūsu ēras', 'mūsu ērā'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['janvāris', 'februāris', 'marts', 'aprīlis', 'maijs', 'jūnijs',
      'jūlijs', 'augusts', 'septembris', 'oktobris', 'novembris', 'decembris'],
  STANDALONEMONTHS: ['janvāris', 'februāris', 'marts', 'aprīlis', 'maijs',
      'jūnijs', 'jūlijs', 'augusts', 'septembris', 'oktobris', 'novembris',
      'decembris'],
  SHORTMONTHS: ['janv.', 'febr.', 'marts', 'apr.', 'maijs', 'jūn.', 'jūl.',
      'aug.', 'sept.', 'okt.', 'nov.', 'dec.'],
  STANDALONESHORTMONTHS: ['janv.', 'febr.', 'marts', 'apr.', 'maijs', 'jūn.',
      'jūl.', 'aug.', 'sept.', 'okt.', 'nov.', 'dec.'],
  WEEKDAYS: ['svētdiena', 'pirmdiena', 'otrdiena', 'trešdiena', 'ceturtdiena',
      'piektdiena', 'sestdiena'],
  STANDALONEWEEKDAYS: ['svētdiena', 'pirmdiena', 'otrdiena', 'trešdiena',
      'ceturtdiena', 'piektdiena', 'sestdiena'],
  SHORTWEEKDAYS: ['Sv', 'Pr', 'Ot', 'Tr', 'Ce', 'Pk', 'Se'],
  STANDALONESHORTWEEKDAYS: ['Sv', 'Pr', 'Ot', 'Tr', 'Ce', 'Pk', 'Se'],
  NARROWWEEKDAYS: ['S', 'P', 'O', 'T', 'C', 'P', 'S'],
  STANDALONENARROWWEEKDAYS: ['S', 'P', 'O', 'T', 'C', 'P', 'S'],
  SHORTQUARTERS: ['C1', 'C2', 'C3', 'C4'],
  QUARTERS: ['1. ceturksnis', '2. ceturksnis', '3. ceturksnis',
      '4. ceturksnis'],
  AMPMS: ['priekšpusdienā', 'pēcpusdienā'],
  DATEFORMATS: ['EEEE, y. \'gada\' d. MMMM', 'y. \'gada\' d. MMMM',
      'y. \'gada\' d. MMM', 'dd.MM.yy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 6
};


/**
 * Date/time formatting symbols for locale ml.
 */
goog.i18n.DateTimeSymbols_ml = {
  ERAS: ['ക്രി.മൂ', 'ക്രി.പി.'],
  ERANAMES: ['ക്രിസ്തുവിനു് മുമ്പ്‌',
      'ക്രിസ്തുവിന് പിന്‍പ്'],
  NARROWMONTHS: ['ജ', 'ഫെ', 'മാ', 'ഏ', 'മേ', 'ജൂ', 'ജൂ',
      'ഓ', 'സെ', 'ഒ', 'ന', 'ഡി'],
  STANDALONENARROWMONTHS: ['ജ', 'ഫെ', 'മാ', 'ഏ', 'മേ', 'ജൂ',
      'ജൂ', 'ഓ', 'സെ', 'ഒ', 'ന', 'ഡി'],
  MONTHS: ['ജനുവരി', 'ഫെബ്രുവരി',
      'മാര്‍ച്ച്', 'ഏപ്രില്‍', 'മേയ്',
      'ജൂണ്‍', 'ജൂലൈ', 'ആഗസ്റ്റ്',
      'സെപ്റ്റംബര്‍', 'ഒക്ടോബര്‍',
      'നവംബര്‍', 'ഡിസംബര്‍'],
  STANDALONEMONTHS: ['ജനുവരി', 'ഫെബ്രുവരി',
      'മാര്‍ച്ച്', 'ഏപ്രില്‍', 'മേയ്',
      'ജൂണ്‍', 'ജൂലൈ', 'ആഗസ്റ്റ്',
      'സെപ്റ്റംബര്‍', 'ഒക്ടോബര്‍',
      'നവംബര്‍', 'ഡിസംബര്‍'],
  SHORTMONTHS: ['ജനു', 'ഫെബ്രു', 'മാര്‍',
      'ഏപ്രി', 'മേയ്', 'ജൂണ്‍', 'ജൂലൈ',
      'ഓഗ', 'സെപ്റ്റം', 'ഒക്ടോ', 'നവം',
      'ഡിസം'],
  STANDALONESHORTMONTHS: ['ജനു', 'ഫെബ്രു', 'മാര്‍',
      'ഏപ്രി', 'മേയ്', 'ജൂണ്‍', 'ജൂലൈ',
      'ഓഗ', 'സെപ്റ്റം', 'ഒക്ടോ', 'നവം',
      'ഡിസം'],
  WEEKDAYS: ['ഞായറാഴ്ച', 'തിങ്കളാഴ്ച',
      'ചൊവ്വാഴ്ച', 'ബുധനാഴ്ച',
      'വ്യാഴാഴ്ച', 'വെള്ളിയാഴ്ച',
      'ശനിയാഴ്ച'],
  STANDALONEWEEKDAYS: ['ഞായറാഴ്ച',
      'തിങ്കളാഴ്ച', 'ചൊവ്വാഴ്ച',
      'ബുധനാഴ്ച', 'വ്യാഴാഴ്ച',
      'വെള്ളിയാഴ്ച', 'ശനിയാഴ്ച'],
  SHORTWEEKDAYS: ['ഞായര്‍', 'തിങ്കള്‍',
      'ചൊവ്വ', 'ബുധന്‍', 'വ്യാഴം',
      'വെള്ളി', 'ശനി'],
  STANDALONESHORTWEEKDAYS: ['ഞായര്‍', 'തിങ്കള്‍',
      'ചൊവ്വ', 'ബുധന്‍', 'വ്യാഴം',
      'വെള്ളി', 'ശനി'],
  NARROWWEEKDAYS: ['ഞാ', 'തി', 'ചൊ', 'ബു', 'വ്യാ',
      'വെ', 'ശ'],
  STANDALONENARROWWEEKDAYS: ['ഞാ', 'തി', 'ചൊ', 'ബു',
      'വ്യാ', 'വെ', 'ശ'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['ഒന്നാം പാദം',
      'രണ്ടാം പാദം', 'മൂന്നാം പാദം',
      'നാലാം പാദം'],
  AMPMS: ['am', 'pm'],
  DATEFORMATS: ['y, MMMM d, EEEE', 'y, MMMM d', 'y, MMM d', 'dd/MM/yy'],
  TIMEFORMATS: ['h:mm:ss a zzzz', 'h:mm:ss a z', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [6, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale mr.
 */
goog.i18n.DateTimeSymbols_mr = {
  ERAS: ['ईसापूर्व', 'सन'],
  ERANAMES: ['ईसवीसनपूर्व', 'ईसवीसन'],
  NARROWMONTHS: ['जा', 'फे', 'मा', 'ए', 'मे', 'जू',
      'जु', 'ऑ', 'स', 'ऑ', 'नो', 'डि'],
  STANDALONENARROWMONTHS: ['जा', 'फे', 'मा', 'ए', 'मे',
      'जू', 'जु', 'ऑ', 'स', 'ऑ', 'नो', 'डि'],
  MONTHS: ['जानेवारी', 'फेब्रुवारी',
      'मार्च', 'एप्रिल', 'मे', 'जून',
      'जुलै', 'ऑगस्ट', 'सप्टेंबर',
      'ऑक्टोबर', 'नोव्हेंबर',
      'डिसेंबर'],
  STANDALONEMONTHS: ['जानेवारी',
      'फेब्रुवारी', 'मार्च', 'एप्रिल',
      'मे', 'जून', 'जुलै', 'ऑगस्ट',
      'सप्टेंबर', 'ऑक्टोबर',
      'नोव्हेंबर', 'डिसेंबर'],
  SHORTMONTHS: ['जाने', 'फेब्रु', 'मार्च',
      'एप्रि', 'मे', 'जून', 'जुलै', 'ऑग',
      'सेप्टें', 'ऑक्टोबर', 'नोव्हें',
      'डिसें'],
  STANDALONESHORTMONTHS: ['जाने', 'फेब्रु',
      'मार्च', 'एप्रि', 'मे', 'जून',
      'जुलै', 'ऑग', 'सेप्टें',
      'ऑक्टोबर', 'नोव्हें', 'डिसें'],
  WEEKDAYS: ['रविवार', 'सोमवार',
      'मंगळवार', 'बुधवार', 'गुरुवार',
      'शुक्रवार', 'शनिवार'],
  STANDALONEWEEKDAYS: ['रविवार', 'सोमवार',
      'मंगळवार', 'बुधवार', 'गुरुवार',
      'शुक्रवार', 'शनिवार'],
  SHORTWEEKDAYS: ['रवि', 'सोम', 'मंगळ', 'बुध',
      'गुरु', 'शुक्र', 'शनि'],
  STANDALONESHORTWEEKDAYS: ['रवि', 'सोम', 'मंगळ',
      'बुध', 'गुरु', 'शुक्र', 'शनि'],
  NARROWWEEKDAYS: ['र', 'सो', 'मं', 'बु', 'गु', 'शु',
      'श'],
  STANDALONENARROWWEEKDAYS: ['र', 'सो', 'मं', 'बु', 'गु',
      'शु', 'श'],
  SHORTQUARTERS: ['ति 1', '2 री तिमाही', 'ति 3',
      'ति 4'],
  QUARTERS: ['प्रथम तिमाही',
      'द्वितीय तिमाही',
      'तृतीय तिमाही',
      'चतुर्थ तिमाही'],
  AMPMS: ['am', 'pm'],
  DATEFORMATS: ['EEEE d MMMM y', 'd MMMM y', 'd MMM y', 'd-M-yy'],
  TIMEFORMATS: ['h-mm-ss a zzzz', 'h-mm-ss a z', 'h-mm-ss a', 'h-mm a'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [6, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale ms.
 */
goog.i18n.DateTimeSymbols_ms = {
  ERAS: ['S.M.', 'TM'],
  ERANAMES: ['S.M.', 'TM'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'O', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'O', 'S', 'O',
      'N', 'D'],
  MONTHS: ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos',
      'September', 'Oktober', 'November', 'Disember'],
  STANDALONEMONTHS: ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
      'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'],
  SHORTMONTHS: ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep',
      'Okt', 'Nov', 'Dis'],
  STANDALONESHORTMONTHS: ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul',
      'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'],
  WEEKDAYS: ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'],
  STANDALONEWEEKDAYS: ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat',
      'Sabtu'],
  SHORTWEEKDAYS: ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'],
  STANDALONESHORTWEEKDAYS: ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'],
  NARROWWEEKDAYS: ['A', 'I', 'S', 'R', 'K', 'J', 'S'],
  STANDALONENARROWWEEKDAYS: ['A', 'I', 'S', 'R', 'K', 'J', 'S'],
  SHORTQUARTERS: ['Suku 1', 'Suku Ke-2', 'Suku Ke-3', 'Suku Ke-4'],
  QUARTERS: ['Suku pertama', 'Suku Ke-2', 'Suku Ke-3', 'Suku Ke-4'],
  AMPMS: ['PG', 'PTG'],
  DATEFORMATS: ['EEEE, d MMMM y', 'd MMMM y', 'dd/MM/yyyy', 'd/MM/yy'],
  TIMEFORMATS: ['h:mm:ss a zzzz', 'h:mm:ss a z', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 6
};


/**
 * Date/time formatting symbols for locale mt.
 */
goog.i18n.DateTimeSymbols_mt = {
  ERAS: ['QK', 'WK'],
  ERANAMES: ['Qabel Kristu', 'Wara Kristu'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'Ġ', 'L', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'Ġ', 'L', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['Jannar', 'Frar', 'Marzu', 'April', 'Mejju', 'Ġunju', 'Lulju',
      'Awwissu', 'Settembru', 'Ottubru', 'Novembru', 'Diċembru'],
  STANDALONEMONTHS: ['Jannar', 'Frar', 'Marzu', 'April', 'Mejju', 'Ġunju',
      'Lulju', 'Awwissu', 'Settembru', 'Ottubru', 'Novembru', 'Diċembru'],
  SHORTMONTHS: ['Jan', 'Fra', 'Mar', 'Apr', 'Mej', 'Ġun', 'Lul', 'Aww', 'Set',
      'Ott', 'Nov', 'Diċ'],
  STANDALONESHORTMONTHS: ['Jan', 'Fra', 'Mar', 'Apr', 'Mej', 'Ġun', 'Lul',
      'Aww', 'Set', 'Ott', 'Nov', 'Diċ'],
  WEEKDAYS: ['Il-Ħadd', 'It-Tnejn', 'It-Tlieta', 'L-Erbgħa', 'Il-Ħamis',
      'Il-Ġimgħa', 'Is-Sibt'],
  STANDALONEWEEKDAYS: ['Il-Ħadd', 'It-Tnejn', 'It-Tlieta', 'L-Erbgħa',
      'Il-Ħamis', 'Il-Ġimgħa', 'Is-Sibt'],
  SHORTWEEKDAYS: ['Ħad', 'Tne', 'Tli', 'Erb', 'Ħam', 'Ġim', 'Sib'],
  STANDALONESHORTWEEKDAYS: ['Ħad', 'Tne', 'Tli', 'Erb', 'Ħam', 'Ġim', 'Sib'],
  NARROWWEEKDAYS: ['Ħ', 'T', 'T', 'E', 'Ħ', 'Ġ', 'S'],
  STANDALONENARROWWEEKDAYS: ['Ħ', 'T', 'T', 'E', 'Ħ', 'Ġ', 'S'],
  SHORTQUARTERS: ['K1', 'K2', 'K3', 'K4'],
  QUARTERS: ['K1', 'K2', 'K3', 'K4'],
  AMPMS: ['QN', 'WN'],
  DATEFORMATS: ['EEEE, d \'ta\'’ MMMM y', 'd \'ta\'’ MMMM y', 'dd MMM y',
      'dd/MM/yyyy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale nl.
 */
goog.i18n.DateTimeSymbols_nl = {
  ERAS: ['v. Chr.', 'n. Chr.'],
  ERANAMES: ['Voor Christus', 'na Christus'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli',
      'augustus', 'september', 'oktober', 'november', 'december'],
  STANDALONEMONTHS: ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
      'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
  SHORTMONTHS: ['jan.', 'feb.', 'mrt.', 'apr.', 'mei', 'jun.', 'jul.', 'aug.',
      'sep.', 'okt.', 'nov.', 'dec.'],
  STANDALONESHORTMONTHS: ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul',
      'aug', 'sep', 'okt', 'nov', 'dec'],
  WEEKDAYS: ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag',
      'zaterdag'],
  STANDALONEWEEKDAYS: ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag',
      'vrijdag', 'zaterdag'],
  SHORTWEEKDAYS: ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'],
  STANDALONESHORTWEEKDAYS: ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'],
  NARROWWEEKDAYS: ['Z', 'M', 'D', 'W', 'D', 'V', 'Z'],
  STANDALONENARROWWEEKDAYS: ['Z', 'M', 'D', 'W', 'D', 'V', 'Z'],
  SHORTQUARTERS: ['K1', 'K2', 'K3', 'K4'],
  QUARTERS: ['1e kwartaal', '2e kwartaal', '3e kwartaal', '4e kwartaal'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE d MMMM y', 'd MMMM y', 'd MMM y', 'dd-MM-yy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale no.
 */
goog.i18n.DateTimeSymbols_no = {
  ERAS: ['f.Kr.', 'e.Kr.'],
  ERANAMES: ['f.Kr.', 'e.Kr.'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli',
      'august', 'september', 'oktober', 'november', 'desember'],
  STANDALONEMONTHS: ['januar', 'februar', 'mars', 'april', 'mai', 'juni',
      'juli', 'august', 'september', 'oktober', 'november', 'desember'],
  SHORTMONTHS: ['jan.', 'feb.', 'mars', 'apr.', 'mai', 'juni', 'juli', 'aug.',
      'sep.', 'okt.', 'nov.', 'des.'],
  STANDALONESHORTMONTHS: ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul',
      'aug', 'sep', 'okt', 'nov', 'des'],
  WEEKDAYS: ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag',
      'lørdag'],
  STANDALONEWEEKDAYS: ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag',
      'fredag', 'lørdag'],
  SHORTWEEKDAYS: ['søn.', 'man.', 'tir.', 'ons.', 'tor.', 'fre.', 'lør.'],
  STANDALONESHORTWEEKDAYS: ['sø.', 'ma.', 'ti.', 'on.', 'to.', 'fr.', 'lø.'],
  NARROWWEEKDAYS: ['S', 'M', 'T', 'O', 'T', 'F', 'L'],
  STANDALONENARROWWEEKDAYS: ['S', 'M', 'T', 'O', 'T', 'F', 'L'],
  SHORTQUARTERS: ['K1', 'K2', 'K3', 'K4'],
  QUARTERS: ['1. kvartal', '2. kvartal', '3. kvartal', '4. kvartal'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE d. MMMM y', 'd. MMMM y', 'd. MMM y', 'dd.MM.yy'],
  TIMEFORMATS: ['\'kl\'. HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale or.
 */
goog.i18n.DateTimeSymbols_or = {
  ERAS: ['BCE', 'CE'],
  ERANAMES: ['BCE', 'CE'],
  NARROWMONTHS: ['ଜା', 'ଫେ', 'ମା', 'ଅ', 'ମେ', 'ଜୁ',
      'ଜୁ', 'ଅ', 'ସେ', 'ଅ', 'ନ', 'ଡି'],
  STANDALONENARROWMONTHS: ['ଜା', 'ଫେ', 'ମା', 'ଅ', 'ମେ',
      'ଜୁ', 'ଜୁ', 'ଅ', 'ସେ', 'ଅ', 'ନ', 'ଡି'],
  MONTHS: ['ଜାନୁଆରୀ', 'ଫେବ୍ରୁୟାରୀ',
      'ମାର୍ଚ୍ଚ', 'ଅପ୍ରେଲ', 'ମେ', 'ଜୁନ',
      'ଜୁଲାଇ', 'ଅଗଷ୍ଟ', 'ସେପ୍ଟେମ୍ବର',
      'ଅକ୍ଟୋବର', 'ନଭେମ୍ବର',
      'ଡିସେମ୍ବର'],
  STANDALONEMONTHS: ['ଜାନୁଆରୀ', 'ଫେବ୍ରୁୟାରୀ',
      'ମାର୍ଚ୍ଚ', 'ଅପ୍ରେଲ', 'ମେ', 'ଜୁନ',
      'ଜୁଲାଇ', 'ଅଗଷ୍ଟ', 'ସେପ୍ଟେମ୍ବର',
      'ଅକ୍ଟୋବର', 'ନଭେମ୍ବର',
      'ଡିସେମ୍ବର'],
  SHORTMONTHS: ['ଜାନୁଆରୀ', 'ଫେବ୍ରୁୟାରୀ',
      'ମାର୍ଚ୍ଚ', 'ଅପ୍ରେଲ', 'ମେ', 'ଜୁନ',
      'ଜୁଲାଇ', 'ଅଗଷ୍ଟ', 'ସେପ୍ଟେମ୍ବର',
      'ଅକ୍ଟୋବର', 'ନଭେମ୍ବର',
      'ଡିସେମ୍ବର'],
  STANDALONESHORTMONTHS: ['ଜାନୁଆରୀ',
      'ଫେବ୍ରୁୟାରୀ', 'ମାର୍ଚ୍ଚ',
      'ଅପ୍ରେଲ', 'ମେ', 'ଜୁନ', 'ଜୁଲାଇ',
      'ଅଗଷ୍ଟ', 'ସେପ୍ଟେମ୍ବର',
      'ଅକ୍ଟୋବର', 'ନଭେମ୍ବର',
      'ଡିସେମ୍ବର'],
  WEEKDAYS: ['ରବିବାର', 'ସୋମବାର',
      'ମଙ୍ଗଳବାର', 'ବୁଧବାର', 'ଗୁରୁବାର',
      'ଶୁକ୍ରବାର', 'ଶନିବାର'],
  STANDALONEWEEKDAYS: ['ରବିବାର', 'ସୋମବାର',
      'ମଙ୍ଗଳବାର', 'ବୁଧବାର', 'ଗୁରୁବାର',
      'ଶୁକ୍ରବାର', 'ଶନିବାର'],
  SHORTWEEKDAYS: ['ରବି', 'ସୋମ', 'ମଙ୍ଗଳ', 'ବୁଧ',
      'ଗୁରୁ', 'ଶୁକ୍ର', 'ଶନି'],
  STANDALONESHORTWEEKDAYS: ['ରବି', 'ସୋମ', 'ମଙ୍ଗଳ',
      'ବୁଧ', 'ଗୁରୁ', 'ଶୁକ୍ର', 'ଶନି'],
  NARROWWEEKDAYS: ['ର', 'ସୋ', 'ମ', 'ବୁ', 'ଗୁ', 'ଶୁ', 'ଶ'],
  STANDALONENARROWWEEKDAYS: ['ର', 'ସୋ', 'ମ', 'ବୁ', 'ଗୁ',
      'ଶୁ', 'ଶ'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  AMPMS: ['am', 'pm'],
  DATEFORMATS: ['EEEE, d MMMM y', 'd MMMM y', 'd MMM y', 'd-M-yy'],
  TIMEFORMATS: ['h:mm:ss a zzzz', 'h:mm:ss a z', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [6, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale pl.
 */
goog.i18n.DateTimeSymbols_pl = {
  ERAS: ['p.n.e.', 'n.e.'],
  ERANAMES: ['p.n.e.', 'n.e.'],
  NARROWMONTHS: ['s', 'l', 'm', 'k', 'm', 'c', 'l', 's', 'w', 'p', 'l', 'g'],
  STANDALONENARROWMONTHS: ['s', 'l', 'm', 'k', 'm', 'c', 'l', 's', 'w', 'p',
      'l', 'g'],
  MONTHS: ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
      'lipca', 'sierpnia', 'września', 'października', 'listopada',
      'grudnia'],
  STANDALONEMONTHS: ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj',
      'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik',
      'listopad', 'grudzień'],
  SHORTMONTHS: ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz',
      'paź', 'lis', 'gru'],
  STANDALONESHORTMONTHS: ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip',
      'sie', 'wrz', 'paź', 'lis', 'gru'],
  WEEKDAYS: ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek',
      'piątek', 'sobota'],
  STANDALONEWEEKDAYS: ['niedziela', 'poniedziałek', 'wtorek', 'środa',
      'czwartek', 'piątek', 'sobota'],
  SHORTWEEKDAYS: ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'],
  STANDALONESHORTWEEKDAYS: ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.',
      'sob.'],
  NARROWWEEKDAYS: ['N', 'P', 'W', 'Ś', 'C', 'P', 'S'],
  STANDALONENARROWWEEKDAYS: ['N', 'P', 'W', 'Ś', 'C', 'P', 'S'],
  SHORTQUARTERS: ['K1', 'K2', 'K3', 'K4'],
  QUARTERS: ['I kwartał', 'II kwartał', 'III kwartał', 'IV kwartał'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE, d MMMM y', 'd MMMM y', 'd MMM y', 'dd.MM.yyyy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale pt.
 */
goog.i18n.DateTimeSymbols_pt = {
  ERAS: ['a.C.', 'd.C.'],
  ERANAMES: ['Antes de Cristo', 'Ano do Senhor'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
      'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
  STANDALONEMONTHS: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
  SHORTMONTHS: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set',
      'out', 'nov', 'dez'],
  STANDALONESHORTMONTHS: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul',
      'ago', 'set', 'out', 'nov', 'dez'],
  WEEKDAYS: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
      'quinta-feira', 'sexta-feira', 'sábado'],
  STANDALONEWEEKDAYS: ['domingo', 'segunda-feira', 'terça-feira',
      'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'],
  SHORTWEEKDAYS: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
  STANDALONESHORTWEEKDAYS: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
  NARROWWEEKDAYS: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
  STANDALONENARROWWEEKDAYS: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
  SHORTQUARTERS: ['T1', 'T2', 'T3', 'T4'],
  QUARTERS: ['1º trimestre', '2º trimestre', '3º trimestre',
      '4º trimestre'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE, d \'de\' MMMM \'de\' y', 'd \'de\' MMMM \'de\' y',
      'dd/MM/yyyy', 'dd/MM/yy'],
  TIMEFORMATS: ['HH\'h\'mm\'min\'ss\'s\' zzzz', 'HH\'h\'mm\'min\'ss\'s\' z',
      'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale pt_BR.
 */
goog.i18n.DateTimeSymbols_pt_BR = goog.i18n.DateTimeSymbols_pt;


/**
 * Date/time formatting symbols for locale pt_PT.
 */
goog.i18n.DateTimeSymbols_pt_PT = {
  ERAS: ['a.C.', 'd.C.'],
  ERANAMES: ['Antes de Cristo', 'Ano do Senhor'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho',
      'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  STANDALONEMONTHS: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  SHORTMONTHS: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set',
      'Out', 'Nov', 'Dez'],
  STANDALONESHORTMONTHS: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul',
      'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  WEEKDAYS: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
      'Quinta-feira', 'Sexta-feira', 'Sábado'],
  STANDALONEWEEKDAYS: ['Domingo', 'Segunda-feira', 'Terça-feira',
      'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  SHORTWEEKDAYS: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
  STANDALONESHORTWEEKDAYS: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
  NARROWWEEKDAYS: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
  STANDALONENARROWWEEKDAYS: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
  SHORTQUARTERS: ['T1', 'T2', 'T3', 'T4'],
  QUARTERS: ['1.º trimestre', '2.º trimestre', '3.º trimestre',
      '4.º trimestre'],
  AMPMS: ['a.m.', 'p.m.'],
  DATEFORMATS: ['EEEE, d \'de\' MMMM \'de\' y', 'd \'de\' MMMM \'de\' y',
      'dd/MM/yyyy', 'dd/MM/yy'],
  TIMEFORMATS: ['H:mm:ss zzzz', 'H:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale ro.
 */
goog.i18n.DateTimeSymbols_ro = {
  ERAS: ['î.Hr.', 'd.Hr.'],
  ERANAMES: ['înainte de Hristos', 'după Hristos'],
  NARROWMONTHS: ['I', 'F', 'M', 'A', 'M', 'I', 'I', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['I', 'F', 'M', 'A', 'M', 'I', 'I', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
      'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'],
  STANDALONEMONTHS: ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai',
      'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie',
      'decembrie'],
  SHORTMONTHS: ['ian.', 'feb.', 'mar.', 'apr.', 'mai', 'iun.', 'iul.', 'aug.',
      'sept.', 'oct.', 'nov.', 'dec.'],
  STANDALONESHORTMONTHS: ['ian.', 'feb.', 'mar.', 'apr.', 'mai', 'iun.', 'iul.',
      'aug.', 'sept.', 'oct.', 'nov.', 'dec.'],
  WEEKDAYS: ['duminică', 'luni', 'marți', 'miercuri', 'joi', 'vineri',
      'sâmbătă'],
  STANDALONEWEEKDAYS: ['duminică', 'luni', 'marți', 'miercuri', 'joi',
      'vineri', 'sâmbătă'],
  SHORTWEEKDAYS: ['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'],
  STANDALONESHORTWEEKDAYS: ['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'],
  NARROWWEEKDAYS: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
  STANDALONENARROWWEEKDAYS: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
  SHORTQUARTERS: ['trim. I', 'trim. II', 'trim. III', 'trim. IV'],
  QUARTERS: ['trimestrul I', 'trimestrul al II-lea', 'trimestrul al III-lea',
      'trimestrul al IV-lea'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE, d MMMM y', 'd MMMM y', 'dd.MM.yyyy', 'dd.MM.yyyy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 6
};


/**
 * Date/time formatting symbols for locale ru.
 */
goog.i18n.DateTimeSymbols_ru = {
  ERAS: ['до н.э.', 'н.э.'],
  ERANAMES: ['до н.э.', 'н.э.'],
  NARROWMONTHS: ['Я', 'Ф', 'М', 'А', 'М', 'И', 'И', 'А', 'С', 'О',
      'Н', 'Д'],
  STANDALONENARROWMONTHS: ['Я', 'Ф', 'М', 'А', 'М', 'И', 'И', 'А', 'С',
      'О', 'Н', 'Д'],
  MONTHS: ['января', 'февраля', 'марта', 'апреля',
      'мая', 'июня', 'июля', 'августа', 'сентября',
      'октября', 'ноября', 'декабря'],
  STANDALONEMONTHS: ['Январь', 'Февраль', 'Март',
      'Апрель', 'Май', 'Июнь', 'Июль', 'Август',
      'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  SHORTMONTHS: ['янв.', 'февр.', 'марта', 'апр.', 'мая',
      'июня', 'июля', 'авг.', 'сент.', 'окт.', 'нояб.',
      'дек.'],
  STANDALONESHORTMONTHS: ['Янв.', 'Февр.', 'Март', 'Апр.',
      'Май', 'Июнь', 'Июль', 'Авг.', 'Сент.', 'Окт.',
      'Нояб.', 'Дек.'],
  WEEKDAYS: ['воскресенье', 'понедельник',
      'вторник', 'среда', 'четверг', 'пятница',
      'суббота'],
  STANDALONEWEEKDAYS: ['Воскресенье', 'Понедельник',
      'Вторник', 'Среда', 'Четверг', 'Пятница',
      'Суббота'],
  SHORTWEEKDAYS: ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'],
  STANDALONESHORTWEEKDAYS: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт',
      'Сб'],
  NARROWWEEKDAYS: ['В', 'Пн', 'Вт', 'С', 'Ч', 'П', 'С'],
  STANDALONENARROWWEEKDAYS: ['В', 'П', 'В', 'С', 'Ч', 'П', 'С'],
  SHORTQUARTERS: ['1-й кв.', '2-й кв.', '3-й кв.', '4-й кв.'],
  QUARTERS: ['1-й квартал', '2-й квартал',
      '3-й квартал', '4-й квартал'],
  AMPMS: ['до полудня', 'после полудня'],
  DATEFORMATS: ['EEEE, d MMMM y \'г\'.', 'd MMMM y \'г\'.', 'dd.MM.yyyy',
      'dd.MM.yy'],
  TIMEFORMATS: ['H:mm:ss zzzz', 'H:mm:ss z', 'H:mm:ss', 'H:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 6
};


/**
 * Date/time formatting symbols for locale sk.
 */
goog.i18n.DateTimeSymbols_sk = {
  ERAS: ['pred n.l.', 'n.l.'],
  ERANAMES: ['pred n.l.', 'n.l.'],
  NARROWMONTHS: ['j', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'],
  STANDALONENARROWMONTHS: ['j', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o',
      'n', 'd'],
  MONTHS: ['januára', 'februára', 'marca', 'apríla', 'mája', 'júna',
      'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra'],
  STANDALONEMONTHS: ['január', 'február', 'marec', 'apríl', 'máj', 'jún',
      'júl', 'august', 'september', 'október', 'november', 'december'],
  SHORTMONTHS: ['jan', 'feb', 'mar', 'apr', 'máj', 'jún', 'júl', 'aug',
      'sep', 'okt', 'nov', 'dec'],
  STANDALONESHORTMONTHS: ['jan', 'feb', 'mar', 'apr', 'máj', 'jún', 'júl',
      'aug', 'sep', 'okt', 'nov', 'dec'],
  WEEKDAYS: ['nedeľa', 'pondelok', 'utorok', 'streda', 'štvrtok', 'piatok',
      'sobota'],
  STANDALONEWEEKDAYS: ['nedeľa', 'pondelok', 'utorok', 'streda', 'štvrtok',
      'piatok', 'sobota'],
  SHORTWEEKDAYS: ['ne', 'po', 'ut', 'st', 'št', 'pi', 'so'],
  STANDALONESHORTWEEKDAYS: ['ne', 'po', 'ut', 'st', 'št', 'pi', 'so'],
  NARROWWEEKDAYS: ['N', 'P', 'U', 'S', 'Š', 'P', 'S'],
  STANDALONENARROWWEEKDAYS: ['N', 'P', 'U', 'S', 'Š', 'P', 'S'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['1. štvrťrok', '2. štvrťrok', '3. štvrťrok',
      '4. štvrťrok'],
  AMPMS: ['dopoludnia', 'popoludní'],
  DATEFORMATS: ['EEEE, d. MMMM y', 'd. MMMM y', 'd.M.yyyy', 'd.M.yyyy'],
  TIMEFORMATS: ['H:mm:ss zzzz', 'H:mm:ss z', 'H:mm:ss', 'H:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale sl.
 */
goog.i18n.DateTimeSymbols_sl = {
  ERAS: ['pr. n. št.', 'po Kr.'],
  ERANAMES: ['pred našim štetjem', 'naše štetje'],
  NARROWMONTHS: ['j', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'],
  STANDALONENARROWMONTHS: ['j', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o',
      'n', 'd'],
  MONTHS: ['januar', 'februar', 'marec', 'april', 'maj', 'junij', 'julij',
      'avgust', 'september', 'oktober', 'november', 'december'],
  STANDALONEMONTHS: ['januar', 'februar', 'marec', 'april', 'maj', 'junij',
      'julij', 'avgust', 'september', 'oktober', 'november', 'december'],
  SHORTMONTHS: ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'avg.',
      'sep.', 'okt.', 'nov.', 'dec.'],
  STANDALONESHORTMONTHS: ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul',
      'avg', 'sep', 'okt', 'nov', 'dec'],
  WEEKDAYS: ['nedelja', 'ponedeljek', 'torek', 'sreda', 'četrtek', 'petek',
      'sobota'],
  STANDALONEWEEKDAYS: ['nedelja', 'ponedeljek', 'torek', 'sreda', 'četrtek',
      'petek', 'sobota'],
  SHORTWEEKDAYS: ['ned.', 'pon.', 'tor.', 'sre.', 'čet.', 'pet.', 'sob.'],
  STANDALONESHORTWEEKDAYS: ['ned', 'pon', 'tor', 'sre', 'čet', 'pet', 'sob'],
  NARROWWEEKDAYS: ['n', 'p', 't', 's', 'č', 'p', 's'],
  STANDALONENARROWWEEKDAYS: ['n', 'p', 't', 's', 'č', 'p', 's'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['1. četrtletje', '2. četrtletje', '3. četrtletje',
      '4. četrtletje'],
  AMPMS: ['dop.', 'pop.'],
  DATEFORMATS: ['EEEE, dd. MMMM y', 'dd. MMMM y', 'd. MMM yyyy', 'd. MM. yy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 6
};


/**
 * Date/time formatting symbols for locale sq.
 */
goog.i18n.DateTimeSymbols_sq = {
  ERAS: ['p.e.r.', 'n.e.r.'],
  ERANAMES: ['p.e.r.', 'n.e.r.'],
  NARROWMONTHS: ['J', 'S', 'M', 'P', 'M', 'Q', 'K', 'G', 'S', 'T', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'S', 'M', 'P', 'M', 'Q', 'K', 'G', 'S', 'T',
      'N', 'D'],
  MONTHS: ['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor', 'korrik',
      'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor'],
  STANDALONEMONTHS: ['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor',
      'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor'],
  SHORTMONTHS: ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gsh', 'Sht',
      'Tet', 'Nën', 'Dhj'],
  STANDALONESHORTMONTHS: ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor',
      'Gsh', 'Sht', 'Tet', 'Nën', 'Dhj'],
  WEEKDAYS: ['e diel', 'e hënë', 'e martë', 'e mërkurë', 'e enjte',
      'e premte', 'e shtunë'],
  STANDALONEWEEKDAYS: ['e diel', 'e hënë', 'e martë', 'e mërkurë',
      'e enjte', 'e premte', 'e shtunë'],
  SHORTWEEKDAYS: ['Die', 'Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht'],
  STANDALONESHORTWEEKDAYS: ['Die', 'Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht'],
  NARROWWEEKDAYS: ['D', 'H', 'M', 'M', 'E', 'P', 'S'],
  STANDALONENARROWWEEKDAYS: ['D', 'H', 'M', 'M', 'E', 'P', 'S'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  AMPMS: ['PD', 'MD'],
  DATEFORMATS: ['EEEE, dd MMMM y', 'dd MMMM y', 'yyyy-MM-dd', 'yy-MM-dd'],
  TIMEFORMATS: ['h.mm.ss.a zzzz', 'h.mm.ss.a z', 'h.mm.ss.a', 'h.mm.a'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 6
};


/**
 * Date/time formatting symbols for locale sr.
 */
goog.i18n.DateTimeSymbols_sr = {
  ERAS: ['п. н. е.', 'н. е.'],
  ERANAMES: ['Пре нове ере', 'Нове ере'],
  NARROWMONTHS: ['ј', 'ф', 'м', 'а', 'м', 'ј', 'ј', 'а', 'с', 'о',
      'н', 'д'],
  STANDALONENARROWMONTHS: ['ј', 'ф', 'м', 'а', 'м', 'ј', 'ј', 'а', 'с',
      'о', 'н', 'д'],
  MONTHS: ['јануар', 'фебруар', 'март', 'април', 'мај',
      'јун', 'јул', 'август', 'септембар',
      'октобар', 'новембар', 'децембар'],
  STANDALONEMONTHS: ['јануар', 'фебруар', 'март', 'април',
      'мај', 'јун', 'јул', 'август', 'септембар',
      'октобар', 'новембар', 'децембар'],
  SHORTMONTHS: ['јан', 'феб', 'мар', 'апр', 'мај', 'јун',
      'јул', 'авг', 'сеп', 'окт', 'нов', 'дец'],
  STANDALONESHORTMONTHS: ['јан', 'феб', 'мар', 'апр', 'мај',
      'јун', 'јул', 'авг', 'сеп', 'окт', 'нов', 'дец'],
  WEEKDAYS: ['недеља', 'понедељак', 'уторак', 'среда',
      'четвртак', 'петак', 'субота'],
  STANDALONEWEEKDAYS: ['недеља', 'понедељак', 'уторак',
      'среда', 'четвртак', 'петак', 'субота'],
  SHORTWEEKDAYS: ['нед', 'пон', 'уто', 'сре', 'чет', 'пет',
      'суб'],
  STANDALONESHORTWEEKDAYS: ['нед', 'пон', 'уто', 'сре', 'чет',
      'пет', 'суб'],
  NARROWWEEKDAYS: ['н', 'п', 'у', 'с', 'ч', 'п', 'с'],
  STANDALONENARROWWEEKDAYS: ['н', 'п', 'у', 'с', 'ч', 'п', 'с'],
  SHORTQUARTERS: ['К1', 'К2', 'К3', 'К4'],
  QUARTERS: ['Прво тромесечје', 'Друго тромесечје',
      'Треће тромесечје', 'Четврто тромесечје'],
  AMPMS: ['пре подне', 'поподне'],
  DATEFORMATS: ['EEEE, dd. MMMM y.', 'dd. MMMM y.', 'dd.MM.y.', 'd.M.yy.'],
  TIMEFORMATS: ['HH.mm.ss zzzz', 'HH.mm.ss z', 'HH.mm.ss', 'HH.mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 6
};


/**
 * Date/time formatting symbols for locale sv.
 */
goog.i18n.DateTimeSymbols_sv = {
  ERAS: ['f.Kr.', 'e.Kr.'],
  ERANAMES: ['före Kristus', 'efter Kristus'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli',
      'augusti', 'september', 'oktober', 'november', 'december'],
  STANDALONEMONTHS: ['januari', 'februari', 'mars', 'april', 'maj', 'juni',
      'juli', 'augusti', 'september', 'oktober', 'november', 'december'],
  SHORTMONTHS: ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep',
      'okt', 'nov', 'dec'],
  STANDALONESHORTMONTHS: ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul',
      'aug', 'sep', 'okt', 'nov', 'dec'],
  WEEKDAYS: ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag',
      'lördag'],
  STANDALONEWEEKDAYS: ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag',
      'fredag', 'lördag'],
  SHORTWEEKDAYS: ['sön', 'mån', 'tis', 'ons', 'tors', 'fre', 'lör'],
  STANDALONESHORTWEEKDAYS: ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör'],
  NARROWWEEKDAYS: ['S', 'M', 'T', 'O', 'T', 'F', 'L'],
  STANDALONENARROWWEEKDAYS: ['S', 'M', 'T', 'O', 'T', 'F', 'L'],
  SHORTQUARTERS: ['K1', 'K2', 'K3', 'K4'],
  QUARTERS: ['1:a kvartalet', '2:a kvartalet', '3:e kvartalet',
      '4:e kvartalet'],
  AMPMS: ['fm', 'em'],
  DATEFORMATS: ['EEEE\'en\' \'den\' d:\'e\' MMMM y', 'd MMMM y', 'd MMM y',
      'yyyy-MM-dd'],
  TIMEFORMATS: ['\'kl\'. HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 3
};


/**
 * Date/time formatting symbols for locale sw.
 */
goog.i18n.DateTimeSymbols_sw = {
  ERAS: ['KK', 'BK'],
  ERANAMES: ['Kabla ya Kristo', 'Baada ya Kristo'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['Januari', 'Februari', 'Machi', 'Aprili', 'Mei', 'Juni', 'Julai',
      'Agosti', 'Septemba', 'Oktoba', 'Novemba', 'Desemba'],
  STANDALONEMONTHS: ['Januari', 'Februari', 'Machi', 'Aprili', 'Mei', 'Juni',
      'Julai', 'Agosti', 'Septemba', 'Oktoba', 'Novemba', 'Desemba'],
  SHORTMONTHS: ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ago', 'Sep',
      'Okt', 'Nov', 'Des'],
  STANDALONESHORTMONTHS: ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul',
      'Ago', 'Sep', 'Okt', 'Nov', 'Des'],
  WEEKDAYS: ['Jumapili', 'Jumatatu', 'Jumanne', 'Jumatano', 'Alhamisi',
      'Ijumaa', 'Jumamosi'],
  STANDALONEWEEKDAYS: ['Jumapili', 'Jumatatu', 'Jumanne', 'Jumatano',
      'Alhamisi', 'Ijumaa', 'Jumamosi'],
  SHORTWEEKDAYS: ['J2', 'J3', 'J4', 'J5', 'Alh', 'Ij', 'J1'],
  STANDALONESHORTWEEKDAYS: ['J2', 'J3', 'J4', 'J5', 'Alh', 'Ij', 'J1'],
  NARROWWEEKDAYS: ['2', '3', '4', '5', 'A', 'I', '1'],
  STANDALONENARROWWEEKDAYS: ['2', '3', '4', '5', 'A', 'I', '1'],
  SHORTQUARTERS: ['R1', 'R2', 'R3', 'R4'],
  QUARTERS: ['Robo 1', 'Robo 2', 'Robo 3', 'Robo 4'],
  AMPMS: ['asubuhi', 'alasiri'],
  DATEFORMATS: ['EEEE, d MMMM y', 'd MMMM y', 'd MMM y', 'dd/MM/yyyy'],
  TIMEFORMATS: ['h:mm:ss a zzzz', 'h:mm:ss a z', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 6
};


/**
 * Date/time formatting symbols for locale ta.
 */
goog.i18n.DateTimeSymbols_ta = {
  ERAS: ['கி.மு.', 'கி.பி.'],
  ERANAMES: ['கிறிஸ்துவுக்கு முன்',
      'அனோ டோமினி'],
  NARROWMONTHS: ['ஜ', 'பி', 'மா', 'ஏ', 'மே', 'ஜூ', 'ஜூ',
      'ஆ', 'செ', 'அ', 'ந', 'டி'],
  STANDALONENARROWMONTHS: ['ஜ', 'பி', 'மா', 'ஏ', 'மே', 'ஜூ',
      'ஜூ', 'ஆ', 'செ', 'அ', 'ந', 'டி'],
  MONTHS: ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்',
      'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை',
      'ஆகஸ்ட்', 'செப்டம்பர்',
      'அக்டோபர்', 'நவம்பர்',
      'டிசம்பர்'],
  STANDALONEMONTHS: ['ஜனவரி', 'பிப்ரவரி',
      'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்',
      'ஜூலை', 'ஆகஸ்டு', 'செப்டம்பர்',
      'அக்டோபர்', 'நவம்பர்',
      'டிசம்பர்'],
  SHORTMONTHS: ['ஜன.', 'பிப்.', 'மார்.', 'ஏப்.',
      'மே', 'ஜூன்', 'ஜூலை', 'ஆக.', 'செப்.',
      'அக்.', 'நவ.', 'டிச.'],
  STANDALONESHORTMONTHS: ['ஜன.', 'பிப்.', 'மார்.',
      'ஏப்.', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக.',
      'செப்.', 'அக்.', 'நவ.', 'டிச.'],
  WEEKDAYS: ['ஞாயிறு', 'திங்கள்',
      'செவ்வாய்', 'புதன்', 'வியாழன்',
      'வெள்ளி', 'சனி'],
  STANDALONEWEEKDAYS: ['ஞாயிறு', 'திங்கள்',
      'செவ்வாய்', 'புதன்', 'வியாழன்',
      'வெள்ளி', 'சனி'],
  SHORTWEEKDAYS: ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ',
      'ச'],
  STANDALONESHORTWEEKDAYS: ['ஞா', 'தி', 'செ', 'பு', 'வி',
      'வெ', 'ச'],
  NARROWWEEKDAYS: ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ',
      'ச'],
  STANDALONENARROWWEEKDAYS: ['ஞா', 'தி', 'செ', 'பு', 'வி',
      'வெ', 'ச'],
  SHORTQUARTERS: ['காலாண்டு1', 'காலாண்டு2',
      'காலாண்டு3', 'காலாண்டு4'],
  QUARTERS: ['முதல் காலாண்டு',
      'இரண்டாம் காலாண்டு',
      'மூன்றாம் காலாண்டு',
      'நான்காம் காலாண்டு'],
  AMPMS: ['am', 'pm'],
  DATEFORMATS: ['EEEE, d MMMM, y', 'd MMMM, y', 'd MMM, y', 'd-M-yy'],
  TIMEFORMATS: ['h:mm:ss a zzzz', 'h:mm:ss a z', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [6, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale te.
 */
goog.i18n.DateTimeSymbols_te = {
  ERAS: ['ఈసాపూర్వ.', 'సన్.'],
  ERANAMES: ['ఈసాపూర్వ.', 'సన్.'],
  NARROWMONTHS: ['జ', 'ఫి', 'మా', 'ఏ', 'మె', 'జు', 'జు',
      'ఆ', 'సె', 'అ', 'న', 'డి'],
  STANDALONENARROWMONTHS: ['జ', 'ఫి', 'మ', 'ఎ', 'మె', 'జు',
      'జు', 'ఆ', 'సె', 'అ', 'న', 'డి'],
  MONTHS: ['జనవరి', 'ఫిబ్రవరి', 'మార్చి',
      'ఎప్రిల్', 'మే', 'జూన్', 'జూలై',
      'ఆగస్టు', 'సెప్టెంబర్',
      'అక్టోబర్', 'నవంబర్',
      'డిసెంబర్'],
  STANDALONEMONTHS: ['జనవరి', 'ఫిబ్రవరి',
      'మార్చి', 'ఎప్రిల్', 'మే', 'జూన్',
      'జూలై', 'ఆగస్టు', 'సెప్టెంబర్',
      'అక్టోబర్', 'నవంబర్',
      'డిసెంబర్'],
  SHORTMONTHS: ['జన', 'ఫిబ్ర', 'మార్చి',
      'ఏప్రి', 'మే', 'జూన్', 'జూలై',
      'ఆగస్టు', 'సెప్టెంబర్',
      'అక్టోబర్', 'నవంబర్',
      'డిసెంబర్'],
  STANDALONESHORTMONTHS: ['జన', 'ఫిబ్ర', 'మార్చి',
      'ఏప్రి', 'మే', 'జూన్', 'జూలై',
      'ఆగస్టు', 'సెప్టెంబర్',
      'అక్టోబర్', 'నవంబర్',
      'డిసెంబర్'],
  WEEKDAYS: ['ఆదివారం', 'సోమవారం',
      'మంగళవారం', 'బుధవారం',
      'గురువారం', 'శుక్రవారం',
      'శనివారం'],
  STANDALONEWEEKDAYS: ['ఆదివారం', 'సోమవారం',
      'మంగళవారం', 'బుధవారం',
      'గురువారం', 'శుక్రవారం',
      'శనివారం'],
  SHORTWEEKDAYS: ['ఆది', 'సోమ', 'మంగళ', 'బుధ',
      'గురు', 'శుక్ర', 'శని'],
  STANDALONESHORTWEEKDAYS: ['ఆది', 'సోమ', 'మంగళ',
      'బుధ', 'గురు', 'శుక్ర', 'శని'],
  NARROWWEEKDAYS: ['ఆ', 'సో', 'మ', 'బు', 'గు', 'శు', 'శ'],
  STANDALONENARROWWEEKDAYS: ['ఆ', 'సో', 'మ', 'బు', 'గు',
      'శు', 'శ'],
  SHORTQUARTERS: ['ఒకటి 1', 'రెండు 2', 'మూడు 3',
      'నాలుగు 4'],
  QUARTERS: ['ఒకటి 1', 'రెండు 2', 'మూడు 3',
      'నాలుగు 4'],
  AMPMS: ['am', 'pm'],
  DATEFORMATS: ['EEEE d MMMM y', 'd MMMM y', 'd MMM y', 'dd-MM-yy'],
  TIMEFORMATS: ['h:mm:ss a zzzz', 'h:mm:ss a z', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [6, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale th.
 */
goog.i18n.DateTimeSymbols_th = {
  ERAS: ['ปีก่อน ค.ศ.', 'ค.ศ.'],
  ERANAMES: ['ปีก่อนคริสต์ศักราช',
      'คริสต์ศักราช'],
  NARROWMONTHS: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
      'พ.ค.', 'มิ.ย', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.',
      'พ.ย.', 'ธ.ค.'],
  STANDALONENARROWMONTHS: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
      'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.',
      'พ.ย.', 'ธ.ค.'],
  MONTHS: ['มกราคม', 'กุมภาพันธ์',
      'มีนาคม', 'เมษายน', 'พฤษภาคม',
      'มิถุนายน', 'กรกฎาคม',
      'สิงหาคม', 'กันยายน', 'ตุลาคม',
      'พฤศจิกายน', 'ธันวาคม'],
  STANDALONEMONTHS: ['มกราคม', 'กุมภาพันธ์',
      'มีนาคม', 'เมษายน', 'พฤษภาคม',
      'มิถุนายน', 'กรกฎาคม',
      'สิงหาคม', 'กันยายน', 'ตุลาคม',
      'พฤศจิกายน', 'ธันวาคม'],
  SHORTMONTHS: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
      'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.',
      'พ.ย.', 'ธ.ค.'],
  STANDALONESHORTMONTHS: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
      'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.',
      'พ.ย.', 'ธ.ค.'],
  WEEKDAYS: ['วันอาทิตย์', 'วันจันทร์',
      'วันอังคาร', 'วันพุธ',
      'วันพฤหัสบดี', 'วันศุกร์',
      'วันเสาร์'],
  STANDALONEWEEKDAYS: ['วันอาทิตย์',
      'วันจันทร์', 'วันอังคาร',
      'วันพุธ', 'วันพฤหัสบดี',
      'วันศุกร์', 'วันเสาร์'],
  SHORTWEEKDAYS: ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'],
  STANDALONESHORTWEEKDAYS: ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.',
      'ศ.', 'ส.'],
  NARROWWEEKDAYS: ['อ', 'จ', 'อ', 'พ', 'พ', 'ศ', 'ส'],
  STANDALONENARROWWEEKDAYS: ['อ', 'จ', 'อ', 'พ', 'พ', 'ศ', 'ส'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['ไตรมาส 1', 'ไตรมาส 2',
      'ไตรมาส 3', 'ไตรมาส 4'],
  AMPMS: ['ก่อนเที่ยง', 'หลังเที่ยง'],
  DATEFORMATS: ['EEEEที่ d MMMM G y', 'd MMMM y', 'd MMM y', 'd/M/yyyy'],
  TIMEFORMATS: [
      'H นาฬิกา m นาที ss วินาที zzzz',
      'H นาฬิกา m นาที ss วินาที z', 'H:mm:ss',
      'H:mm'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale tl.
 */
goog.i18n.DateTimeSymbols_tl = {
  ERAS: ['BC', 'AD'],
  ERANAMES: ['BC', 'AD'],
  NARROWMONTHS: ['E', 'P', 'M', 'A', 'M', 'H', 'H', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['E', 'P', 'M', 'A', 'M', 'H', 'H', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['Enero', 'Pebrero', 'Marso', 'Abril', 'Mayo', 'Hunyo', 'Hulyo',
      'Agosto', 'Setyembre', 'Oktubre', 'Nobyembre', 'Disyembre'],
  STANDALONEMONTHS: ['Enero', 'Pebrero', 'Marso', 'Abril', 'Mayo', 'Hunyo',
      'Hulyo', 'Agosto', 'Setyembre', 'Oktubre', 'Nobyembre', 'Disyembre'],
  SHORTMONTHS: ['Ene', 'Peb', 'Mar', 'Abr', 'May', 'Hun', 'Hul', 'Ago', 'Set',
      'Okt', 'Nob', 'Dis'],
  STANDALONESHORTMONTHS: ['Ene', 'Peb', 'Mar', 'Abr', 'May', 'Hun', 'Hul',
      'Ago', 'Set', 'Okt', 'Nob', 'Dis'],
  WEEKDAYS: ['Linggo', 'Lunes', 'Martes', 'Miyerkules', 'Huwebes', 'Biyernes',
      'Sabado'],
  STANDALONEWEEKDAYS: ['Linggo', 'Lunes', 'Martes', 'Miyerkules', 'Huwebes',
      'Biyernes', 'Sabado'],
  SHORTWEEKDAYS: ['Lin', 'Lun', 'Mar', 'Mye', 'Huw', 'Bye', 'Sab'],
  STANDALONESHORTWEEKDAYS: ['Lin', 'Lun', 'Mar', 'Miy', 'Huw', 'Biy', 'Sab'],
  NARROWWEEKDAYS: ['L', 'L', 'M', 'M', 'H', 'B', 'S'],
  STANDALONENARROWWEEKDAYS: ['L', 'L', 'M', 'M', 'H', 'B', 'S'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['ika-1 sangkapat', 'ika-2 sangkapat', 'ika-3 quarter',
      'ika-4 na quarter'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE, MMMM dd y', 'MMMM d, y', 'MMM d, y', 'M/d/yy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale tr.
 */
goog.i18n.DateTimeSymbols_tr = {
  ERAS: ['MÖ', 'MS'],
  ERANAMES: ['Milattan Önce', 'Milattan Sonra'],
  NARROWMONTHS: ['O', 'Ş', 'M', 'N', 'M', 'H', 'T', 'A', 'E', 'E', 'K', 'A'],
  STANDALONENARROWMONTHS: ['O', 'Ş', 'M', 'N', 'M', 'H', 'T', 'A', 'E', 'E',
      'K', 'A'],
  MONTHS: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz',
      'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
  STANDALONEMONTHS: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
  SHORTMONTHS: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl',
      'Eki', 'Kas', 'Ara'],
  STANDALONESHORTMONTHS: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem',
      'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  WEEKDAYS: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma',
      'Cumartesi'],
  STANDALONEWEEKDAYS: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe',
      'Cuma', 'Cumartesi'],
  SHORTWEEKDAYS: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
  STANDALONESHORTWEEKDAYS: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
  NARROWWEEKDAYS: ['P', 'P', 'S', 'Ç', 'P', 'C', 'C'],
  STANDALONENARROWWEEKDAYS: ['P', 'P', 'S', 'Ç', 'P', 'C', 'C'],
  SHORTQUARTERS: ['Ç1', 'Ç2', 'Ç3', 'Ç4'],
  QUARTERS: ['1. çeyrek', '2. çeyrek', '3. çeyrek', '4. çeyrek'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['d MMMM y EEEE', 'd MMMM y', 'd MMM y', 'dd MM yyyy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 6
};


/**
 * Date/time formatting symbols for locale uk.
 */
goog.i18n.DateTimeSymbols_uk = {
  ERAS: ['до н.е.', 'н.е.'],
  ERANAMES: ['до нашої ери', 'нашої ери'],
  NARROWMONTHS: ['С', 'Л', 'Б', 'К', 'Т', 'Ч', 'Л', 'С', 'В', 'Ж',
      'Л', 'Г'],
  STANDALONENARROWMONTHS: ['С', 'Л', 'Б', 'К', 'Т', 'Ч', 'Л', 'С', 'В',
      'Ж', 'Л', 'Г'],
  MONTHS: ['січня', 'лютого', 'березня', 'квітня',
      'травня', 'червня', 'липня', 'серпня',
      'вересня', 'жовтня', 'листопада', 'грудня'],
  STANDALONEMONTHS: ['Січень', 'Лютий', 'Березень',
      'Квітень', 'Травень', 'Червень', 'Липень',
      'Серпень', 'Вересень', 'Жовтень',
      'Листопад', 'Грудень'],
  SHORTMONTHS: ['січ.', 'лют.', 'бер.', 'квіт.', 'трав.',
      'черв.', 'лип.', 'серп.', 'вер.', 'жовт.', 'лист.',
      'груд.'],
  STANDALONESHORTMONTHS: ['Січ', 'Лют', 'Бер', 'Кві', 'Тра',
      'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'],
  WEEKDAYS: ['Неділя', 'Понеділок', 'Вівторок',
      'Середа', 'Четвер', 'Пʼятниця', 'Субота'],
  STANDALONEWEEKDAYS: ['Неділя', 'Понеділок', 'Вівторок',
      'Середа', 'Четвер', 'Пʼятниця', 'Субота'],
  SHORTWEEKDAYS: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  STANDALONESHORTWEEKDAYS: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт',
      'Сб'],
  NARROWWEEKDAYS: ['Н', 'П', 'В', 'С', 'Ч', 'П', 'С'],
  STANDALONENARROWWEEKDAYS: ['Н', 'П', 'В', 'С', 'Ч', 'П', 'С'],
  SHORTQUARTERS: ['I кв.', 'II кв.', 'III кв.', 'IV кв.'],
  QUARTERS: ['I квартал', 'II квартал', 'III квартал',
      'IV квартал'],
  AMPMS: ['дп', 'пп'],
  DATEFORMATS: ['EEEE, d MMMM y \'р\'.', 'd MMMM y \'р\'.', 'd MMM y',
      'dd.MM.yy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 6
};


/**
 * Date/time formatting symbols for locale ur.
 */
goog.i18n.DateTimeSymbols_ur = {
  ERAS: ['ق م', 'عيسوی سن'],
  ERANAMES: ['قبل مسيح', 'عيسوی سن'],
  NARROWMONTHS: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  STANDALONENARROWMONTHS: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
      '11', '12'],
  MONTHS: ['جنوری', 'فروری', 'مارچ', 'اپريل', 'مئ',
      'جون', 'جولائ', 'اگست', 'ستمبر', 'اکتوبر',
      'نومبر', 'دسمبر'],
  STANDALONEMONTHS: ['جنوری', 'فروری', 'مارچ', 'اپريل',
      'مئ', 'جون', 'جولائ', 'اگست', 'ستمبر', 'اکتوبر',
      'نومبر', 'دسمبر'],
  SHORTMONTHS: ['جنوری', 'فروری', 'مارچ', 'اپريل', 'مئ',
      'جون', 'جولائ', 'اگست', 'ستمبر', 'اکتوبر',
      'نومبر', 'دسمبر'],
  STANDALONESHORTMONTHS: ['جنوری', 'فروری', 'مارچ', 'اپريل',
      'مئ', 'جون', 'جولائ', 'اگست', 'ستمبر', 'اکتوبر',
      'نومبر', 'دسمبر'],
  WEEKDAYS: ['اتوار', 'پير', 'منگل', 'بده', 'جمعرات',
      'جمعہ', 'ہفتہ'],
  STANDALONEWEEKDAYS: ['اتوار', 'پير', 'منگل', 'بده',
      'جمعرات', 'جمعہ', 'ہفتہ'],
  SHORTWEEKDAYS: ['اتوار', 'پير', 'منگل', 'بده', 'جمعرات',
      'جمعہ', 'ہفتہ'],
  STANDALONESHORTWEEKDAYS: ['اتوار', 'پير', 'منگل', 'بده',
      'جمعرات', 'جمعہ', 'ہفتہ'],
  NARROWWEEKDAYS: ['1', '2', '3', '4', '5', '6', '7'],
  STANDALONENARROWWEEKDAYS: ['1', '2', '3', '4', '5', '6', '7'],
  SHORTQUARTERS: ['پہلی سہ ماہی', 'دوسری سہ ماہی',
      'تيسری سہ ماہی', 'چوتهی سہ ماہی'],
  QUARTERS: ['پہلی سہ ماہی', 'دوسری سہ ماہی',
      'تيسری سہ ماہی', 'چوتهی سہ ماہی'],
  AMPMS: ['دن', 'رات'],
  DATEFORMATS: ['EEEE؍ d؍ MMMM y', 'd؍ MMMM y', 'd؍ MMM y', 'd/M/yy'],
  TIMEFORMATS: ['h:mm:ss a zzzz', 'h:mm:ss a z', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale vi.
 */
goog.i18n.DateTimeSymbols_vi = {
  ERAS: ['tr. CN', 'sau CN'],
  ERANAMES: ['tr. CN', 'sau CN'],
  NARROWMONTHS: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  STANDALONENARROWMONTHS: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
      '11', '12'],
  MONTHS: ['tháng một', 'tháng hai', 'tháng ba', 'tháng tư',
      'tháng năm', 'tháng sáu', 'tháng bảy', 'tháng tám',
      'tháng chín', 'tháng mười', 'tháng mười một',
      'tháng mười hai'],
  STANDALONEMONTHS: ['tháng một', 'tháng hai', 'tháng ba', 'tháng tư',
      'tháng năm', 'tháng sáu', 'tháng bảy', 'tháng tám',
      'tháng chín', 'tháng mười', 'tháng mười một',
      'tháng mười hai'],
  SHORTMONTHS: ['thg 1', 'thg 2', 'thg 3', 'thg 4', 'thg 5', 'thg 6', 'thg 7',
      'thg 8', 'thg 9', 'thg 10', 'thg 11', 'thg 12'],
  STANDALONESHORTMONTHS: ['thg 1', 'thg 2', 'thg 3', 'thg 4', 'thg 5', 'thg 6',
      'thg 7', 'thg 8', 'thg 9', 'thg 10', 'thg 11', 'thg 12'],
  WEEKDAYS: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm',
      'Thứ sáu', 'Thứ bảy'],
  STANDALONEWEEKDAYS: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư',
      'Thứ năm', 'Thứ sáu', 'Thứ bảy'],
  SHORTWEEKDAYS: ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'],
  STANDALONESHORTWEEKDAYS: ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6',
      'Th 7'],
  NARROWWEEKDAYS: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  STANDALONENARROWWEEKDAYS: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['Quý 1', 'Quý 2', 'Quý 3', 'Quý 4'],
  AMPMS: ['SA', 'CH'],
  DATEFORMATS: ['EEEE, \'ngày\' dd MMMM \'năm\' y',
      '\'Ngày\' dd \'tháng\' M \'năm\' y', 'dd-MM-yyyy', 'dd/MM/yyyy'],
  TIMEFORMATS: ['HH:mm:ss zzzz', 'HH:mm:ss z', 'HH:mm:ss', 'HH:mm'],
  FIRSTDAYOFWEEK: 0,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 6
};


/**
 * Date/time formatting symbols for locale zh.
 */
goog.i18n.DateTimeSymbols_zh = {
  ERAS: ['公元前', '公元'],
  ERANAMES: ['公元前', '公元'],
  NARROWMONTHS: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  STANDALONENARROWMONTHS: ['1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'],
  MONTHS: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月',
      '9月', '10月', '11月', '12月'],
  STANDALONEMONTHS: ['一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月'],
  SHORTMONTHS: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月',
      '9月', '10月', '11月', '12月'],
  STANDALONESHORTMONTHS: ['一月', '二月', '三月', '四月', '五月',
      '六月', '七月', '八月', '九月', '十月', '十一月',
      '十二月'],
  WEEKDAYS: ['星期日', '星期一', '星期二', '星期三', '星期四',
      '星期五', '星期六'],
  STANDALONEWEEKDAYS: ['星期日', '星期一', '星期二', '星期三',
      '星期四', '星期五', '星期六'],
  SHORTWEEKDAYS: ['周日', '周一', '周二', '周三', '周四', '周五',
      '周六'],
  STANDALONESHORTWEEKDAYS: ['周日', '周一', '周二', '周三', '周四',
      '周五', '周六'],
  NARROWWEEKDAYS: ['日', '一', '二', '三', '四', '五', '六'],
  STANDALONENARROWWEEKDAYS: ['日', '一', '二', '三', '四', '五', '六'],
  SHORTQUARTERS: ['1季', '2季', '3季', '4季'],
  QUARTERS: ['第1季度', '第2季度', '第3季度', '第4季度'],
  AMPMS: ['上午', '下午'],
  DATEFORMATS: ['y年M月d日EEEE', 'y年M月d日', 'yyyy-M-d', 'yy-M-d'],
  TIMEFORMATS: ['zzzzah时mm分ss秒', 'zah时mm分ss秒', 'ah:mm:ss', 'ah:mm'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale zh_CN.
 */
goog.i18n.DateTimeSymbols_zh_CN = goog.i18n.DateTimeSymbols_zh;


/**
 * Date/time formatting symbols for locale zh_HK.
 */
goog.i18n.DateTimeSymbols_zh_HK = {
  ERAS: ['西元前', '西元'],
  ERANAMES: ['西元前', '西元'],
  NARROWMONTHS: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  STANDALONENARROWMONTHS: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
      '11', '12'],
  MONTHS: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月',
      '9月', '10月', '11月', '12月'],
  STANDALONEMONTHS: ['一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月'],
  SHORTMONTHS: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月',
      '9月', '10月', '11月', '12月'],
  STANDALONESHORTMONTHS: ['1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'],
  WEEKDAYS: ['星期日', '星期一', '星期二', '星期三', '星期四',
      '星期五', '星期六'],
  STANDALONEWEEKDAYS: ['星期日', '星期一', '星期二', '星期三',
      '星期四', '星期五', '星期六'],
  SHORTWEEKDAYS: ['週日', '週一', '週二', '週三', '週四', '週五',
      '週六'],
  STANDALONESHORTWEEKDAYS: ['周日', '周一', '周二', '周三', '周四',
      '周五', '周六'],
  NARROWWEEKDAYS: ['日', '一', '二', '三', '四', '五', '六'],
  STANDALONENARROWWEEKDAYS: ['日', '一', '二', '三', '四', '五', '六'],
  SHORTQUARTERS: ['1季', '2季', '3季', '4季'],
  QUARTERS: ['第1季', '第2季', '第3季', '第4季'],
  AMPMS: ['上午', '下午'],
  DATEFORMATS: ['y年M月d日EEEE', 'y年M月d日', 'y年M月d日',
      'yy年M月d日'],
  TIMEFORMATS: ['ah:mm:ss [zzzz]', 'ah:mm:ss [z]', 'ahh:mm:ss', 'ah:mm'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale zh_TW.
 */
goog.i18n.DateTimeSymbols_zh_TW = {
  ERAS: ['西元前', '西元'],
  ERANAMES: ['西元前', '西元'],
  NARROWMONTHS: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  STANDALONENARROWMONTHS: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
      '11', '12'],
  MONTHS: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月',
      '9月', '10月', '11月', '12月'],
  STANDALONEMONTHS: ['一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月'],
  SHORTMONTHS: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月',
      '9月', '10月', '11月', '12月'],
  STANDALONESHORTMONTHS: ['1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'],
  WEEKDAYS: ['星期日', '星期一', '星期二', '星期三', '星期四',
      '星期五', '星期六'],
  STANDALONEWEEKDAYS: ['星期日', '星期一', '星期二', '星期三',
      '星期四', '星期五', '星期六'],
  SHORTWEEKDAYS: ['週日', '週一', '週二', '週三', '週四', '週五',
      '週六'],
  STANDALONESHORTWEEKDAYS: ['周日', '周一', '周二', '周三', '周四',
      '周五', '周六'],
  NARROWWEEKDAYS: ['日', '一', '二', '三', '四', '五', '六'],
  STANDALONENARROWWEEKDAYS: ['日', '一', '二', '三', '四', '五', '六'],
  SHORTQUARTERS: ['1季', '2季', '3季', '4季'],
  QUARTERS: ['第1季', '第2季', '第3季', '第4季'],
  AMPMS: ['上午', '下午'],
  DATEFORMATS: ['y年M月d日EEEE', 'y年M月d日', 'yyyy/M/d', 'y/M/d'],
  TIMEFORMATS: ['zzzzah時mm分ss秒', 'zah時mm分ss秒', 'ah:mm:ss', 'ah:mm'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Date/time formatting symbols for locale zu.
 */
goog.i18n.DateTimeSymbols_zu = {
  ERAS: ['BC', 'AD'],
  ERANAMES: ['BC', 'AD'],
  NARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  STANDALONENARROWMONTHS: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O',
      'N', 'D'],
  MONTHS: ['Januwari', 'Februwari', 'Mashi', 'Apreli', 'Meyi', 'Juni', 'Julayi',
      'Agasti', 'Septhemba', 'Okthoba', 'Novemba', 'Disemba'],
  STANDALONEMONTHS: ['uJanuwari', 'uFebruwari', 'uMashi', 'u-Apreli', 'uMeyi',
      'uJuni', 'uJulayi', 'uAgasti', 'uSepthemba', 'u-Okthoba', 'uNovemba',
      'uDisemba'],
  SHORTMONTHS: ['Jan', 'Feb', 'Mas', 'Apr', 'Mey', 'Jun', 'Jul', 'Aga', 'Sep',
      'Okt', 'Nov', 'Dis'],
  STANDALONESHORTMONTHS: ['Jan', 'Feb', 'Mas', 'Apr', 'Mey', 'Jun', 'Jul',
      'Aga', 'Sep', 'Okt', 'Nov', 'Dis'],
  WEEKDAYS: ['Sonto', 'Msombuluko', 'Lwesibili', 'Lwesithathu', 'uLwesine',
      'Lwesihlanu', 'Mgqibelo'],
  STANDALONEWEEKDAYS: ['Sonto', 'Msombuluko', 'Lwesibili', 'Lwesithathu',
      'uLwesine', 'Lwesihlanu', 'Mgqibelo'],
  SHORTWEEKDAYS: ['Son', 'Mso', 'Bil', 'Tha', 'Sin', 'Hla', 'Mgq'],
  STANDALONESHORTWEEKDAYS: ['Son', 'Mso', 'Bil', 'Tha', 'Sin', 'Hla', 'Mgq'],
  NARROWWEEKDAYS: ['S', 'M', 'B', 'T', 'S', 'H', 'M'],
  STANDALONENARROWWEEKDAYS: ['S', 'M', 'B', 'T', 'S', 'H', 'M'],
  SHORTQUARTERS: ['Q1', 'Q2', 'Q3', 'Q4'],
  QUARTERS: ['ikota yoku-1', 'ikota yesi-2', 'ikota yesi-3', 'ikota yesi-4'],
  AMPMS: ['AM', 'PM'],
  DATEFORMATS: ['EEEE dd MMMM y', 'd MMMM y', 'd MMM y', 'yyyy-MM-dd'],
  TIMEFORMATS: ['h:mm:ss a zzzz', 'h:mm:ss a z', 'h:mm:ss a', 'h:mm a'],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  FIRSTWEEKCUTOFFDAY: 5
};


/**
 * Selected date/time formatting symbols by locale.
 * "switch" statement won't work here. JsCompiler cannot handle it yet.
 */
if (goog.LOCALE == 'af') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_af;
} else if (goog.LOCALE == 'am') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_am;
} else if (goog.LOCALE == 'ar') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_ar;
} else if (goog.LOCALE == 'bg') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_bg;
} else if (goog.LOCALE == 'bn') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_bn;
} else if (goog.LOCALE == 'ca') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_ca;
} else if (goog.LOCALE == 'chr') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_chr;
} else if (goog.LOCALE == 'cs') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_cs;
} else if (goog.LOCALE == 'cy') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_cy;
} else if (goog.LOCALE == 'da') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_da;
} else if (goog.LOCALE == 'de') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_de;
} else if (goog.LOCALE == 'de_AT' || goog.LOCALE == 'de-AT') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_de_AT;
} else if (goog.LOCALE == 'de_CH' || goog.LOCALE == 'de-CH') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_de;
} else if (goog.LOCALE == 'el') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_el;
} else if (goog.LOCALE == 'en') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_en;
} else if (goog.LOCALE == 'en_AU' || goog.LOCALE == 'en-AU') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_en_AU;
} else if (goog.LOCALE == 'en_GB' || goog.LOCALE == 'en-GB') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_en_GB;
} else if (goog.LOCALE == 'en_IE' || goog.LOCALE == 'en-IE') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_en_IE;
} else if (goog.LOCALE == 'en_IN' || goog.LOCALE == 'en-IN') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_en_IN;
} else if (goog.LOCALE == 'en_SG' || goog.LOCALE == 'en-SG') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_en_SG;
} else if (goog.LOCALE == 'en_US' || goog.LOCALE == 'en-US') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_en;
} else if (goog.LOCALE == 'en_ZA' || goog.LOCALE == 'en-ZA') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_en_ZA;
} else if (goog.LOCALE == 'es') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_es;
} else if (goog.LOCALE == 'es_419' || goog.LOCALE == 'es-419') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_es_419;
} else if (goog.LOCALE == 'et') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_et;
} else if (goog.LOCALE == 'eu') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_eu;
} else if (goog.LOCALE == 'fa') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_fa;
} else if (goog.LOCALE == 'fi') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_fi;
} else if (goog.LOCALE == 'fil') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_fil;
} else if (goog.LOCALE == 'fr') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_fr;
} else if (goog.LOCALE == 'fr_CA' || goog.LOCALE == 'fr-CA') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_fr_CA;
} else if (goog.LOCALE == 'gl') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_gl;
} else if (goog.LOCALE == 'gsw') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_gsw;
} else if (goog.LOCALE == 'gu') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_gu;
} else if (goog.LOCALE == 'haw') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_haw;
} else if (goog.LOCALE == 'he') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_he;
} else if (goog.LOCALE == 'hi') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_hi;
} else if (goog.LOCALE == 'hr') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_hr;
} else if (goog.LOCALE == 'hu') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_hu;
} else if (goog.LOCALE == 'id') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_id;
} else if (goog.LOCALE == 'in') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_in;
} else if (goog.LOCALE == 'is') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_is;
} else if (goog.LOCALE == 'it') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_it;
} else if (goog.LOCALE == 'iw') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_iw;
} else if (goog.LOCALE == 'ja') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_ja;
} else if (goog.LOCALE == 'kn') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_kn;
} else if (goog.LOCALE == 'ko') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_ko;
} else if (goog.LOCALE == 'ln') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_ln;
} else if (goog.LOCALE == 'lt') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_lt;
} else if (goog.LOCALE == 'lv') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_lv;
} else if (goog.LOCALE == 'ml') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_ml;
} else if (goog.LOCALE == 'mr') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_mr;
} else if (goog.LOCALE == 'ms') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_ms;
} else if (goog.LOCALE == 'mt') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_mt;
} else if (goog.LOCALE == 'nl') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_nl;
} else if (goog.LOCALE == 'no') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_no;
} else if (goog.LOCALE == 'or') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_or;
} else if (goog.LOCALE == 'pl') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_pl;
} else if (goog.LOCALE == 'pt') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_pt;
} else if (goog.LOCALE == 'pt_BR' || goog.LOCALE == 'pt-BR') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_pt;
} else if (goog.LOCALE == 'pt_PT' || goog.LOCALE == 'pt-PT') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_pt_PT;
} else if (goog.LOCALE == 'ro') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_ro;
} else if (goog.LOCALE == 'ru') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_ru;
} else if (goog.LOCALE == 'sk') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_sk;
} else if (goog.LOCALE == 'sl') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_sl;
} else if (goog.LOCALE == 'sq') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_sq;
} else if (goog.LOCALE == 'sr') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_sr;
} else if (goog.LOCALE == 'sv') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_sv;
} else if (goog.LOCALE == 'sw') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_sw;
} else if (goog.LOCALE == 'ta') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_ta;
} else if (goog.LOCALE == 'te') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_te;
} else if (goog.LOCALE == 'th') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_th;
} else if (goog.LOCALE == 'tl') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_tl;
} else if (goog.LOCALE == 'tr') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_tr;
} else if (goog.LOCALE == 'uk') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_uk;
} else if (goog.LOCALE == 'ur') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_ur;
} else if (goog.LOCALE == 'vi') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_vi;
} else if (goog.LOCALE == 'zh') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_zh;
} else if (goog.LOCALE == 'zh_CN' || goog.LOCALE == 'zh-CN') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_zh;
} else if (goog.LOCALE == 'zh_HK' || goog.LOCALE == 'zh-HK') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_zh_HK;
} else if (goog.LOCALE == 'zh_TW' || goog.LOCALE == 'zh-TW') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_zh_TW;
} else if (goog.LOCALE == 'zu') {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_zu;
} else {
  goog.i18n.DateTimeSymbols = goog.i18n.DateTimeSymbols_en;
}


// Input 7
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Functions and objects for date representation and manipulation.
 *
 * @author eae@google.com (Emil A Eklund)
 * @author pallosp@google.com (Peter Pallos)
 */

goog.provide('goog.date');
goog.provide('goog.date.Date');
goog.provide('goog.date.DateTime');
goog.provide('goog.date.Interval');
goog.provide('goog.date.month');
goog.provide('goog.date.weekDay');

goog.require('goog.asserts');
goog.require('goog.date.DateLike');
goog.require('goog.i18n.DateTimeSymbols');
goog.require('goog.string');


/**
 * Constants for weekdays.
 * @enum {number}
 */
goog.date.weekDay = {
  MON: 0,
  TUE: 1,
  WED: 2,
  THU: 3,
  FRI: 4,
  SAT: 5,
  SUN: 6
};


/**
 * Constants for months.
 * @enum {number}
 */
goog.date.month = {
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11
};


/**
 * Formats a month/year string.
 * Example: "January 2008"
 *
 * @param {string} monthName The month name to use in the result.
 * @param {number} yearNum The numeric year to use in the result.
 * @return {string} A formatted month/year string.
 */
goog.date.formatMonthAndYear = function(monthName, yearNum) {
  /** @desc Month/year format given the month name and the numeric year. */
  var MSG_MONTH_AND_YEAR = goog.getMsg(
      '{$monthName} {$yearNum}',
      { 'monthName' : monthName, 'yearNum' : yearNum });
  return MSG_MONTH_AND_YEAR;
};


/**
 * Regular expression for splitting date parts from ISO 8601 styled string.
 * Examples: '20060210' or '2005-02-22' or '20050222' or '2005-08'
 * or '2005-W22' or '2005W22' or '2005-W22-4', etc.
 * For explanation and more examples, see:
 * {@link http://en.wikipedia.org/wiki/ISO_8601}
 *
 * @type {RegExp}
 * @private
 */
goog.date.splitDateStringRegex_ = new RegExp(
    '^(\\d{4})(?:(?:-?(\\d{2})(?:-?(\\d{2}))?)|' +
    '(?:-?(\\d{3}))|(?:-?W(\\d{2})(?:-?([1-7]))?))?$');


/**
 * Regular expression for splitting time parts from ISO 8601 styled string.
 * Examples: '18:46:39.994' or '184639.994'
 *
 * @type {RegExp}
 * @private
 */
goog.date.splitTimeStringRegex_ =
    /^(\d{2})(?::?(\d{2})(?::?(\d{2})(\.\d+)?)?)?$/;


/**
 * Regular expression for splitting timezone parts from ISO 8601 styled string.
 * Example: The part after the '+' in '18:46:39+07:00'.  Or '09:30Z' (UTC).
 *
 * @type {RegExp}
 * @private
 */
goog.date.splitTimezoneStringRegex_ = /Z|(?:([-+])(\d{2})(?::?(\d{2}))?)$/;


/**
 * Regular expression for splitting duration parts from ISO 8601 styled string.
 * Example: '-P1Y2M3DT4H5M6.7S'
 *
 * @type {RegExp}
 * @private
 */
goog.date.splitDurationRegex_ = new RegExp(
    '^(-)?P(?:(\\d+)Y)?(?:(\\d+)M)?(?:(\\d+)D)?' +
    '(T(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+(?:\\.\\d+)?)S)?)?$');


/**
 * Returns whether the given year is a leap year.
 *
 * @param {number} year Year part of date.
 * @return {boolean} Whether the given year is a leap year.
 */
goog.date.isLeapYear = function(year) {
  // Leap year logic; the 4-100-400 rule
  return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
};


/**
 * Returns whether the given year is a long ISO year.
 * See {@link http://www.phys.uu.nl/~vgent/calendar/isocalendar_text3.htm}.
 *
 * @param {number} year Full year part of date.
 * @return {boolean} Whether the given year is a long ISO year.
 */
goog.date.isLongIsoYear = function(year) {
  var n = 5 * year + 12 - 4 * (Math.floor(year / 100) - Math.floor(year / 400));
  n += Math.floor((year - 100) / 400) - Math.floor((year - 102) / 400);
  n += Math.floor((year - 200) / 400) - Math.floor((year - 199) / 400);

  return n % 28 < 5;
};


/**
 * Returns the number of days for a given month.
 *
 * @param {number} year Year part of date.
 * @param {number} month Month part of date.
 * @return {number} The number of days for the given month.
 */
goog.date.getNumberOfDaysInMonth = function(year, month) {
  switch (month) {
    case goog.date.month.FEB:
      return goog.date.isLeapYear(year) ? 29 : 28;
    case goog.date.month.JUN:
    case goog.date.month.SEP:
    case goog.date.month.NOV:
    case goog.date.month.APR:
      return 30;
  }
  return 31;
};


/**
 * Returns true if the 2 dates are in the same day.
 * @param {goog.date.DateLike} date The time to check.
 * @param {goog.date.DateLike=} opt_now The current time.
 * @return {boolean} Whether the dates are on the same day.
 */
goog.date.isSameDay = function(date, opt_now) {
  var now = opt_now || new Date(goog.now());
  return date.getDate() == now.getDate() &&
      goog.date.isSameMonth(date, now);
};


/**
 * Returns true if the 2 dates are in the same month.
 * @param {goog.date.DateLike} date The time to check.
 * @param {goog.date.DateLike=} opt_now The current time.
 * @return {boolean} Whether the dates are in the same calendar month.
 */
goog.date.isSameMonth = function(date, opt_now) {
  var now = opt_now || new Date(goog.now());
  return date.getMonth() == now.getMonth() &&
      goog.date.isSameYear(date, now);
};


/**
 * Returns true if the 2 dates are in the same year.
 * @param {goog.date.DateLike} date The time to check.
 * @param {goog.date.DateLike=} opt_now The current time.
 * @return {boolean} Whether the dates are in the same calendar year.
 */
goog.date.isSameYear = function(date, opt_now) {
  var now = opt_now || new Date(goog.now());
  return date.getFullYear() == now.getFullYear();
};


/**
 * Static function for week number calculation. ISO 8601 implementation.
 *
 * @param {number} year Year part of date.
 * @param {number} month Month part of date (0-11).
 * @param {number} date Day part of date (1-31).
 * @param {number=} opt_weekDay Cut off weekday, defaults to Thursday.
 * @param {number=} opt_firstDayOfWeek First day of the week, defaults to
 *     Monday.
 *     Monday=0, Sunday=6.
 * @return {number} The week number (1-53).
 */
goog.date.getWeekNumber = function(year, month, date, opt_weekDay,
    opt_firstDayOfWeek) {
  var d = new Date(year, month, date);

  // Default to Thursday for cut off as per ISO 8601.
  var cutoff = opt_weekDay || goog.date.weekDay.THU;

  // Default to Monday for first day of the week as per ISO 8601.
  var firstday = opt_firstDayOfWeek || goog.date.weekDay.MON;

  // 1 day in milliseconds.
  var ONE_DAY = 24 * 60 * 60 * 1000;

  // The d.getDay() has to be converted first to ISO weekday (Monday=0).
  var isoday = (d.getDay() + 6) % 7;

  // Position of given day in the picker grid w.r.t. first day of week
  var daypos = (isoday - firstday + 7) % 7;

  // Position of cut off day in the picker grid w.r.t. first day of week
  var cutoffpos = (cutoff - firstday + 7) % 7;

  // Unix timestamp of the midnight of the cutoff day in the week of 'd'.
  // There might be +-1 hour shift in the result due to the daylight saving,
  // but it doesn't affect the year.
  var cutoffSameWeek = d.valueOf() + (cutoffpos - daypos) * ONE_DAY;

  // Unix timestamp of January 1 in the year of 'cutoffSameWeek'.
  var jan1 = new Date(new Date(cutoffSameWeek).getFullYear(), 0, 1).valueOf();

  // Number of week. The round() eliminates the effect of daylight saving.
  return Math.floor(Math.round((cutoffSameWeek - jan1) / ONE_DAY) / 7) + 1;
};


/**
 * Creates a DateTime from a datetime string expressed in ISO 8601 format.
 *
 * @param {string} formatted A date or datetime expressed in ISO 8601 format.
 * @return {goog.date.DateTime} Parsed date or null if parse fails.
 */
goog.date.fromIsoString = function(formatted) {
  var ret = new goog.date.DateTime(2000);
  return goog.date.setIso8601DateTime(ret, formatted) ? ret : null;
};


/**
 * Parses a datetime string expressed in ISO 8601 format. Overwrites the date
 * and optionally the time part of the given object with the parsed values.
 *
 * @param {!goog.date.DateTime} dateTime Object whose fields will be set.
 * @param {string} formatted A date or datetime expressed in ISO 8601 format.
 * @return {boolean} Whether the parsing succeeded.
 */
goog.date.setIso8601DateTime = function(dateTime, formatted) {
  formatted = goog.string.trim(formatted);
  var delim = formatted.indexOf('T') == -1 ? ' ' : 'T';
  var parts = formatted.split(delim);
  return goog.date.setIso8601DateOnly_(dateTime, parts[0]) &&
      (parts.length < 2 || goog.date.setIso8601TimeOnly_(dateTime, parts[1]));
};


/**
 * Sets date fields based on an ISO 8601 format string.
 *
 * @param {!goog.date.DateTime} d Object whose fields will be set.
 * @param {string} formatted A date expressed in ISO 8601 format.
 * @return {boolean} Whether the parsing succeeded.
 * @private
 */
goog.date.setIso8601DateOnly_ = function(d, formatted) {
  // split the formatted ISO date string into its date fields
  var parts = formatted.match(goog.date.splitDateStringRegex_);
  if (!parts) {
    return false;
  }

  var year = Number(parts[1]);
  var month = Number(parts[2]);
  var date = Number(parts[3]);
  var dayOfYear = Number(parts[4]);
  var week = Number(parts[5]);
  // ISO weekdays start with 1, native getDay() values start with 0
  var dayOfWeek = Number(parts[6]) || 1;

  d.setFullYear(year);

  if (dayOfYear) {
    d.setDate(1);
    d.setMonth(0);
    var offset = dayOfYear - 1; // offset, so 1-indexed, i.e., skip day 1
    d.add(new goog.date.Interval(goog.date.Interval.DAYS, offset));
  } else if (week) {
    goog.date.setDateFromIso8601Week_(d, week, dayOfWeek);
  } else {
    if (month) {
      d.setDate(1);
      d.setMonth(month - 1);
    }
    if (date) {
      d.setDate(date);
    }
  }

  return true;
};


/**
 * Sets date fields based on an ISO 8601 week string.
 * See {@link http://en.wikipedia.org/wiki/ISO_week_date}, "Relation with the
 * Gregorian Calendar".  The first week of a new ISO year is the week with the
 * majority of its days in the new Gregorian year.  I.e., ISO Week 1's Thursday
 * is in that year.  ISO weeks always start on Monday. So ISO Week 1 can
 * contain a few days from the previous Gregorian year.  And ISO weeks always
 * end on Sunday, so the last ISO week (Week 52 or 53) can have a few days from
 * the following Gregorian year.
 * Example: '1997-W01' lasts from 1996-12-30 to 1997-01-05.  January 1, 1997 is
 * a Wednesday. So W01's Monday is Dec.30, 1996, and Sunday is January 5, 1997.
 *
 * @param {goog.date.DateTime} d Object whose fields will be set.
 * @param {number} week ISO week number.
 * @param {number} dayOfWeek ISO day of week.
 * @private
 */
goog.date.setDateFromIso8601Week_ = function(d, week, dayOfWeek) {
  // calculate offset for first week
  d.setMonth(0);
  d.setDate(1);
  var jsDay = d.getDay();
  // switch Sunday (0) to index 7; ISO days are 1-indexed
  var jan1WeekDay = jsDay || 7;

  var THURSDAY = 4;
  if (jan1WeekDay <= THURSDAY) {
    // was extended back to Monday
    var startDelta = 1 - jan1WeekDay; // e.g., Thu(4) ==> -3
  } else {
    // was extended forward to Monday
    startDelta = 8 - jan1WeekDay; // e.g., Fri(5) ==> +3
  }

  // find the absolute number of days to offset from the start of year
  // to arrive close to the Gregorian equivalent (pending adjustments above)
  // Note: decrement week multiplier by one because 1st week is
  // represented by dayOfWeek value
  var absoluteDays = Number(dayOfWeek) + (7 * (Number(week) - 1));

  // convert from ISO weekday format to Gregorian calendar date
  // note: subtract 1 because 1-indexed; offset should not include 1st of month
  var delta = startDelta + absoluteDays - 1;
  var interval = new goog.date.Interval(goog.date.Interval.DAYS, delta);
  d.add(interval);
};


/**
 * Sets time fields based on an ISO 8601 format string.
 * Note: only time fields, not date fields.
 *
 * @param {!goog.date.DateTime} d Object whose fields will be set.
 * @param {string} formatted A time expressed in ISO 8601 format.
 * @return {boolean} Whether the parsing succeeded.
 * @private
 */
goog.date.setIso8601TimeOnly_ = function(d, formatted) {
  // first strip timezone info from the end
  var parts = formatted.match(goog.date.splitTimezoneStringRegex_);

  var offset = 0; // local time if no timezone info
  if (parts) {
    if (parts[0] != 'Z') {
      offset = parts[2] * 60 + Number(parts[3]);
      offset *= parts[1] == '-' ? 1 : -1;
    }
    offset -= d.getTimezoneOffset();
    formatted = formatted.substr(0, formatted.length - parts[0].length);
  }

  // then work out the time
  parts = formatted.match(goog.date.splitTimeStringRegex_);
  if (!parts) {
    return false;
  }

  d.setHours(Number(parts[1]));
  d.setMinutes(Number(parts[2]) || 0);
  d.setSeconds(Number(parts[3]) || 0);
  d.setMilliseconds(parts[4] ? parts[4] * 1000 : 0);

  if (offset != 0) {
    // adjust the date and time according to the specified timezone
    d.setTime(d.getTime() + offset * 60000);
  }

  return true;
};



/**
 * Class representing a date/time interval. Used for date calculations.
 * <pre>
 * new goog.date.Interval(0, 1) // One month
 * new goog.date.Interval(0, 0, 3, 1) // Three days and one hour
 * new goog.date.Interval(goog.date.Interval.DAYS, 1) // One day
 * </pre>
 *
 * @param {number|string=} opt_years Years or string representing date part.
 * @param {number=} opt_months Months or number of whatever date part specified
 *     by first parameter.
 * @param {number=} opt_days Days.
 * @param {number=} opt_hours Hours.
 * @param {number=} opt_minutes Minutes.
 * @param {number=} opt_seconds Seconds.
 * @constructor
 */
goog.date.Interval = function(opt_years, opt_months, opt_days, opt_hours,
                              opt_minutes, opt_seconds) {
  if (goog.isString(opt_years)) {
    var type = opt_years;
    var interval = /** @type {number} */ (opt_months);
    this.years = type == goog.date.Interval.YEARS ? interval : 0;
    this.months = type == goog.date.Interval.MONTHS ? interval : 0;
    this.days = type == goog.date.Interval.DAYS ? interval : 0;
    this.hours = type == goog.date.Interval.HOURS ? interval : 0;
    this.minutes = type == goog.date.Interval.MINUTES ? interval : 0;
    this.seconds = type == goog.date.Interval.SECONDS ? interval : 0;
  } else {
    this.years = /** @type {number} */ (opt_years) || 0;
    this.months = opt_months || 0;
    this.days = opt_days || 0;
    this.hours = opt_hours || 0;
    this.minutes = opt_minutes || 0;
    this.seconds = opt_seconds || 0;
  }
};


/**
 * Parses an XML Schema duration (ISO 8601 extended).
 * @see http://www.w3.org/TR/xmlschema-2/#duration
 *
 * @param  {string} duration An XML schema duration in textual format.
 *     Recurring durations and weeks are not supported.
 * @return {goog.date.Interval} The duration as a goog.date.Interval or null
 *     if the parse fails.
 */
goog.date.Interval.fromIsoString = function(duration) {
  var parts = duration.match(goog.date.splitDurationRegex_);
  if (!parts) {
    return null;
  }

  var timeEmpty = !(parts[6] || parts[7] || parts[8]);
  var dateTimeEmpty = timeEmpty && !(parts[2] || parts[3] || parts[4]);
  if (dateTimeEmpty || timeEmpty && parts[5]) {
    return null;
  }

  var negative = parts[1];
  var years = parseInt(parts[2], 10) || 0;
  var months = parseInt(parts[3], 10) || 0;
  var days = parseInt(parts[4], 10) || 0;
  var hours = parseInt(parts[6], 10) || 0;
  var minutes = parseInt(parts[7], 10) || 0;
  var seconds = parseFloat(parts[8]) || 0;
  return negative ? new goog.date.Interval(-years, -months, -days,
                                           -hours, -minutes, -seconds) :
                    new goog.date.Interval(years, months, days,
                                           hours, minutes, seconds);
};


/**
 * Serializes goog.date.Interval into XML Schema duration (ISO 8601 extended).
 * @see http://www.w3.org/TR/xmlschema-2/#duration
 *
 * @param {boolean=} opt_verbose Include zero fields in the duration string.
 * @return {?string} An XML schema duration in ISO 8601 extended format,
 *     or null if the interval contains both positive and negative fields.
 */
goog.date.Interval.prototype.toIsoString = function(opt_verbose) {
  var minField = Math.min(this.years, this.months, this.days,
                          this.hours, this.minutes, this.seconds);
  var maxField = Math.max(this.years, this.months, this.days,
                          this.hours, this.minutes, this.seconds);
  if (minField < 0 && maxField > 0) {
    return null;
  }

  // Return 0 seconds if all fields are zero.
  if (!opt_verbose && minField == 0 && maxField == 0) {
    return 'PT0S';
  }

  var res = [];

  // Add sign and 'P' prefix.
  if (minField < 0) {
    res.push('-');
  }
  res.push('P');

  // Add date.
  if (this.years || opt_verbose) {
    res.push(Math.abs(this.years) + 'Y');
  }
  if (this.months || opt_verbose) {
    res.push(Math.abs(this.months) + 'M');
  }
  if (this.days || opt_verbose) {
    res.push(Math.abs(this.days) + 'D');
  }

  // Add time.
  if (this.hours || this.minutes || this.seconds || opt_verbose) {
    res.push('T');
    if (this.hours || opt_verbose) {
      res.push(Math.abs(this.hours) + 'H');
    }
    if (this.minutes || opt_verbose) {
      res.push(Math.abs(this.minutes) + 'M');
    }
    if (this.seconds || opt_verbose) {
      res.push(Math.abs(this.seconds) + 'S');
    }
  }

  return res.join('');
};


/**
 * Tests whether the given interval is equal to this interval.
 * Note, this is a simple field-by-field comparison, it doesn't
 * account for comparisons like "12 months == 1 year".
 *
 * @param {goog.date.Interval} other The interval to test.
 * @return {boolean} Whether the intervals are equal.
 */
goog.date.Interval.prototype.equals = function(other) {
  return other.years == this.years &&
         other.months == this.months &&
         other.days == this.days &&
         other.hours == this.hours &&
         other.minutes == this.minutes &&
         other.seconds == this.seconds;
};


/**
 * @return {!goog.date.Interval} A clone of the interval object.
 */
goog.date.Interval.prototype.clone = function() {
  return new goog.date.Interval(
      this.years, this.months, this.days,
      this.hours, this.minutes, this.seconds);
};


/**
 * Years constant for the date parts.
 * @type {string}
 */
goog.date.Interval.YEARS = 'y';


/**
 * Months constant for the date parts.
 * @type {string}
 */
goog.date.Interval.MONTHS = 'm';


/**
 * Days constant for the date parts.
 * @type {string}
 */
goog.date.Interval.DAYS = 'd';


/**
 * Hours constant for the date parts.
 * @type {string}
 */
goog.date.Interval.HOURS = 'h';


/**
 * Minutes constant for the date parts.
 * @type {string}
 */
goog.date.Interval.MINUTES = 'n';


/**
 * Seconds constant for the date parts.
 * @type {string}
 */
goog.date.Interval.SECONDS = 's';


/**
 * @return {boolean} Whether all fields of the interval are zero.
 */
goog.date.Interval.prototype.isZero = function() {
  return this.years == 0 &&
         this.months == 0 &&
         this.days == 0 &&
         this.hours == 0 &&
         this.minutes == 0 &&
         this.seconds == 0;
};


/**
 * @return {!goog.date.Interval} Negative of this interval.
 */
goog.date.Interval.prototype.getInverse = function() {
  return this.times(-1);
};


/**
 * Calculates n * (this interval) by memberwise multiplication.
 * @param {number} n An integer.
 * @return {!goog.date.Interval} n * this.
 */
goog.date.Interval.prototype.times = function(n) {
  return new goog.date.Interval(this.years * n,
                                this.months * n,
                                this.days * n,
                                this.hours * n,
                                this.minutes * n,
                                this.seconds * n);
};


/**
 * Gets the total number of seconds in the time interval. Assumes that months
 * and years are empty.
 * @return {number} Total number of seconds in the interval.
 */
goog.date.Interval.prototype.getTotalSeconds = function() {
  goog.asserts.assert(this.years == 0 && this.months == 0);
  return ((this.days * 24 + this.hours) * 60 + this.minutes) * 60 +
      this.seconds;
};


/**
 * Adds the Interval in the argument to this Interval field by field.
 *
 * @param {goog.date.Interval} interval The Interval to add.
 */
goog.date.Interval.prototype.add = function(interval) {
  this.years += interval.years;
  this.months += interval.months;
  this.days += interval.days;
  this.hours += interval.hours;
  this.minutes += interval.minutes;
  this.seconds += interval.seconds;
};



/**
 * Class representing a date. Defaults to current date if none is specified.
 *
 * Implements most methods of the native js Date object (except the time related
 * ones, {@see goog.date.DateTime}) and can be used interchangeably with it just
 * as if goog.date.Date was a synonym of Date. To make this more transparent,
 * Closure APIs should accept goog.date.DateLike instead of the real Date
 * object.
 *
 * To allow goog.date.Date objects to be passed as arguments to methods
 * expecting Date objects this class is marked as extending the built in Date
 * object even though that's not strictly true.
 *
 * @param {number|Object=} opt_year Four digit year or a date-like object. If
 *     not set, the created object will contain the date determined by
 *     goog.now().
 * @param {number=} opt_month Month, 0 = Jan, 11 = Dec.
 * @param {number=} opt_date Date of month, 1 - 31.
 * @constructor
 * @see goog.date.DateTime
 */
goog.date.Date = function(opt_year, opt_month, opt_date) {
  // goog.date.DateTime assumes that only this.date_ is added in this ctor.
  if (goog.isNumber(opt_year)) {
    this.date_ = new Date(opt_year, opt_month || 0, opt_date || 1);
    this.maybeFixDst_(opt_date || 1);
  } else if (goog.isObject(opt_year)) {
    this.date_ = new Date(opt_year.getFullYear(), opt_year.getMonth(),
                          opt_year.getDate());
    this.maybeFixDst_(opt_year.getDate());
  } else {
    this.date_ = new Date(goog.now());
    this.date_.setHours(0);
    this.date_.setMinutes(0);
    this.date_.setSeconds(0);
    this.date_.setMilliseconds(0);
  }
};


/**
 * First day of week. 0 = Mon, 6 = Sun.
 * @type {number}
 * @private
 */
goog.date.Date.prototype.firstDayOfWeek_ =
    goog.i18n.DateTimeSymbols.FIRSTDAYOFWEEK;


/**
 * The cut off weekday used for week number calculations. 0 = Mon, 6 = Sun.
 * @type {number}
 * @private
 */
goog.date.Date.prototype.firstWeekCutOffDay_ =
    goog.i18n.DateTimeSymbols.FIRSTWEEKCUTOFFDAY;


/**
 * @return {!goog.date.Date} A clone of the date object.
 */
goog.date.Date.prototype.clone = function() {
  var date = new goog.date.Date(this.date_);
  date.firstDayOfWeek_ = this.firstDayOfWeek_;
  date.firstWeekCutOffDay_ = this.firstWeekCutOffDay_;

  return date;
};


/**
 * @return {number} The four digit year of date.
 */
goog.date.Date.prototype.getFullYear = function() {
  return this.date_.getFullYear();
};


/**
 * Alias for getFullYear.
 *
 * @return {number} The four digit year of date.
 * @see #getFullyear
 */
goog.date.Date.prototype.getYear = function() {
  return this.getFullYear();
};


/**
 * @return {goog.date.month} The month of date, 0 = Jan, 11 = Dec.
 */
goog.date.Date.prototype.getMonth = function() {
  return /** @type {goog.date.month} */ (this.date_.getMonth());
};


/**
 * @return {number} The date of month.
 */
goog.date.Date.prototype.getDate = function() {
  return this.date_.getDate();
};


/**
 * Returns the number of milliseconds since 1 January 1970 00:00:00.
 *
 * @return {number} The number of milliseconds since 1 January 1970 00:00:00.
 */
goog.date.Date.prototype.getTime = function() {
  return this.date_.getTime();
};


/**
 * @return {goog.date.weekDay} The day of week, US style. 0 = Sun, 6 = Sat.
 */
goog.date.Date.prototype.getDay = function() {
  return /** @type {goog.date.weekDay} */ (this.date_.getDay());
};


/**
 * @return {number} The day of week, ISO style. 0 = Mon, 6 = Sun.
 */
goog.date.Date.prototype.getIsoWeekday = function() {
  return (this.getDay() + 6) % 7;
};


/**
 * @return {number} The day of week according to firstDayOfWeek setting.
 */
goog.date.Date.prototype.getWeekday = function() {
  return (this.getIsoWeekday() - this.firstDayOfWeek_ + 7) % 7;
};


/**
 * @return {number} The four digit year of date according to universal time.
 */
goog.date.Date.prototype.getUTCFullYear = function() {
  return this.date_.getUTCFullYear();
};


/**
 * @return {goog.date.month} The month of date according to universal time,
 *     0 = Jan, 11 = Dec.
 */
goog.date.Date.prototype.getUTCMonth = function() {
  return /** @type {goog.date.month} */ (this.date_.getUTCMonth());
};


/**
 * @return {number} The date of month according to universal time.
 */
goog.date.Date.prototype.getUTCDate = function() {
  return this.date_.getUTCDate();
};


/**
 * @return {goog.date.weekDay} The day of week according to universal time,
 *     US style. 0 = Sun, 1 = Mon, 6 = Sat.
 */
goog.date.Date.prototype.getUTCDay = function() {
  return /** @type {goog.date.weekDay} */ (this.date_.getDay());
};


/**
 * @return {number} The hours value according to universal time.
 */
goog.date.Date.prototype.getUTCHours = function() {
  return this.date_.getUTCHours();
};


/**
 * @return {number} The hours value according to universal time.
 */
goog.date.Date.prototype.getUTCMinutes = function() {
  return this.date_.getUTCMinutes();
};


/**
 * @return {number} The day of week according to universal time, ISO style.
 *     0 = Mon, 6 = Sun.
 */
goog.date.Date.prototype.getUTCIsoWeekday = function() {
  return (this.date_.getUTCDay() + 6) % 7;
};


/**
 * @return {number} The day of week according to universal time and
 *     firstDayOfWeek setting.
 */
goog.date.Date.prototype.getUTCWeekday = function() {
  return (this.getUTCIsoWeekday() - this.firstDayOfWeek_ + 7) % 7;
};


/**
 * @return {number} The first day of the week. 0 = Mon, 6 = Sun.
 */
goog.date.Date.prototype.getFirstDayOfWeek = function() {
  return this.firstDayOfWeek_;
};


/**
 * @return {number} The cut off weekday used for week number calculations.
 *     0 = Mon, 6 = Sun.
 */
goog.date.Date.prototype.getFirstWeekCutOffDay = function() {
  return this.firstWeekCutOffDay_;
};


/**
 * @return {number} The number of days for the selected month.
 */
goog.date.Date.prototype.getNumberOfDaysInMonth = function() {
  return goog.date.getNumberOfDaysInMonth(this.getFullYear(), this.getMonth());
};


/**
 * @return {number} The week number.
 */
goog.date.Date.prototype.getWeekNumber = function() {
  return goog.date.getWeekNumber(
      this.getFullYear(), this.getMonth(), this.getDate(),
      this.firstWeekCutOffDay_, this.firstDayOfWeek_);
};


/**
 * @return {number} The day of year.
 */
goog.date.Date.prototype.getDayOfYear = function() {
  var dayOfYear = this.getDate();
  var year = this.getFullYear();
  for (var m = this.getMonth() - 1; m >= 0; m--) {
    dayOfYear += goog.date.getNumberOfDaysInMonth(year, m);
  }

  return dayOfYear;
};


/**
 * Returns timezone offset. The timezone offset is the delta in minutes between
 * UTC and your local time. E.g., UTC+10 returns -600. Daylight savings time
 * prevents this value from being constant.
 *
 * @return {number} The timezone offset.
 */
goog.date.Date.prototype.getTimezoneOffset = function() {
  return this.date_.getTimezoneOffset();
};


/**
 * Returns timezone offset as a string. Returns offset in [+-]HH:mm format or Z
 * for UTC.
 *
 * @return {string} The timezone offset as a string.
 */
goog.date.Date.prototype.getTimezoneOffsetString = function() {
  var tz;
  var offset = this.getTimezoneOffset();

  if (offset == 0) {
    tz = 'Z';
  } else {
    var n = Math.abs(offset) / 60;
    var h = Math.floor(n);
    var m = (n - h) * 60;
    tz = (offset > 0 ? '-' : '+') +
        goog.string.padNumber(h, 2) + ':' +
        goog.string.padNumber(m, 2);
  }

  return tz;
};


/**
 * Sets the date.
 *
 * @param {goog.date.Date} date Date object to set date from.
 */
goog.date.Date.prototype.set = function(date) {
  this.date_ = new Date(date.getFullYear(), date.getMonth(), date.getDate());
};


/**
 * Sets the year part of the date.
 *
 * @param {number} year Four digit year.
 */
goog.date.Date.prototype.setFullYear = function(year) {
  this.date_.setFullYear(year);
};


/**
 * Alias for setFullYear.
 *
 * @param {number} year Four digit year.
 * @see #setFullYear
 */
goog.date.Date.prototype.setYear = function(year) {
  this.setFullYear(year);
};


/**
 * Sets the month part of the date.
 *
 * TODO(nnaze): Update type to goog.date.month.
 *
 * @param {number} month The month, where 0 = Jan, 11 = Dec.
 */
goog.date.Date.prototype.setMonth = function(month) {
  this.date_.setMonth(month);
};


/**
 * Sets the day part of the date.
 *
 * @param {number} date The day part.
 */
goog.date.Date.prototype.setDate = function(date) {
  this.date_.setDate(date);
};


/**
 * Sets the value of the date object as expressed in the number of milliseconds
 * since 1 January 1970 00:00:00.
 *
 * @param {number} ms Number of milliseconds since 1 Jan 1970.
 */
goog.date.Date.prototype.setTime = function(ms) {
  this.date_.setTime(ms);
};


/**
 * Sets the year part of the date according to universal time.
 *
 * @param {number} year Four digit year.
 */
goog.date.Date.prototype.setUTCFullYear = function(year) {
  this.date_.setUTCFullYear(year);
};


/**
 * Sets the month part of the date according to universal time.
 *
 * @param {number} month The month, where 0 = Jan, 11 = Dec.
 */
goog.date.Date.prototype.setUTCMonth = function(month) {
  this.date_.setUTCMonth(month);
};


/**
 * Sets the day part of the date according to universal time.
 *
 * @param {number} date The UTC date.
 */
goog.date.Date.prototype.setUTCDate = function(date) {
  this.date_.setUTCDate(date);
};


/**
 * Sets the first day of week.
 *
 * @param {number} day 0 = Mon, 6 = Sun.
 */
goog.date.Date.prototype.setFirstDayOfWeek = function(day) {
  this.firstDayOfWeek_ = day;
};


/**
 * Sets cut off weekday used for week number calculations. 0 = Mon, 6 = Sun.
 *
 * @param {number} day The cut off weekday.
 */
goog.date.Date.prototype.setFirstWeekCutOffDay = function(day) {
  this.firstWeekCutOffDay_ = day;
};


/**
 * Performs date calculation by adding the supplied interval to the date.
 *
 * @param {goog.date.Interval} interval Date interval to add.
 */
goog.date.Date.prototype.add = function(interval) {
  if (interval.years || interval.months) {
    // As months have different number of days adding a month to Jan 31 by just
    // setting the month would result in a date in early March rather than Feb
    // 28 or 29. Doing it this way overcomes that problem.

    // adjust year and month, accounting for both directions
    var month = this.getMonth() + interval.months + interval.years * 12;
    var year = this.getYear() + Math.floor(month / 12);
    month %= 12;
    if (month < 0) {
      month += 12;
    }

    var daysInTargetMonth = goog.date.getNumberOfDaysInMonth(year, month);
    var date = Math.min(daysInTargetMonth, this.getDate());

    // avoid inadvertently causing rollovers to adjacent months
    this.setDate(1);

    this.setFullYear(year);
    this.setMonth(month);
    this.setDate(date);
  }

  if (interval.days) {
    // Convert the days to milliseconds and add it to the UNIX timestamp.
    // Taking noon helps to avoid 1 day error due to the daylight saving.
    var noon = new Date(this.getYear(), this.getMonth(), this.getDate(), 12);
    var result = new Date(noon.getTime() + interval.days * 86400000);

    // Set date to 1 to prevent rollover caused by setting the year or month.
    this.setDate(1);
    this.setFullYear(result.getFullYear());
    this.setMonth(result.getMonth());
    this.setDate(result.getDate());

    this.maybeFixDst_(result.getDate());
  }
};


/**
 * Returns ISO 8601 string representation of date.
 *
 * @param {boolean=} opt_verbose Whether the verbose format should be used
 *     instead of the default compact one.
 * @param {boolean=} opt_tz Whether the timezone offset should be included
 *     in the string.
 * @return {string} ISO 8601 string representation of date.
 */
goog.date.Date.prototype.toIsoString = function(opt_verbose, opt_tz) {
  var str = [
    this.getFullYear(),
    goog.string.padNumber(this.getMonth() + 1, 2),
    goog.string.padNumber(this.getDate(), 2)
  ];

  return str.join((opt_verbose) ? '-' : '') +
         (opt_tz ? this.getTimezoneOffsetString() : '');
};


/**
 * Returns ISO 8601 string representation of date according to universal time.
 *
 * @param {boolean=} opt_verbose Whether the verbose format should be used
 *     instead of the default compact one.
 * @param {boolean=} opt_tz Whether the timezone offset should be included in
 *     the string.
 * @return {string} ISO 8601 string representation of date according to
 *     universal time.
 */
goog.date.Date.prototype.toUTCIsoString = function(opt_verbose, opt_tz) {
  var str = [
    this.getUTCFullYear(),
    goog.string.padNumber(this.getUTCMonth() + 1, 2),
    goog.string.padNumber(this.getUTCDate(), 2)
  ];

  return str.join((opt_verbose) ? '-' : '') + (opt_tz ? 'Z' : '');
};


/**
 * Tests whether given date is equal to this Date.
 * Note: This ignores units more precise than days (hours and below)
 * and also ignores timezone considerations.
 *
 * @param {goog.date.Date} other The date to compare.
 * @return {boolean} Whether the given date is equal to this one.
 */
goog.date.Date.prototype.equals = function(other) {
  return this.getYear() == other.getYear() &&
         this.getMonth() == other.getMonth() &&
         this.getDate() == other.getDate();
};


/**
 * Overloaded toString method for object.
 * @return {string} ISO 8601 string representation of date.
 * @override
 */
goog.date.Date.prototype.toString = function() {
  return this.toIsoString();
};


/**
 * Fixes date to account for daylight savings time in browsers that fail to do
 * so automatically.
 * @param {number} expected Expected date.
 * @private
 */
goog.date.Date.prototype.maybeFixDst_ = function(expected) {
  if (this.getDate() != expected) {
    var dir = this.getDate() < expected ? 1 : -1;
    this.date_.setUTCHours(this.date_.getUTCHours() + dir);
  }
};


/**
 * @return {number} Value of wrapped date.
 * @override
 */
goog.date.Date.prototype.valueOf = function() {
  return this.date_.valueOf();
};


/**
 * Compares two dates.  May be used as a sorting function.
 * @see goog.array.sort
 * @param {!goog.date.DateLike} date1 Date to compare.
 * @param {!goog.date.DateLike} date2 Date to compare.
 * @return {number} Comparison result. 0 if dates are the same, less than 0 if
 *     date1 is earlier than date2, greater than 0 if date1 is later than date2.
 */
goog.date.Date.compare = function(date1, date2) {
  return date1.getTime() - date2.getTime();
};



/**
 * Class representing a date and time. Defaults to current date and time if none
 * is specified.
 *
 * Implements most methods of the native js Date object and can be used
 * interchangeably with it just as if goog.date.DateTime was a subclass of Date.
 *
 * @param {number|Object=} opt_year Four digit year or a date-like object. If
 *     not set, the created object will contain the date determined by
 *     goog.now().
 * @param {number=} opt_month Month, 0 = Jan, 11 = Dec.
 * @param {number=} opt_date Date of month, 1 - 31.
 * @param {number=} opt_hours Hours, 0 - 24.
 * @param {number=} opt_minutes Minutes, 0 - 59.
 * @param {number=} opt_seconds Seconds, 0 - 61.
 * @param {number=} opt_milliseconds Milliseconds, 0 - 999.
 * @constructor
 * @extends {goog.date.Date}
 */
goog.date.DateTime = function(opt_year, opt_month, opt_date, opt_hours,
                              opt_minutes, opt_seconds, opt_milliseconds) {
  if (goog.isNumber(opt_year)) {
    this.date_ = new Date(opt_year, opt_month || 0, opt_date || 1,
                          opt_hours || 0, opt_minutes || 0, opt_seconds || 0,
                          opt_milliseconds || 0);
  } else {
    this.date_ = new Date(opt_year ? opt_year.getTime() : goog.now());
  }
};
goog.inherits(goog.date.DateTime, goog.date.Date);


/**
 * Creates a DateTime from a datetime string expressed in RFC 822 format.
 *
 * @param {string} formatted A date or datetime expressed in RFC 822 format.
 * @return {goog.date.DateTime} Parsed date or null if parse fails.
 */
goog.date.DateTime.fromRfc822String = function(formatted) {
  var date = new Date(formatted);
  return !isNaN(date.getTime()) ? new goog.date.DateTime(date) : null;
};


/**
 * Returns the hours part of the datetime.
 *
 * @return {number} An integer between 0 and 23, representing the hour.
 */
goog.date.DateTime.prototype.getHours = function() {
  return this.date_.getHours();
};


/**
 * Returns the minutes part of the datetime.
 *
 * @return {number} An integer between 0 and 59, representing the minutes.
 */
goog.date.DateTime.prototype.getMinutes = function() {
  return this.date_.getMinutes();
};


/**
 * Returns the seconds part of the datetime.
 *
 * @return {number} An integer between 0 and 59, representing the seconds.
 */
goog.date.DateTime.prototype.getSeconds = function() {
  return this.date_.getSeconds();
};


/**
 * Returns the milliseconds part of the datetime.
 *
 * @return {number} An integer between 0 and 999, representing the milliseconds.
 */
goog.date.DateTime.prototype.getMilliseconds = function() {
  return this.date_.getMilliseconds();
};


/**
 * Returns the day of week according to universal time, US style.
 *
 * @return {goog.date.weekDay} Day of week, 0 = Sun, 1 = Mon, 6 = Sat.
 * @override
 */
goog.date.DateTime.prototype.getUTCDay = function() {
  return /** @type {goog.date.weekDay} */ (this.date_.getUTCDay());
};


/**
 * Returns the hours part of the datetime according to universal time.
 *
 * @return {number} An integer between 0 and 23, representing the hour.
 * @override
 */
goog.date.DateTime.prototype.getUTCHours = function() {
  return this.date_.getUTCHours();
};


/**
 * Returns the minutes part of the datetime according to universal time.
 *
 * @return {number} An integer between 0 and 59, representing the minutes.
 * @override
 */
goog.date.DateTime.prototype.getUTCMinutes = function() {
  return this.date_.getUTCMinutes();
};


/**
 * Returns the seconds part of the datetime according to universal time.
 *
 * @return {number} An integer between 0 and 59, representing the seconds.
 */
goog.date.DateTime.prototype.getUTCSeconds = function() {
  return this.date_.getUTCSeconds();
};


/**
 * Returns the milliseconds part of the datetime according to universal time.
 *
 * @return {number} An integer between 0 and 999, representing the milliseconds.
 */
goog.date.DateTime.prototype.getUTCMilliseconds = function() {
  return this.date_.getUTCMilliseconds();
};


/**
 * Sets the hours part of the datetime.
 *
 * @param {number} hours An integer between 0 and 23, representing the hour.
 */
goog.date.DateTime.prototype.setHours = function(hours) {
  this.date_.setHours(hours);
};


/**
 * Sets the minutes part of the datetime.
 *
 * @param {number} minutes Integer between 0 and 59, representing the minutes.
 */
goog.date.DateTime.prototype.setMinutes = function(minutes) {
  this.date_.setMinutes(minutes);
};


/**
 * Sets the seconds part of the datetime.
 *
 * @param {number} seconds Integer between 0 and 59, representing the seconds.
 */
goog.date.DateTime.prototype.setSeconds = function(seconds) {
  this.date_.setSeconds(seconds);
};


/**
 * Sets the seconds part of the datetime.
 *
 * @param {number} ms Integer between 0 and 999, representing the milliseconds.
 */
goog.date.DateTime.prototype.setMilliseconds = function(ms) {
  this.date_.setMilliseconds(ms);
};


/**
 * Sets the hours part of the datetime according to universal time.
 *
 * @param {number} hours An integer between 0 and 23, representing the hour.
 */
goog.date.DateTime.prototype.setUTCHours = function(hours) {
  this.date_.setUTCHours(hours);
};


/**
 * Sets the minutes part of the datetime according to universal time.
 *
 * @param {number} minutes Integer between 0 and 59, representing the minutes.
 */
goog.date.DateTime.prototype.setUTCMinutes = function(minutes) {
  this.date_.setUTCMinutes(minutes);
};


/**
 * Sets the seconds part of the datetime according to universal time.
 *
 * @param {number} seconds Integer between 0 and 59, representing the seconds.
 */
goog.date.DateTime.prototype.setUTCSeconds = function(seconds) {
  this.date_.setUTCSeconds(seconds);
};


/**
 * Sets the seconds part of the datetime according to universal time.
 *
 * @param {number} ms Integer between 0 and 999, representing the milliseconds.
 */
goog.date.DateTime.prototype.setUTCMilliseconds = function(ms) {
  this.date_.setUTCMilliseconds(ms);
};


/**
 * Performs date calculation by adding the supplied interval to the date.
 *
 * @param {goog.date.Interval} interval Date interval to add.
 * @override
 */
goog.date.DateTime.prototype.add = function(interval) {
  goog.date.Date.prototype.add.call(this, interval);

  if (interval.hours) {
    this.setHours(this.date_.getHours() + interval.hours);
  }
  if (interval.minutes) {
    this.setMinutes(this.date_.getMinutes() + interval.minutes);
  }
  if (interval.seconds) {
    this.setSeconds(this.date_.getSeconds() + interval.seconds);
  }
};


/**
 * Returns ISO 8601 string representation of date/time.
 *
 * @param {boolean=} opt_verbose Whether the verbose format should be used
 *     instead of the default compact one.
 * @param {boolean=} opt_tz Whether the timezone offset should be included
 *     in the string.
 * @return {string} ISO 8601 string representation of date/time.
 * @override
 */
goog.date.DateTime.prototype.toIsoString = function(opt_verbose, opt_tz) {
  var dateString = goog.date.Date.prototype.toIsoString.call(this, opt_verbose);

  if (opt_verbose) {
    return dateString + ' ' +
        goog.string.padNumber(this.getHours(), 2) + ':' +
        goog.string.padNumber(this.getMinutes(), 2) + ':' +
        goog.string.padNumber(this.getSeconds(), 2) +
        (opt_tz ? this.getTimezoneOffsetString() : '');
  }

  return dateString + 'T' +
      goog.string.padNumber(this.getHours(), 2) +
      goog.string.padNumber(this.getMinutes(), 2) +
      goog.string.padNumber(this.getSeconds(), 2) +
      (opt_tz ? this.getTimezoneOffsetString() : '');
};


/**
 * Returns XML Schema 2 string representation of date/time.
 * The return value is also ISO 8601 compliant.
 *
 * @param {boolean=} opt_timezone Should the timezone offset be included in the
 *     string?.
 * @return {string} XML Schema 2 string representation of date/time.
 */
goog.date.DateTime.prototype.toXmlDateTime = function(opt_timezone) {
  return goog.date.Date.prototype.toIsoString.call(this, true) + 'T' +
      goog.string.padNumber(this.getHours(), 2) + ':' +
      goog.string.padNumber(this.getMinutes(), 2) + ':' +
      goog.string.padNumber(this.getSeconds(), 2) +
      (opt_timezone ? this.getTimezoneOffsetString() : '');
};


/**
 * Returns ISO 8601 string representation of date/time according to universal
 * time.
 *
 * @param {boolean=} opt_verbose Whether the opt_verbose format should be
 *     returned instead of the default compact one.
 * @param {boolean=} opt_tz Whether the the timezone offset should be included
 *     in the string.
 * @return {string} ISO 8601 string representation of date/time according to
 *     universal time.
 * @override
 */
goog.date.DateTime.prototype.toUTCIsoString = function(opt_verbose, opt_tz) {
  var dateStr = goog.date.Date.prototype.toUTCIsoString.call(this, opt_verbose);

  if (opt_verbose) {
    return dateStr + ' ' +
        goog.string.padNumber(this.getUTCHours(), 2) + ':' +
        goog.string.padNumber(this.getUTCMinutes(), 2) + ':' +
        goog.string.padNumber(this.getUTCSeconds(), 2) +
        (opt_tz ? 'Z' : '');
  }

  return dateStr + 'T' +
      goog.string.padNumber(this.getUTCHours(), 2) +
      goog.string.padNumber(this.getUTCMinutes(), 2) +
      goog.string.padNumber(this.getUTCSeconds(), 2) +
      (opt_tz ? 'Z' : '');
};


/**
 * Tests whether given datetime is exactly equal to this DateTime.
 *
 * @param {goog.date.Date} other The datetime to compare.
 * @return {boolean} Whether the given datetime is exactly equal to this one.
 * @override
 */
goog.date.DateTime.prototype.equals = function(other) {
  return this.getTime() == other.getTime();
};


/**
 * Overloaded toString method for object.
 * @return {string} ISO 8601 string representation of date/time.
 * @override
 */
goog.date.DateTime.prototype.toString = function() {
  return this.toIsoString();
};


/**
 * Generates time label for the datetime, e.g., '5:30am'.
 * By default this does not pad hours (e.g., to '05:30') and it does add
 * an am/pm suffix.
 * TODO(user): i18n -- hardcoding time format like this is bad.  E.g., in CJK
 *               locales, need Chinese characters for hour and minute units.
 * @param {boolean=} opt_padHours Whether to pad hours, e.g., '05:30' vs '5:30'.
 * @param {boolean=} opt_showAmPm Whether to show the 'am' and 'pm' suffix.
 * @param {boolean=} opt_omitZeroMinutes E.g., '5:00pm' becomes '5pm',
 *                                      but '5:01pm' remains '5:01pm'.
 * @return {string} The time label.
 */
goog.date.DateTime.prototype.toUsTimeString = function(opt_padHours,
                                                       opt_showAmPm,
                                                       opt_omitZeroMinutes) {
  var hours = this.getHours();

  // show am/pm marker by default
  if (!goog.isDef(opt_showAmPm)) {
    opt_showAmPm = true;
  }

  // 12pm
  var isPM = hours == 12;

  // change from 1-24 to 1-12 basis
  if (hours > 12) {
    hours -= 12;
    isPM = true;
  }

  // midnight is expressed as "12am", but if am/pm marker omitted, keep as '0'
  if (hours == 0 && opt_showAmPm) {
    hours = 12;
  }

  var label = opt_padHours ? goog.string.padNumber(hours, 2) : String(hours);
  var minutes = this.getMinutes();
  if (!opt_omitZeroMinutes || minutes > 0) {
    label += ':' + goog.string.padNumber(minutes, 2);
  }

  // by default, show am/pm suffix
  if (opt_showAmPm) {
    /**
     * @desc Suffix for morning times.
     */
    var MSG_TIME_AM = goog.getMsg('am');

    /**
     * @desc Suffix for afternoon times.
     */
    var MSG_TIME_PM = goog.getMsg('pm');

    label += isPM ? MSG_TIME_PM : MSG_TIME_AM;
  }
  return label;
};


/**
 * Generates time label for the datetime in standard ISO 24-hour time format.
 * E.g., '06:00:00' or '23:30:15'.
 * @param {boolean=} opt_showSeconds Whether to shows seconds. Defaults to TRUE.
 * @return {string} The time label.
 */
goog.date.DateTime.prototype.toIsoTimeString = function(opt_showSeconds) {
  var hours = this.getHours();
  var label = goog.string.padNumber(hours, 2) +
              ':' +
              goog.string.padNumber(this.getMinutes(), 2);
  if (!goog.isDef(opt_showSeconds) || opt_showSeconds) {
    label += ':' + goog.string.padNumber(this.getSeconds(), 2);
  }
  return label;
};


/**
 * @return {!goog.date.DateTime} A clone of the datetime object.
 * @override
 */
goog.date.DateTime.prototype.clone = function() {
  var date = new goog.date.DateTime(this.date_);
  date.setFirstDayOfWeek(this.getFirstDayOfWeek());
  date.setFirstWeekCutOffDay(this.getFirstWeekCutOffDay());
  return date;
};

// Input 8
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for manipulating objects/maps/hashes.
 */

goog.provide('goog.object');


/**
 * Calls a function for each element in an object/map/hash.
 *
 * @param {Object.<K,V>} obj The object over which to iterate.
 * @param {function(this:T,V,?,Object.<K,V>):?} f The function to call
 *     for every element. This function takes 3 arguments (the element, the
 *     index and the object) and the return value is ignored.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @template T,K,V
 */
goog.object.forEach = function(obj, f, opt_obj) {
  for (var key in obj) {
    f.call(opt_obj, obj[key], key, obj);
  }
};


/**
 * Calls a function for each element in an object/map/hash. If that call returns
 * true, adds the element to a new object.
 *
 * @param {Object.<K,V>} obj The object over which to iterate.
 * @param {function(this:T,V,?,Object.<K,V>):boolean} f The function to call
 *     for every element. This
 *     function takes 3 arguments (the element, the index and the object)
 *     and should return a boolean. If the return value is true the
 *     element is added to the result object. If it is false the
 *     element is not included.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @return {!Object.<K,V>} a new object in which only elements that passed the
 *     test are present.
 * @template T,K,V
 */
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for (var key in obj) {
    if (f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key];
    }
  }
  return res;
};


/**
 * For every element in an object/map/hash calls a function and inserts the
 * result into a new object.
 *
 * @param {Object.<K,V>} obj The object over which to iterate.
 * @param {function(this:T,V,?,Object.<K,V>):R} f The function to call
 *     for every element. This function
 *     takes 3 arguments (the element, the index and the object)
 *     and should return something. The result will be inserted
 *     into a new object.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @return {!Object.<T,R>} a new object with the results from f.
 * @template T,K,V,R
 */
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for (var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj);
  }
  return res;
};


/**
 * Calls a function for each element in an object/map/hash. If any
 * call returns true, returns true (without checking the rest). If
 * all calls return false, returns false.
 *
 * @param {Object.<K,V>} obj The object to check.
 * @param {function(this:T,V,?,Object.<K,V>):boolean} f The function to
 *     call for every element. This function
 *     takes 3 arguments (the element, the index and the object) and should
 *     return a boolean.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @return {boolean} true if any element passes the test.
 * @template T,K,V
 */
goog.object.some = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (f.call(opt_obj, obj[key], key, obj)) {
      return true;
    }
  }
  return false;
};


/**
 * Calls a function for each element in an object/map/hash. If
 * all calls return true, returns true. If any call returns false, returns
 * false at this point and does not continue to check the remaining elements.
 *
 * @param {Object.<K,V>} obj The object to check.
 * @param {?function(this:T,V,?,Object.<K,V>):boolean} f The function to
 *     call for every element. This function
 *     takes 3 arguments (the element, the index and the object) and should
 *     return a boolean.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @return {boolean} false if any element fails the test.
 * @template T,K,V
 */
goog.object.every = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (!f.call(opt_obj, obj[key], key, obj)) {
      return false;
    }
  }
  return true;
};


/**
 * Returns the number of key-value pairs in the object map.
 *
 * @param {Object} obj The object for which to get the number of key-value
 *     pairs.
 * @return {number} The number of key-value pairs in the object map.
 */
goog.object.getCount = function(obj) {
  // JS1.5 has __count__ but it has been deprecated so it raises a warning...
  // in other words do not use. Also __count__ only includes the fields on the
  // actual object and not in the prototype chain.
  var rv = 0;
  for (var key in obj) {
    rv++;
  }
  return rv;
};


/**
 * Returns one key from the object map, if any exists.
 * For map literals the returned key will be the first one in most of the
 * browsers (a know exception is Konqueror).
 *
 * @param {Object} obj The object to pick a key from.
 * @return {string|undefined} The key or undefined if the object is empty.
 */
goog.object.getAnyKey = function(obj) {
  for (var key in obj) {
    return key;
  }
};


/**
 * Returns one value from the object map, if any exists.
 * For map literals the returned value will be the first one in most of the
 * browsers (a know exception is Konqueror).
 *
 * @param {Object.<K,V>} obj The object to pick a value from.
 * @return {V|undefined} The value or undefined if the object is empty.
 * @template K,V
 */
goog.object.getAnyValue = function(obj) {
  for (var key in obj) {
    return obj[key];
  }
};


/**
 * Whether the object/hash/map contains the given object as a value.
 * An alias for goog.object.containsValue(obj, val).
 *
 * @param {Object.<K,V>} obj The object in which to look for val.
 * @param {V} val The object for which to check.
 * @return {boolean} true if val is present.
 * @template K,V
 */
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val);
};


/**
 * Returns the values of the object/map/hash.
 *
 * @param {Object.<K,V>} obj The object from which to get the values.
 * @return {!Array.<V>} The values in the object/map/hash.
 * @template K,V
 */
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    res[i++] = obj[key];
  }
  return res;
};


/**
 * Returns the keys of the object/map/hash.
 *
 * @param {Object} obj The object from which to get the keys.
 * @return {!Array.<string>} Array of property keys.
 */
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    res[i++] = key;
  }
  return res;
};


/**
 * Get a value from an object multiple levels deep.  This is useful for
 * pulling values from deeply nested objects, such as JSON responses.
 * Example usage: getValueByKeys(jsonObj, 'foo', 'entries', 3)
 *
 * @param {!Object} obj An object to get the value from.  Can be array-like.
 * @param {...(string|number|!Array.<number|string>)} var_args A number of keys
 *     (as strings, or nubmers, for array-like objects).  Can also be
 *     specified as a single array of keys.
 * @return {*} The resulting value.  If, at any point, the value for a key
 *     is undefined, returns undefined.
 */
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;

  // Start with the 2nd parameter for the variable parameters syntax.
  for (var i = isArrayLike ? 0 : 1; i < keys.length; i++) {
    obj = obj[keys[i]];
    if (!goog.isDef(obj)) {
      break;
    }
  }

  return obj;
};


/**
 * Whether the object/map/hash contains the given key.
 *
 * @param {Object} obj The object in which to look for key.
 * @param {*} key The key for which to check.
 * @return {boolean} true If the map contains the key.
 */
goog.object.containsKey = function(obj, key) {
  return key in obj;
};


/**
 * Whether the object/map/hash contains the given value. This is O(n).
 *
 * @param {Object.<K,V>} obj The object in which to look for val.
 * @param {V} val The value for which to check.
 * @return {boolean} true If the map contains the value.
 * @template K,V
 */
goog.object.containsValue = function(obj, val) {
  for (var key in obj) {
    if (obj[key] == val) {
      return true;
    }
  }
  return false;
};


/**
 * Searches an object for an element that satisfies the given condition and
 * returns its key.
 * @param {Object.<K,V>} obj The object to search in.
 * @param {function(this:T,V,string,Object.<K,V>):boolean} f The
 *      function to call for every element. Takes 3 arguments (the value,
 *     the key and the object) and should return a boolean.
 * @param {T=} opt_this An optional "this" context for the function.
 * @return {string|undefined} The key of an element for which the function
 *     returns true or undefined if no such element is found.
 * @template T,K,V
 */
goog.object.findKey = function(obj, f, opt_this) {
  for (var key in obj) {
    if (f.call(opt_this, obj[key], key, obj)) {
      return key;
    }
  }
  return undefined;
};


/**
 * Searches an object for an element that satisfies the given condition and
 * returns its value.
 * @param {Object.<K,V>} obj The object to search in.
 * @param {function(this:T,V,string,Object.<K,V>):boolean} f The function
 *     to call for every element. Takes 3 arguments (the value, the key
 *     and the object) and should return a boolean.
 * @param {T=} opt_this An optional "this" context for the function.
 * @return {V} The value of an element for which the function returns true or
 *     undefined if no such element is found.
 * @template T,K,V
 */
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key];
};


/**
 * Whether the object/map/hash is empty.
 *
 * @param {Object} obj The object to test.
 * @return {boolean} true if obj is empty.
 */
goog.object.isEmpty = function(obj) {
  for (var key in obj) {
    return false;
  }
  return true;
};


/**
 * Removes all key value pairs from the object/map/hash.
 *
 * @param {Object} obj The object to clear.
 */
goog.object.clear = function(obj) {
  for (var i in obj) {
    delete obj[i];
  }
};


/**
 * Removes a key-value pair based on the key.
 *
 * @param {Object} obj The object from which to remove the key.
 * @param {*} key The key to remove.
 * @return {boolean} Whether an element was removed.
 */
goog.object.remove = function(obj, key) {
  var rv;
  if ((rv = key in obj)) {
    delete obj[key];
  }
  return rv;
};


/**
 * Adds a key-value pair to the object. Throws an exception if the key is
 * already in use. Use set if you want to change an existing pair.
 *
 * @param {Object.<K,V>} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {V} val The value to add.
 * @template K,V
 */
goog.object.add = function(obj, key, val) {
  if (key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val);
};


/**
 * Returns the value for the given key.
 *
 * @param {Object.<K,V>} obj The object from which to get the value.
 * @param {string} key The key for which to get the value.
 * @param {R=} opt_val The value to return if no item is found for the given
 *     key (default is undefined).
 * @return {V|R|undefined} The value for the given key.
 * @template K,V,R
 */
goog.object.get = function(obj, key, opt_val) {
  if (key in obj) {
    return obj[key];
  }
  return opt_val;
};


/**
 * Adds a key-value pair to the object/map/hash.
 *
 * @param {Object.<K,V>} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {K} value The value to add.
 * @template K,V
 */
goog.object.set = function(obj, key, value) {
  obj[key] = value;
};


/**
 * Adds a key-value pair to the object/map/hash if it doesn't exist yet.
 *
 * @param {Object.<K,V>} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {V} value The value to add if the key wasn't present.
 * @return {V} The value of the entry at the end of the function.
 * @template K,V
 */
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : (obj[key] = value);
};


/**
 * Does a flat clone of the object.
 *
 * @param {Object.<K,V>} obj Object to clone.
 * @return {!Object.<K,V>} Clone of the input object.
 * @template K,V
 */
goog.object.clone = function(obj) {
  // We cannot use the prototype trick because a lot of methods depend on where
  // the actual key is set.

  var res = {};
  for (var key in obj) {
    res[key] = obj[key];
  }
  return res;
  // We could also use goog.mixin but I wanted this to be independent from that.
};


/**
 * Clones a value. The input may be an Object, Array, or basic type. Objects and
 * arrays will be cloned recursively.
 *
 * WARNINGS:
 * <code>goog.object.unsafeClone</code> does not detect reference loops. Objects
 * that refer to themselves will cause infinite recursion.
 *
 * <code>goog.object.unsafeClone</code> is unaware of unique identifiers, and
 * copies UIDs created by <code>getUid</code> into cloned results.
 *
 * @param {*} obj The value to clone.
 * @return {*} A clone of the input value.
 */
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key]);
    }
    return clone;
  }

  return obj;
};


/**
 * Returns a new object in which all the keys and values are interchanged
 * (keys become values and values become keys). If multiple keys map to the
 * same value, the chosen transposed value is implementation-dependent.
 *
 * @param {Object} obj The object to transpose.
 * @return {!Object} The transposed object.
 */
goog.object.transpose = function(obj) {
  var transposed = {};
  for (var key in obj) {
    transposed[obj[key]] = key;
  }
  return transposed;
};


/**
 * The names of the fields that are defined on Object.prototype.
 * @type {Array.<string>}
 * @private
 */
goog.object.PROTOTYPE_FIELDS_ = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];


/**
 * Extends an object with another object.
 * This operates 'in-place'; it does not create a new Object.
 *
 * Example:
 * var o = {};
 * goog.object.extend(o, {a: 0, b: 1});
 * o; // {a: 0, b: 1}
 * goog.object.extend(o, {c: 2});
 * o; // {a: 0, b: 1, c: 2}
 *
 * @param {Object} target  The object to modify.
 * @param {...Object} var_args The objects from which values will be copied.
 */
goog.object.extend = function(target, var_args) {
  var key, source;
  for (var i = 1; i < arguments.length; i++) {
    source = arguments[i];
    for (key in source) {
      target[key] = source[key];
    }

    // For IE the for-in-loop does not contain any properties that are not
    // enumerable on the prototype object (for example isPrototypeOf from
    // Object.prototype) and it will also not include 'replace' on objects that
    // extend String and change 'replace' (not that it is common for anyone to
    // extend anything except Object).

    for (var j = 0; j < goog.object.PROTOTYPE_FIELDS_.length; j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
};


/**
 * Creates a new object built from the key-value pairs provided as arguments.
 * @param {...*} var_args If only one argument is provided and it is an array
 *     then this is used as the arguments,  otherwise even arguments are used as
 *     the property names and odd arguments are used as the property values.
 * @return {!Object} The new object.
 * @throws {Error} If there are uneven number of arguments or there is only one
 *     non array argument.
 */
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if (argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0]);
  }

  if (argLength % 2) {
    throw Error('Uneven number of arguments');
  }

  var rv = {};
  for (var i = 0; i < argLength; i += 2) {
    rv[arguments[i]] = arguments[i + 1];
  }
  return rv;
};


/**
 * Creates a new object where the property names come from the arguments but
 * the value is always set to true
 * @param {...*} var_args If only one argument is provided and it is an array
 *     then this is used as the arguments,  otherwise the arguments are used
 *     as the property names.
 * @return {!Object} The new object.
 */
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if (argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0]);
  }

  var rv = {};
  for (var i = 0; i < argLength; i++) {
    rv[arguments[i]] = true;
  }
  return rv;
};


/**
 * Creates an immutable view of the underlying object, if the browser
 * supports immutable objects.
 *
 * In default mode, writes to this view will fail silently. In strict mode,
 * they will throw an error.
 *
 * @param {!Object.<K,V>} obj An object.
 * @return {!Object.<K,V>} An immutable view of that object, or the
 *     original object if this browser does not support immutables.
 * @template K,V
 */
goog.object.createImmutableView = function(obj) {
  var result = obj;
  if (Object.isFrozen && !Object.isFrozen(obj)) {
    result = Object.create(obj);
    Object.freeze(result);
  }
  return result;
};


/**
 * @param {!Object} obj An object.
 * @return {boolean} Whether this is an immutable view of the object.
 */
goog.object.isImmutableView = function(obj) {
  return !!Object.isFrozen && Object.isFrozen(obj);
};

// Input 9
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Generics method for collection-like classes and objects.
 *
 * @author arv@google.com (Erik Arvidsson)
 *
 * This file contains functions to work with collections. It supports using
 * Map, Set, Array and Object and other classes that implement collection-like
 * methods.
 */


goog.provide('goog.structs');

goog.require('goog.array');
goog.require('goog.object');


// We treat an object as a dictionary if it has getKeys or it is an object that
// isn't arrayLike.


/**
 * Returns the number of values in the collection-like object.
 * @param {Object} col The collection-like object.
 * @return {number} The number of values in the collection-like object.
 */
goog.structs.getCount = function(col) {
  if (typeof col.getCount == 'function') {
    return col.getCount();
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return col.length;
  }
  return goog.object.getCount(col);
};


/**
 * Returns the values of the collection-like object.
 * @param {Object} col The collection-like object.
 * @return {!Array} The values in the collection-like object.
 */
goog.structs.getValues = function(col) {
  if (typeof col.getValues == 'function') {
    return col.getValues();
  }
  if (goog.isString(col)) {
    return col.split('');
  }
  if (goog.isArrayLike(col)) {
    var rv = [];
    var l = col.length;
    for (var i = 0; i < l; i++) {
      rv.push(col[i]);
    }
    return rv;
  }
  return goog.object.getValues(col);
};


/**
 * Returns the keys of the collection. Some collections have no notion of
 * keys/indexes and this function will return undefined in those cases.
 * @param {Object} col The collection-like object.
 * @return {!Array|undefined} The keys in the collection.
 */
goog.structs.getKeys = function(col) {
  if (typeof col.getKeys == 'function') {
    return col.getKeys();
  }
  // if we have getValues but no getKeys we know this is a key-less collection
  if (typeof col.getValues == 'function') {
    return undefined;
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    var rv = [];
    var l = col.length;
    for (var i = 0; i < l; i++) {
      rv.push(i);
    }
    return rv;
  }

  return goog.object.getKeys(col);
};


/**
 * Whether the collection contains the given value. This is O(n) and uses
 * equals (==) to test the existence.
 * @param {Object} col The collection-like object.
 * @param {*} val The value to check for.
 * @return {boolean} True if the map contains the value.
 */
goog.structs.contains = function(col, val) {
  if (typeof col.contains == 'function') {
    return col.contains(val);
  }
  if (typeof col.containsValue == 'function') {
    return col.containsValue(val);
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.contains(/** @type {Array} */ (col), val);
  }
  return goog.object.containsValue(col, val);
};


/**
 * Whether the collection is empty.
 * @param {Object} col The collection-like object.
 * @return {boolean} True if empty.
 */
goog.structs.isEmpty = function(col) {
  if (typeof col.isEmpty == 'function') {
    return col.isEmpty();
  }

  // We do not use goog.string.isEmpty because here we treat the string as
  // collection and as such even whitespace matters

  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.isEmpty(/** @type {Array} */ (col));
  }
  return goog.object.isEmpty(col);
};


/**
 * Removes all the elements from the collection.
 * @param {Object} col The collection-like object.
 */
goog.structs.clear = function(col) {
  // NOTE(arv): This should not contain strings because strings are immutable
  if (typeof col.clear == 'function') {
    col.clear();
  } else if (goog.isArrayLike(col)) {
    goog.array.clear(/** @type {goog.array.ArrayLike} */ (col));
  } else {
    goog.object.clear(col);
  }
};


/**
 * Calls a function for each value in a collection. The function takes
 * three arguments; the value, the key and the collection.
 *
 * @param {S} col The collection-like object.
 * @param {function(this:T,?,?,S):?} f The function to call for every value.
 *     This function takes
 *     3 arguments (the value, the key or undefined if the collection has no
 *     notion of keys, and the collection) and the return value is irrelevant.
 * @param {T=} opt_obj The object to be used as the value of 'this'
 *     within {@code f}.
 * @template T,S
 */
goog.structs.forEach = function(col, f, opt_obj) {
  if (typeof col.forEach == 'function') {
    col.forEach(f, opt_obj);
  } else if (goog.isArrayLike(col) || goog.isString(col)) {
    goog.array.forEach(/** @type {Array} */ (col), f, opt_obj);
  } else {
    var keys = goog.structs.getKeys(col);
    var values = goog.structs.getValues(col);
    var l = values.length;
    for (var i = 0; i < l; i++) {
      f.call(opt_obj, values[i], keys && keys[i], col);
    }
  }
};


/**
 * Calls a function for every value in the collection. When a call returns true,
 * adds the value to a new collection (Array is returned by default).
 *
 * @param {S} col The collection-like object.
 * @param {function(this:T,?,?,S):boolean} f The function to call for every
 *     value. This function takes
 *     3 arguments (the value, the key or undefined if the collection has no
 *     notion of keys, and the collection) and should return a Boolean. If the
 *     return value is true the value is added to the result collection. If it
 *     is false the value is not included.
 * @param {T=} opt_obj The object to be used as the value of 'this'
 *     within {@code f}.
 * @return {!Object|!Array} A new collection where the passed values are
 *     present. If col is a key-less collection an array is returned.  If col
 *     has keys and values a plain old JS object is returned.
 * @template T,S
 */
goog.structs.filter = function(col, f, opt_obj) {
  if (typeof col.filter == 'function') {
    return col.filter(f, opt_obj);
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(/** @type {!Array} */ (col), f, opt_obj);
  }

  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if (keys) {
    rv = {};
    for (var i = 0; i < l; i++) {
      if (f.call(opt_obj, values[i], keys[i], col)) {
        rv[keys[i]] = values[i];
      }
    }
  } else {
    // We should not use goog.array.filter here since we want to make sure that
    // the index is undefined as well as make sure that col is passed to the
    // function.
    rv = [];
    for (var i = 0; i < l; i++) {
      if (f.call(opt_obj, values[i], undefined, col)) {
        rv.push(values[i]);
      }
    }
  }
  return rv;
};


/**
 * Calls a function for every value in the collection and adds the result into a
 * new collection (defaults to creating a new Array).
 *
 * @param {S} col The collection-like object.
 * @param {function(this:T,?,?,S):V} f The function to call for every value.
 *     This function takes 3 arguments (the value, the key or undefined if the
 *     collection has no notion of keys, and the collection) and should return
 *     something. The result will be used as the value in the new collection.
 * @param {T=} opt_obj  The object to be used as the value of 'this'
 *     within {@code f}.
 * @return {!Object.<V>|!Array.<V>} A new collection with the new values.  If
 *     col is a key-less collection an array is returned.  If col has keys and
 *     values a plain old JS object is returned.
 * @template T,S,V
 */
goog.structs.map = function(col, f, opt_obj) {
  if (typeof col.map == 'function') {
    return col.map(f, opt_obj);
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(/** @type {!Array} */ (col), f, opt_obj);
  }

  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if (keys) {
    rv = {};
    for (var i = 0; i < l; i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col);
    }
  } else {
    // We should not use goog.array.map here since we want to make sure that
    // the index is undefined as well as make sure that col is passed to the
    // function.
    rv = [];
    for (var i = 0; i < l; i++) {
      rv[i] = f.call(opt_obj, values[i], undefined, col);
    }
  }
  return rv;
};


/**
 * Calls f for each value in a collection. If any call returns true this returns
 * true (without checking the rest). If all returns false this returns false.
 *
 * @param {S} col The collection-like object.
 * @param {function(this:T,?,?,S):boolean} f The function to call for every
 *     value. This function takes 3 arguments (the value, the key or undefined
 *     if the collection has no notion of keys, and the collection) and should
 *     return a boolean.
 * @param {T=} opt_obj  The object to be used as the value of 'this'
 *     within {@code f}.
 * @return {boolean} True if any value passes the test.
 * @template T,S
 */
goog.structs.some = function(col, f, opt_obj) {
  if (typeof col.some == 'function') {
    return col.some(f, opt_obj);
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(/** @type {!Array} */ (col), f, opt_obj);
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for (var i = 0; i < l; i++) {
    if (f.call(opt_obj, values[i], keys && keys[i], col)) {
      return true;
    }
  }
  return false;
};


/**
 * Calls f for each value in a collection. If all calls return true this return
 * true this returns true. If any returns false this returns false at this point
 *  and does not continue to check the remaining values.
 *
 * @param {S} col The collection-like object.
 * @param {function(this:T,?,?,S):boolean} f The function to call for every
 *     value. This function takes 3 arguments (the value, the key or
 *     undefined if the collection has no notion of keys, and the collection)
 *     and should return a boolean.
 * @param {T=} opt_obj  The object to be used as the value of 'this'
 *     within {@code f}.
 * @return {boolean} True if all key-value pairs pass the test.
 * @template T,S
 */
goog.structs.every = function(col, f, opt_obj) {
  if (typeof col.every == 'function') {
    return col.every(f, opt_obj);
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(/** @type {!Array} */ (col), f, opt_obj);
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for (var i = 0; i < l; i++) {
    if (!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return false;
    }
  }
  return true;
};

// Input 10
// Copyright 2011 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Defines the collection interface.
 *
 * @author nnaze@google.com (Nathan Naze)
 */

goog.provide('goog.structs.Collection');



/**
 * An interface for a collection of values.
 * @interface
 */
goog.structs.Collection = function() {};


/**
 * @param {*} value Value to add to the collection.
 */
goog.structs.Collection.prototype.add;


/**
 * @param {*} value Value to remove from the collection.
 */
goog.structs.Collection.prototype.remove;


/**
 * @param {*} value Value to find in the tree.
 * @return {boolean} Whether the collection contains the specified value.
 */
goog.structs.Collection.prototype.contains;


/**
 * @return {number} The number of values stored in the collection.
 */
goog.structs.Collection.prototype.getCount;


// Input 11
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Python style iteration utilities.
 * @author arv@google.com (Erik Arvidsson)
 */


goog.provide('goog.iter');
goog.provide('goog.iter.Iterator');
goog.provide('goog.iter.StopIteration');

goog.require('goog.array');
goog.require('goog.asserts');


// TODO(nnaze): Add more functions from Python's itertools.
// http://docs.python.org/library/itertools.html


/**
 * @typedef {goog.iter.Iterator|{length:number}|{__iterator__}}
 */
goog.iter.Iterable;


// For script engines that already support iterators.
if ('StopIteration' in goog.global) {
  /**
   * Singleton Error object that is used to terminate iterations.
   * @type {Error}
   */
  goog.iter.StopIteration = goog.global['StopIteration'];
} else {
  /**
   * Singleton Error object that is used to terminate iterations.
   * @type {Error}
   * @suppress {duplicate}
   */
  goog.iter.StopIteration = Error('StopIteration');
}



/**
 * Class/interface for iterators.  An iterator needs to implement a {@code next}
 * method and it needs to throw a {@code goog.iter.StopIteration} when the
 * iteration passes beyond the end.  Iterators have no {@code hasNext} method.
 * It is recommended to always use the helper functions to iterate over the
 * iterator or in case you are only targeting JavaScript 1.7 for in loops.
 * @constructor
 */
goog.iter.Iterator = function() {};


/**
 * Returns the next value of the iteration.  This will throw the object
 * {@see goog.iter#StopIteration} when the iteration passes the end.
 * @return {*} Any object or value.
 */
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};


/**
 * Returns the {@code Iterator} object itself.  This is used to implement
 * the iterator protocol in JavaScript 1.7
 * @param {boolean=} opt_keys  Whether to return the keys or values. Default is
 *     to only return the values.  This is being used by the for-in loop (true)
 *     and the for-each-in loop (false).  Even though the param gives a hint
 *     about what the iterator will return there is no guarantee that it will
 *     return the keys when true is passed.
 * @return {!goog.iter.Iterator} The object itself.
 */
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this;
};


/**
 * Returns an iterator that knows how to iterate over the values in the object.
 * @param {goog.iter.Iterable} iterable  If the object is an iterator it
 *     will be returned as is.  If the object has a {@code __iterator__} method
 *     that will be called to get the value iterator.  If the object is an
 *     array-like object we create an iterator for that.
 * @return {!goog.iter.Iterator} An iterator that knows how to iterate over the
 *     values in {@code iterable}.
 */
goog.iter.toIterator = function(iterable) {
  if (iterable instanceof goog.iter.Iterator) {
    return iterable;
  }
  if (typeof iterable.__iterator__ == 'function') {
    return iterable.__iterator__(false);
  }
  if (goog.isArrayLike(iterable)) {
    var i = 0;
    var newIter = new goog.iter.Iterator;
    newIter.next = function() {
      while (true) {
        if (i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        // Don't include deleted elements.
        if (!(i in iterable)) {
          i++;
          continue;
        }
        return iterable[i++];
      }
    };
    return newIter;
  }


  // TODO(arv): Should we fall back on goog.structs.getValues()?
  throw Error('Not implemented');
};


/**
 * Calls a function for each element in the iterator with the element of the
 * iterator passed as argument.
 *
 * @param {goog.iter.Iterable} iterable  The iterator to iterate
 *     over.  If the iterable is an object {@code toIterator} will be called on
 *     it.
* @param {function(this:T,?,?,?):?} f  The function to call for every
 *     element.  This function
 *     takes 3 arguments (the element, undefined, and the iterator) and the
 *     return value is irrelevant.  The reason for passing undefined as the
 *     second argument is so that the same function can be used in
 *     {@see goog.array#forEach} as well as others.
 * @param {T=} opt_obj  The object to be used as the value of 'this' within
 *     {@code f}.
 * @template T
 */
goog.iter.forEach = function(iterable, f, opt_obj) {
  if (goog.isArrayLike(iterable)) {
    /** @preserveTry */
    try {
      // NOTES: this passes the index number to the second parameter
      // of the callback contrary to the documentation above.
      goog.array.forEach(/** @type {goog.array.ArrayLike} */(iterable), f,
                         opt_obj);
    } catch (ex) {
      if (ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  } else {
    iterable = goog.iter.toIterator(iterable);
    /** @preserveTry */
    try {
      while (true) {
        f.call(opt_obj, iterable.next(), undefined, iterable);
      }
    } catch (ex) {
      if (ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }
};


/**
 * Calls a function for every element in the iterator, and if the function
 * returns true adds the element to a new iterator.
 *
 * @param {goog.iter.Iterable} iterable The iterator to iterate over.
 * @param {function(this:T,?,undefined,?):boolean} f The function to call for
 *     every element. This function
 *     takes 3 arguments (the element, undefined, and the iterator) and should
 *     return a boolean.  If the return value is true the element will be
 *     included  in the returned iteror.  If it is false the element is not
 *     included.
 * @param {T=} opt_obj The object to be used as the value of 'this' within
 *     {@code f}.
 * @return {!goog.iter.Iterator} A new iterator in which only elements that
 *     passed the test are present.
 * @template T
 */
goog.iter.filter = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while (true) {
      var val = iterator.next();
      if (f.call(opt_obj, val, undefined, iterator)) {
        return val;
      }
    }
  };
  return newIter;
};


/**
 * Creates a new iterator that returns the values in a range.  This function
 * can take 1, 2 or 3 arguments:
 * <pre>
 * range(5) same as range(0, 5, 1)
 * range(2, 5) same as range(2, 5, 1)
 * </pre>
 *
 * @param {number} startOrStop  The stop value if only one argument is provided.
 *     The start value if 2 or more arguments are provided.  If only one
 *     argument is used the start value is 0.
 * @param {number=} opt_stop  The stop value.  If left out then the first
 *     argument is used as the stop value.
 * @param {number=} opt_step  The number to increment with between each call to
 *     next.  This can be negative.
 * @return {!goog.iter.Iterator} A new iterator that returns the values in the
 *     range.
 */
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0;
  var stop = startOrStop;
  var step = opt_step || 1;
  if (arguments.length > 1) {
    start = startOrStop;
    stop = opt_stop;
  }
  if (step == 0) {
    throw Error('Range step argument must not be zero');
  }

  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if (step > 0 && start >= stop || step < 0 && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv;
  };
  return newIter;
};


/**
 * Joins the values in a iterator with a delimiter.
 * @param {goog.iter.Iterable} iterable  The iterator to get the values from.
 * @param {string} deliminator  The text to put between the values.
 * @return {string} The joined value string.
 */
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator);
};


/**
 * For every element in the iterator call a function and return a new iterator
 * with that value.
 *
 * @param {goog.iter.Iterable} iterable The iterator to iterate over.
 * @param {function(this:T,?,undefined,?):?} f The function to call for every
 *     element.  This function
 *     takes 3 arguments (the element, undefined, and the iterator) and should
 *     return a new value.
 * @param {T=} opt_obj The object to be used as the value of 'this' within
 *     {@code f}.
 * @return {!goog.iter.Iterator} A new iterator that returns the results of
 *     applying the function to each element in the original iterator.
 * @template T
 */
goog.iter.map = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while (true) {
      var val = iterator.next();
      return f.call(opt_obj, val, undefined, iterator);
    }
  };
  return newIter;
};


/**
 * Passes every element of an iterator into a function and accumulates the
 * result.
 *
 * @param {goog.iter.Iterable} iterable The iterator to iterate over.
 * @param {function(this:T,V,?):V} f The function to call for every
 *     element. This function takes 2 arguments (the function's previous result
 *     or the initial value, and the value of the current element).
 *     function(previousValue, currentElement) : newValue.
 * @param {V} val The initial value to pass into the function on the first call.
 * @param {T=} opt_obj  The object to be used as the value of 'this'
 *     within f.
 * @return {V} Result of evaluating f repeatedly across the values of
 *     the iterator.
 * @template T,V
 */
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  var rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val);
  });
  return rval;
};


/**
 * Goes through the values in the iterator. Calls f for each these and if any of
 * them returns true, this returns true (without checking the rest). If all
 * return false this will return false.
 *
 * @param {goog.iter.Iterable} iterable  The iterator object.
 * @param {function(this:T,?,undefined,?):boolean} f  The function to call for
 *     every value. This function
 *     takes 3 arguments (the value, undefined, and the iterator) and should
 *     return a boolean.
 * @param {T=} opt_obj The object to be used as the value of 'this' within
 *     {@code f}.
 * @return {boolean} true if any value passes the test.
 * @template T
 */
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  /** @preserveTry */
  try {
    while (true) {
      if (f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return true;
      }
    }
  } catch (ex) {
    if (ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return false;
};


/**
 * Goes through the values in the iterator. Calls f for each these and if any of
 * them returns false this returns false (without checking the rest). If all
 * return true this will return true.
 *
 * @param {goog.iter.Iterable} iterable  The iterator object.
 * @param {function(this:T,?,undefined,?):boolean} f  The function to call for
 *     every value. This function
 *     takes 3 arguments (the value, undefined, and the iterator) and should
 *     return a boolean.
 * @param {T=} opt_obj The object to be used as the value of 'this' within
 *     {@code f}.
 * @return {boolean} true if every value passes the test.
 * @template T
 */
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  /** @preserveTry */
  try {
    while (true) {
      if (!f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return false;
      }
    }
  } catch (ex) {
    if (ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return true;
};


/**
 * Takes zero or more iterators and returns one iterator that will iterate over
 * them in the order chained.
 * @param {...goog.iter.Iterator} var_args  Any number of iterator objects.
 * @return {!goog.iter.Iterator} Returns a new iterator that will iterate over
 *     all the given iterators' contents.
 */
goog.iter.chain = function(var_args) {
  var args = arguments;
  var length = args.length;
  var i = 0;
  var newIter = new goog.iter.Iterator;

  /**
   * @return {*} The next item in the iteration.
   * @this {goog.iter.Iterator}
   */
  newIter.next = function() {
    /** @preserveTry */
    try {
      if (i >= length) {
        throw goog.iter.StopIteration;
      }
      var current = goog.iter.toIterator(args[i]);
      return current.next();
    } catch (ex) {
      if (ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      } else {
        // In case we got a StopIteration increment counter and try again.
        i++;
        return this.next();
      }
    }
  };

  return newIter;
};


/**
 * Builds a new iterator that iterates over the original, but skips elements as
 * long as a supplied function returns true.
 * @param {goog.iter.Iterable} iterable  The iterator object.
 * @param {function(this:T,?,undefined,?):boolean} f  The function to call for
 *     every value. This function
 *     takes 3 arguments (the value, undefined, and the iterator) and should
 *     return a boolean.
 * @param {T=} opt_obj The object to be used as the value of 'this' within
 *     {@code f}.
 * @return {!goog.iter.Iterator} A new iterator that drops elements from the
 *     original iterator as long as {@code f} is true.
 * @template T
 */
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var dropping = true;
  newIter.next = function() {
    while (true) {
      var val = iterator.next();
      if (dropping && f.call(opt_obj, val, undefined, iterator)) {
        continue;
      } else {
        dropping = false;
      }
      return val;
    }
  };
  return newIter;
};


/**
 * Builds a new iterator that iterates over the original, but only as long as a
 * supplied function returns true.
 * @param {goog.iter.Iterable} iterable  The iterator object.
 * @param {function(this:T,?,undefined,?):boolean} f  The function to call for
 *     every value. This function
 *     takes 3 arguments (the value, undefined, and the iterator) and should
 *     return a boolean.
 * @param {T=} opt_obj This is used as the 'this' object in f when called.
 * @return {!goog.iter.Iterator} A new iterator that keeps elements in the
 *     original iterator as long as the function is true.
 * @template T
 */
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var taking = true;
  newIter.next = function() {
    while (true) {
      if (taking) {
        var val = iterator.next();
        if (f.call(opt_obj, val, undefined, iterator)) {
          return val;
        } else {
          taking = false;
        }
      } else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter;
};


/**
 * Converts the iterator to an array
 * @param {goog.iter.Iterable} iterable  The iterator to convert to an array.
 * @return {!Array} An array of the elements the iterator iterates over.
 */
goog.iter.toArray = function(iterable) {
  // Fast path for array-like.
  if (goog.isArrayLike(iterable)) {
    return goog.array.toArray(/** @type {!goog.array.ArrayLike} */(iterable));
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val);
  });
  return array;
};


/**
 * Iterates over 2 iterators and returns true if they contain the same sequence
 * of elements and have the same length.
 * @param {goog.iter.Iterable} iterable1  The first iterable object.
 * @param {goog.iter.Iterable} iterable2  The second iterable object.
 * @return {boolean} true if the iterators contain the same sequence of
 *     elements and have the same length.
 */
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  /** @preserveTry */
  try {
    while (true) {
      b1 = b2 = false;
      var val1 = iterable1.next();
      b1 = true;
      var val2 = iterable2.next();
      b2 = true;
      if (val1 != val2) {
        return false;
      }
    }
  } catch (ex) {
    if (ex !== goog.iter.StopIteration) {
      throw ex;
    } else {
      if (b1 && !b2) {
        // iterable1 done but iterable2 is not done.
        return false;
      }
      if (!b2) {
        /** @preserveTry */
        try {
          // iterable2 not done?
          val2 = iterable2.next();
          // iterable2 not done but iterable1 is done
          return false;
        } catch (ex1) {
          if (ex1 !== goog.iter.StopIteration) {
            throw ex1;
          }
          // iterable2 done as well... They are equal
          return true;
        }
      }
    }
  }
  return false;
};


/**
 * Advances the iterator to the next position, returning the given default value
 * instead of throwing an exception if the iterator has no more entries.
 * @param {goog.iter.Iterable} iterable The iterable object.
 * @param {*} defaultValue The value to return if the iterator is empty.
 * @return {*} The next item in the iteration, or defaultValue if the iterator
 *     was empty.
 */
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next();
  } catch (e) {
    if (e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue;
  }
};


/**
 * Cartesian product of zero or more sets.  Gives an iterator that gives every
 * combination of one element chosen from each set.  For example,
 * ([1, 2], [3, 4]) gives ([1, 3], [1, 4], [2, 3], [2, 4]).
 * @see http://docs.python.org/library/itertools.html#itertools.product
 * @param {...!goog.array.ArrayLike.<*>} var_args Zero or more sets, as arrays.
 * @return {!goog.iter.Iterator} An iterator that gives each n-tuple (as an
 *     array).
 */
goog.iter.product = function(var_args) {
  var someArrayEmpty = goog.array.some(arguments, function(arr) {
    return !arr.length;
  });

  // An empty set in a cartesian product gives an empty set.
  if (someArrayEmpty || !arguments.length) {
    return new goog.iter.Iterator();
  }

  var iter = new goog.iter.Iterator();
  var arrays = arguments;

  // The first indicies are [0, 0, ...]
  var indicies = goog.array.repeat(0, arrays.length);

  iter.next = function() {

    if (indicies) {
      var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex];
      });

      // Generate the next-largest indicies for the next call.
      // Increase the rightmost index. If it goes over, increase the next
      // rightmost (like carry-over addition).
      for (var i = indicies.length - 1; i >= 0; i--) {
        // Assertion prevents compiler warning below.
        goog.asserts.assert(indicies);
        if (indicies[i] < arrays[i].length - 1) {
          indicies[i]++;
          break;
        }

        // We're at the last indicies (the last element of every array), so
        // the iteration is over on the next call.
        if (i == 0) {
          indicies = null;
          break;
        }
        // Reset the index in this column and loop back to increment the
        // next one.
        indicies[i] = 0;
      }
      return retVal;
    }

    throw goog.iter.StopIteration;
  };

  return iter;
};


/**
 * Create an iterator to cycle over the iterable's elements indefinitely.
 * For example, ([1, 2, 3]) would return : 1, 2, 3, 1, 2, 3, ...
 * @see: http://docs.python.org/library/itertools.html#itertools.cycle.
 * @param {!goog.iter.Iterable} iterable The iterable object.
 * @return {!goog.iter.Iterator} An iterator that iterates indefinitely over
 * the values in {@code iterable}.
 */
goog.iter.cycle = function(iterable) {

  var baseIterator = goog.iter.toIterator(iterable);

  // We maintain a cache to store the iterable elements as we iterate
  // over them. The cache is used to return elements once we have
  // iterated over the iterable once.
  var cache = [];
  var cacheIndex = 0;

  var iter = new goog.iter.Iterator();

  // This flag is set after the iterable is iterated over once
  var useCache = false;

  iter.next = function() {
    var returnElement = null;

    // Pull elements off the original iterator if not using cache
    if (!useCache) {
      try {
        // Return the element from the iterable
        returnElement = baseIterator.next();
        cache.push(returnElement);
        return returnElement;
      } catch (e) {
        // If an exception other than StopIteration is thrown
        // or if there are no elements to iterate over (the iterable was empty)
        // throw an exception
        if (e != goog.iter.StopIteration || goog.array.isEmpty(cache)) {
          throw e;
        }
        // set useCache to true after we know that a 'StopIteration' exception
        // was thrown and the cache is not empty (to handle the 'empty iterable'
        // use case)
        useCache = true;
      }
    }

    returnElement = cache[cacheIndex];
    cacheIndex = (cacheIndex + 1) % cache.length;

    return returnElement;
  };

  return iter;
};

// Input 12
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Datastructure: Hash Map.
 *
 * @author arv@google.com (Erik Arvidsson)
 * @author jonp@google.com (Jon Perlow) Optimized for IE6
 *
 * This file contains an implementation of a Map structure. It implements a lot
 * of the methods used in goog.structs so those functions work on hashes.  For
 * convenience with common usage the methods accept any type for the key, though
 * internally they will be cast to strings.
 */


goog.provide('goog.structs.Map');

goog.require('goog.iter.Iterator');
goog.require('goog.iter.StopIteration');
goog.require('goog.object');
goog.require('goog.structs');



/**
 * Class for Hash Map datastructure.
 * @param {*=} opt_map Map or Object to initialize the map with.
 * @param {...*} var_args If 2 or more arguments are present then they
 *     will be used as key-value pairs.
 * @constructor
 */
goog.structs.Map = function(opt_map, var_args) {

  /**
   * Underlying JS object used to implement the map.
   * @type {!Object}
   * @private
   */
  this.map_ = {};

  /**
   * An array of keys. This is necessary for two reasons:
   *   1. Iterating the keys using for (var key in this.map_) allocates an
   *      object for every key in IE which is really bad for IE6 GC perf.
   *   2. Without a side data structure, we would need to escape all the keys
   *      as that would be the only way we could tell during iteration if the
   *      key was an internal key or a property of the object.
   *
   * This array can contain deleted keys so it's necessary to check the map
   * as well to see if the key is still in the map (this doesn't require a
   * memory allocation in IE).
   * @type {!Array.<string>}
   * @private
   */
  this.keys_ = [];

  var argLength = arguments.length;

  if (argLength > 1) {
    if (argLength % 2) {
      throw Error('Uneven number of arguments');
    }
    for (var i = 0; i < argLength; i += 2) {
      this.set(arguments[i], arguments[i + 1]);
    }
  } else if (opt_map) {
    this.addAll(/** @type {Object} */ (opt_map));
  }
};


/**
 * The number of key value pairs in the map.
 * @private
 * @type {number}
 */
goog.structs.Map.prototype.count_ = 0;


/**
 * Version used to detect changes while iterating.
 * @private
 * @type {number}
 */
goog.structs.Map.prototype.version_ = 0;


/**
 * @return {number} The number of key-value pairs in the map.
 */
goog.structs.Map.prototype.getCount = function() {
  return this.count_;
};


/**
 * Returns the values of the map.
 * @return {!Array} The values in the map.
 */
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();

  var rv = [];
  for (var i = 0; i < this.keys_.length; i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key]);
  }
  return rv;
};


/**
 * Returns the keys of the map.
 * @return {!Array.<string>} Array of string values.
 */
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return /** @type {!Array.<string>} */ (this.keys_.concat());
};


/**
 * Whether the map contains the given key.
 * @param {*} key The key to check for.
 * @return {boolean} Whether the map contains the key.
 */
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key);
};


/**
 * Whether the map contains the given value. This is O(n).
 * @param {*} val The value to check for.
 * @return {boolean} Whether the map contains the value.
 */
goog.structs.Map.prototype.containsValue = function(val) {
  for (var i = 0; i < this.keys_.length; i++) {
    var key = this.keys_[i];
    if (goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true;
    }
  }
  return false;
};


/**
 * Whether this map is equal to the argument map.
 * @param {goog.structs.Map} otherMap The map against which to test equality.
 * @param {function(?, ?) : boolean=} opt_equalityFn Optional equality function
 *     to test equality of values. If not specified, this will test whether
 *     the values contained in each map are identical objects.
 * @return {boolean} Whether the maps are equal.
 */
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if (this === otherMap) {
    return true;
  }

  if (this.count_ != otherMap.getCount()) {
    return false;
  }

  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;

  this.cleanupKeysArray_();
  for (var key, i = 0; key = this.keys_[i]; i++) {
    if (!equalityFn(this.get(key), otherMap.get(key))) {
      return false;
    }
  }

  return true;
};


/**
 * Default equality test for values.
 * @param {*} a The first value.
 * @param {*} b The second value.
 * @return {boolean} Whether a and b reference the same object.
 */
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b;
};


/**
 * @return {boolean} Whether the map is empty.
 */
goog.structs.Map.prototype.isEmpty = function() {
  return this.count_ == 0;
};


/**
 * Removes all key-value pairs from the map.
 */
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.count_ = 0;
  this.version_ = 0;
};


/**
 * Removes a key-value pair based on the key. This is O(logN) amortized due to
 * updating the keys array whenever the count becomes half the size of the keys
 * in the keys array.
 * @param {*} key  The key to remove.
 * @return {boolean} Whether object was removed.
 */
goog.structs.Map.prototype.remove = function(key) {
  if (goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.count_--;
    this.version_++;

    // clean up the keys array if the threshhold is hit
    if (this.keys_.length > 2 * this.count_) {
      this.cleanupKeysArray_();
    }

    return true;
  }
  return false;
};


/**
 * Cleans up the temp keys array by removing entries that are no longer in the
 * map.
 * @private
 */
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if (this.count_ != this.keys_.length) {
    // First remove keys that are no longer in the map.
    var srcIndex = 0;
    var destIndex = 0;
    while (srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if (goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key;
      }
      srcIndex++;
    }
    this.keys_.length = destIndex;
  }

  if (this.count_ != this.keys_.length) {
    // If the count still isn't correct, that means we have duplicates. This can
    // happen when the same key is added and removed multiple times. Now we have
    // to allocate one extra Object to remove the duplicates. This could have
    // been done in the first pass, but in the common case, we can avoid
    // allocating an extra object by only doing this when necessary.
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while (srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if (!(goog.structs.Map.hasKey_(seen, key))) {
        this.keys_[destIndex++] = key;
        seen[key] = 1;
      }
      srcIndex++;
    }
    this.keys_.length = destIndex;
  }
};


/**
 * Returns the value for the given key.  If the key is not found and the default
 * value is not given this will return {@code undefined}.
 * @param {*} key The key to get the value for.
 * @param {*=} opt_val The value to return if no item is found for the given
 *     key, defaults to undefined.
 * @return {*} The value for the given key.
 */
goog.structs.Map.prototype.get = function(key, opt_val) {
  if (goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key];
  }
  return opt_val;
};


/**
 * Adds a key-value pair to the map.
 * @param {*} key The key.
 * @param {*} value The value to add.
 * @return {*} Some subclasses return a value.
 */
goog.structs.Map.prototype.set = function(key, value) {
  if (!(goog.structs.Map.hasKey_(this.map_, key))) {
    this.count_++;
    this.keys_.push(key);
    // Only change the version if we add a new key.
    this.version_++;
  }
  this.map_[key] = value;
};


/**
 * Adds multiple key-value pairs from another goog.structs.Map or Object.
 * @param {Object} map  Object containing the data to add.
 */
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  if (map instanceof goog.structs.Map) {
    keys = map.getKeys();
    values = map.getValues();
  } else {
    keys = goog.object.getKeys(map);
    values = goog.object.getValues(map);
  }
  // we could use goog.array.forEach here but I don't want to introduce that
  // dependency just for this.
  for (var i = 0; i < keys.length; i++) {
    this.set(keys[i], values[i]);
  }
};


/**
 * Clones a map and returns a new map.
 * @return {!goog.structs.Map} A new map with the same key-value pairs.
 */
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this);
};


/**
 * Returns a new map in which all the keys and values are interchanged
 * (keys become values and values become keys). If multiple keys map to the
 * same value, the chosen transposed value is implementation-dependent.
 *
 * It acts very similarly to {goog.object.transpose(Object)}.
 *
 * @return {!goog.structs.Map} The transposed map.
 */
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map();
  for (var i = 0; i < this.keys_.length; i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key);
  }

  return transposed;
};


/**
 * @return {!Object} Object representation of the map.
 */
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  var obj = {};
  for (var i = 0; i < this.keys_.length; i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key];
  }
  return obj;
};


/**
 * Returns an iterator that iterates over the keys in the map.  Removal of keys
 * while iterating might have undesired side effects.
 * @return {!goog.iter.Iterator} An iterator over the keys in the map.
 */
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true);
};


/**
 * Returns an iterator that iterates over the values in the map.  Removal of
 * keys while iterating might have undesired side effects.
 * @return {!goog.iter.Iterator} An iterator over the values in the map.
 */
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false);
};


/**
 * Returns an iterator that iterates over the values or the keys in the map.
 * This throws an exception if the map was mutated since the iterator was
 * created.
 * @param {boolean=} opt_keys True to iterate over the keys. False to iterate
 *     over the values.  The default value is false.
 * @return {!goog.iter.Iterator} An iterator over the values or keys in the map.
 */
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  // Clean up keys to minimize the risk of iterating over dead keys.
  this.cleanupKeysArray_();

  var i = 0;
  var keys = this.keys_;
  var map = this.map_;
  var version = this.version_;
  var selfObj = this;

  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while (true) {
      if (version != selfObj.version_) {
        throw Error('The map has changed since the iterator was created');
      }
      if (i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key];
    }
  };
  return newIter;
};


/**
 * Safe way to test for hasOwnProperty.  It even allows testing for
 * 'hasOwnProperty'.
 * @param {Object} obj The object to test for presence of the given key.
 * @param {*} key The key to check for.
 * @return {boolean} Whether the object has the key.
 * @private
 */
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
};

// Input 13
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Datastructure: Set.
 *
 * @author arv@google.com (Erik Arvidsson)
 * @author pallosp@google.com (Peter Pallos)
 *
 * This class implements a set data structure. Adding and removing is O(1). It
 * supports both object and primitive values. Be careful because you can add
 * both 1 and new Number(1), because these are not the same. You can even add
 * multiple new Number(1) because these are not equal.
 */


goog.provide('goog.structs.Set');

goog.require('goog.structs');
goog.require('goog.structs.Collection');
goog.require('goog.structs.Map');



/**
 * A set that can contain both primitives and objects.  Adding and removing
 * elements is O(1).  Primitives are treated as identical if they have the same
 * type and convert to the same string.  Objects are treated as identical only
 * if they are references to the same object.  WARNING: A goog.structs.Set can
 * contain both 1 and (new Number(1)), because they are not the same.  WARNING:
 * Adding (new Number(1)) twice will yield two distinct elements, because they
 * are two different objects.  WARNING: Any object that is added to a
 * goog.structs.Set will be modified!  Because goog.getUid() is used to
 * identify objects, every object in the set will be mutated.
 * @param {Array|Object=} opt_values Initial values to start with.
 * @constructor
 * @implements {goog.structs.Collection}
 */
goog.structs.Set = function(opt_values) {
  this.map_ = new goog.structs.Map;
  if (opt_values) {
    this.addAll(opt_values);
  }
};


/**
 * Obtains a unique key for an element of the set.  Primitives will yield the
 * same key if they have the same type and convert to the same string.  Object
 * references will yield the same key only if they refer to the same object.
 * @param {*} val Object or primitive value to get a key for.
 * @return {string} A unique key for this value/object.
 * @private
 */
goog.structs.Set.getKey_ = function(val) {
  var type = typeof val;
  if (type == 'object' && val || type == 'function') {
    return 'o' + goog.getUid(/** @type {Object} */ (val));
  } else {
    return type.substr(0, 1) + val;
  }
};


/**
 * @return {number} The number of elements in the set.
 * @override
 */
goog.structs.Set.prototype.getCount = function() {
  return this.map_.getCount();
};


/**
 * Add a primitive or an object to the set.
 * @param {*} element The primitive or object to add.
 * @override
 */
goog.structs.Set.prototype.add = function(element) {
  this.map_.set(goog.structs.Set.getKey_(element), element);
};


/**
 * Adds all the values in the given collection to this set.
 * @param {Array|Object} col A collection containing the elements to add.
 */
goog.structs.Set.prototype.addAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for (var i = 0; i < l; i++) {
    this.add(values[i]);
  }
};


/**
 * Removes all values in the given collection from this set.
 * @param {Array|Object} col A collection containing the elements to remove.
 */
goog.structs.Set.prototype.removeAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for (var i = 0; i < l; i++) {
    this.remove(values[i]);
  }
};


/**
 * Removes the given element from this set.
 * @param {*} element The primitive or object to remove.
 * @return {boolean} Whether the element was found and removed.
 * @override
 */
goog.structs.Set.prototype.remove = function(element) {
  return this.map_.remove(goog.structs.Set.getKey_(element));
};


/**
 * Removes all elements from this set.
 */
goog.structs.Set.prototype.clear = function() {
  this.map_.clear();
};


/**
 * Tests whether this set is empty.
 * @return {boolean} True if there are no elements in this set.
 */
goog.structs.Set.prototype.isEmpty = function() {
  return this.map_.isEmpty();
};


/**
 * Tests whether this set contains the given element.
 * @param {*} element The primitive or object to test for.
 * @return {boolean} True if this set contains the given element.
 * @override
 */
goog.structs.Set.prototype.contains = function(element) {
  return this.map_.containsKey(goog.structs.Set.getKey_(element));
};


/**
 * Tests whether this set contains all the values in a given collection.
 * Repeated elements in the collection are ignored, e.g.  (new
 * goog.structs.Set([1, 2])).containsAll([1, 1]) is True.
 * @param {Object} col A collection-like object.
 * @return {boolean} True if the set contains all elements.
 */
goog.structs.Set.prototype.containsAll = function(col) {
  return goog.structs.every(col, this.contains, this);
};


/**
 * Finds all values that are present in both this set and the given collection.
 * @param {Array|Object} col A collection.
 * @return {!goog.structs.Set} A new set containing all the values (primitives
 *     or objects) present in both this set and the given collection.
 */
goog.structs.Set.prototype.intersection = function(col) {
  var result = new goog.structs.Set();

  var values = goog.structs.getValues(col);
  for (var i = 0; i < values.length; i++) {
    var value = values[i];
    if (this.contains(value)) {
      result.add(value);
    }
  }

  return result;
};


/**
 * Finds all values that are present in this set and not in the given
 * collection.
 * @param {Array|Object} col A collection.
 * @return {!goog.structs.Set} A new set containing all the values
 *     (primitives or objects) present in this set but not in the given
 *     collection.
 */
goog.structs.Set.prototype.difference = function(col) {
  var result = this.clone();
  result.removeAll(col);
  return result;
};


/**
 * Returns an array containing all the elements in this set.
 * @return {!Array} An array containing all the elements in this set.
 */
goog.structs.Set.prototype.getValues = function() {
  return this.map_.getValues();
};


/**
 * Creates a shallow clone of this set.
 * @return {!goog.structs.Set} A new set containing all the same elements as
 *     this set.
 */
goog.structs.Set.prototype.clone = function() {
  return new goog.structs.Set(this);
};


/**
 * Tests whether the given collection consists of the same elements as this set,
 * regardless of order, without repetition.  Primitives are treated as equal if
 * they have the same type and convert to the same string; objects are treated
 * as equal if they are references to the same object.  This operation is O(n).
 * @param {Object} col A collection.
 * @return {boolean} True if the given collection consists of the same elements
 *     as this set, regardless of order, without repetition.
 */
goog.structs.Set.prototype.equals = function(col) {
  return this.getCount() == goog.structs.getCount(col) && this.isSubsetOf(col);
};


/**
 * Tests whether the given collection contains all the elements in this set.
 * Primitives are treated as equal if they have the same type and convert to the
 * same string; objects are treated as equal if they are references to the same
 * object.  This operation is O(n).
 * @param {Object} col A collection.
 * @return {boolean} True if this set is a subset of the given collection.
 */
goog.structs.Set.prototype.isSubsetOf = function(col) {
  var colCount = goog.structs.getCount(col);
  if (this.getCount() > colCount) {
    return false;
  }
  // TODO(user) Find the minimal collection size where the conversion makes
  // the contains() method faster.
  if (!(col instanceof goog.structs.Set) && colCount > 5) {
    // Convert to a goog.structs.Set so that goog.structs.contains runs in
    // O(1) time instead of O(n) time.
    col = new goog.structs.Set(col);
  }
  return goog.structs.every(this, function(value) {
    return goog.structs.contains(col, value);
  });
};


/**
 * Returns an iterator that iterates over the elements in this set.
 * @param {boolean=} opt_keys This argument is ignored.
 * @return {!goog.iter.Iterator} An iterator over the elements in this set.
 */
goog.structs.Set.prototype.__iterator__ = function(opt_keys) {
  return this.map_.__iterator__(false);
};

// Input 14
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Rendering engine detection.
 * @see <a href="http://www.useragentstring.com/">User agent strings</a>
 * For information on the browser brand (such as Safari versus Chrome), see
 * goog.userAgent.product.
 * @see ../demos/useragent.html
 */

goog.provide('goog.userAgent');

goog.require('goog.string');


/**
 * @define {boolean} Whether we know at compile-time that the browser is IE.
 */
goog.userAgent.ASSUME_IE = false;


/**
 * @define {boolean} Whether we know at compile-time that the browser is GECKO.
 */
goog.userAgent.ASSUME_GECKO = false;


/**
 * @define {boolean} Whether we know at compile-time that the browser is WEBKIT.
 */
goog.userAgent.ASSUME_WEBKIT = false;


/**
 * @define {boolean} Whether we know at compile-time that the browser is a
 *     mobile device running WebKit e.g. iPhone or Android.
 */
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;


/**
 * @define {boolean} Whether we know at compile-time that the browser is OPERA.
 */
goog.userAgent.ASSUME_OPERA = false;


/**
 * @define {boolean} Whether the {@code goog.userAgent.isVersion} function will
 *     return true for any version.
 */
goog.userAgent.ASSUME_ANY_VERSION = false;


/**
 * Whether we know the browser engine at compile-time.
 * @type {boolean}
 * @private
 */
goog.userAgent.BROWSER_KNOWN_ =
    goog.userAgent.ASSUME_IE ||
    goog.userAgent.ASSUME_GECKO ||
    goog.userAgent.ASSUME_MOBILE_WEBKIT ||
    goog.userAgent.ASSUME_WEBKIT ||
    goog.userAgent.ASSUME_OPERA;


/**
 * Returns the userAgent string for the current browser.
 * Some user agents (I'm thinking of you, Gears WorkerPool) do not expose a
 * navigator object off the global scope.  In that case we return null.
 *
 * @return {?string} The userAgent string or null if there is none.
 */
goog.userAgent.getUserAgentString = function() {
  return goog.global['navigator'] ? goog.global['navigator'].userAgent : null;
};


/**
 * @return {Object} The native navigator object.
 */
goog.userAgent.getNavigator = function() {
  // Need a local navigator reference instead of using the global one,
  // to avoid the rare case where they reference different objects.
  // (in a WorkerPool, for example).
  return goog.global['navigator'];
};


/**
 * Initializer for goog.userAgent.
 *
 * This is a named function so that it can be stripped via the jscompiler
 * option for stripping types.
 * @private
 */
goog.userAgent.init_ = function() {
  /**
   * Whether the user agent string denotes Opera.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedOpera_ = false;

  /**
   * Whether the user agent string denotes Internet Explorer. This includes
   * other browsers using Trident as its rendering engine. For example AOL
   * and Netscape 8
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedIe_ = false;

  /**
   * Whether the user agent string denotes WebKit. WebKit is the rendering
   * engine that Safari, Android and others use.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedWebkit_ = false;

  /**
   * Whether the user agent string denotes a mobile device.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedMobile_ = false;

  /**
   * Whether the user agent string denotes Gecko. Gecko is the rendering
   * engine used by Mozilla, Mozilla Firefox, Camino and many more.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedGecko_ = false;

  var ua;
  if (!goog.userAgent.BROWSER_KNOWN_ &&
      (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf('Opera') == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ &&
        ua.indexOf('MSIE') != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ &&
        ua.indexOf('WebKit') != -1;
    // WebKit also gives navigator.product string equal to 'Gecko'.
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ &&
        ua.indexOf('Mobile') != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ &&
        !goog.userAgent.detectedWebkit_ && navigator.product == 'Gecko';
  }
};


if (!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_();
}


/**
 * Whether the user agent is Opera.
 * @type {boolean}
 */
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ?
    goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;


/**
 * Whether the user agent is Internet Explorer. This includes other browsers
 * using Trident as its rendering engine. For example AOL and Netscape 8
 * @type {boolean}
 */
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ?
    goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;


/**
 * Whether the user agent is Gecko. Gecko is the rendering engine used by
 * Mozilla, Mozilla Firefox, Camino and many more.
 * @type {boolean}
 */
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ?
    goog.userAgent.ASSUME_GECKO :
    goog.userAgent.detectedGecko_;


/**
 * Whether the user agent is WebKit. WebKit is the rendering engine that
 * Safari, Android and others use.
 * @type {boolean}
 */
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ?
    goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT :
    goog.userAgent.detectedWebkit_;


/**
 * Whether the user agent is running on a mobile device.
 * @type {boolean}
 */
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT ||
                        goog.userAgent.detectedMobile_;


/**
 * Used while transitioning code to use WEBKIT instead.
 * @type {boolean}
 * @deprecated Use {@link goog.userAgent.product.SAFARI} instead.
 * TODO(nicksantos): Delete this from goog.userAgent.
 */
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;


/**
 * @return {string} the platform (operating system) the user agent is running
 *     on. Default to empty string because navigator.platform may not be defined
 *     (on Rhino, for example).
 * @private
 */
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || '';
};


/**
 * The platform (operating system) the user agent is running on. Default to
 * empty string because navigator.platform may not be defined (on Rhino, for
 * example).
 * @type {string}
 */
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();


/**
 * @define {boolean} Whether the user agent is running on a Macintosh operating
 *     system.
 */
goog.userAgent.ASSUME_MAC = false;


/**
 * @define {boolean} Whether the user agent is running on a Windows operating
 *     system.
 */
goog.userAgent.ASSUME_WINDOWS = false;


/**
 * @define {boolean} Whether the user agent is running on a Linux operating
 *     system.
 */
goog.userAgent.ASSUME_LINUX = false;


/**
 * @define {boolean} Whether the user agent is running on a X11 windowing
 *     system.
 */
goog.userAgent.ASSUME_X11 = false;


/**
 * @type {boolean}
 * @private
 */
goog.userAgent.PLATFORM_KNOWN_ =
    goog.userAgent.ASSUME_MAC ||
    goog.userAgent.ASSUME_WINDOWS ||
    goog.userAgent.ASSUME_LINUX ||
    goog.userAgent.ASSUME_X11;


/**
 * Initialize the goog.userAgent constants that define which platform the user
 * agent is running on.
 * @private
 */
goog.userAgent.initPlatform_ = function() {
  /**
   * Whether the user agent is running on a Macintosh operating system.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM,
      'Mac');

  /**
   * Whether the user agent is running on a Windows operating system.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedWindows_ = goog.string.contains(
      goog.userAgent.PLATFORM, 'Win');

  /**
   * Whether the user agent is running on a Linux operating system.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM,
      'Linux');

  /**
   * Whether the user agent is running on a X11 windowing system.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() &&
      goog.string.contains(goog.userAgent.getNavigator()['appVersion'] || '',
          'X11');
};


if (!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_();
}


/**
 * Whether the user agent is running on a Macintosh operating system.
 * @type {boolean}
 */
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;


/**
 * Whether the user agent is running on a Windows operating system.
 * @type {boolean}
 */
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;


/**
 * Whether the user agent is running on a Linux operating system.
 * @type {boolean}
 */
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;


/**
 * Whether the user agent is running on a X11 windowing system.
 * @type {boolean}
 */
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;


/**
 * @return {string} The string that describes the version number of the user
 *     agent.
 * @private
 */
goog.userAgent.determineVersion_ = function() {
  // All browsers have different ways to detect the version and they all have
  // different naming schemes.

  // version is a string rather than a number because it may contain 'b', 'a',
  // and so on.
  var version = '', re;

  if (goog.userAgent.OPERA && goog.global['opera']) {
    var operaVersion = goog.global['opera'].version;
    version = typeof operaVersion == 'function' ? operaVersion() : operaVersion;
  } else {
    if (goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/;
    } else if (goog.userAgent.IE) {
      re = /MSIE\s+([^\);]+)(\)|;)/;
    } else if (goog.userAgent.WEBKIT) {
      // WebKit/125.4
      re = /WebKit\/(\S+)/;
    }
    if (re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : '';
    }
  }
  if (goog.userAgent.IE) {
    // IE9 can be in document mode 9 but be reporting an inconsistent user agent
    // version.  If it is identifying as a version lower than 9 we take the
    // documentMode as the version instead.  IE8 has similar behavior.
    // It is recommended to set the X-UA-Compatible header to ensure that IE9
    // uses documentMode 9.
    var docMode = goog.userAgent.getDocumentMode_();
    if (docMode > parseFloat(version)) {
      return String(docMode);
    }
  }
  return version;
};


/**
 * @return {number|undefined} Returns the document mode (for testing).
 * @private
 */
goog.userAgent.getDocumentMode_ = function() {
  // NOTE(user): goog.userAgent may be used in context where there is no DOM.
  var doc = goog.global['document'];
  return doc ? doc['documentMode'] : undefined;
};


/**
 * The version of the user agent. This is a string because it might contain
 * 'b' (as in beta) as well as multiple dots.
 * @type {string}
 */
goog.userAgent.VERSION = goog.userAgent.determineVersion_();


/**
 * Compares two version numbers.
 *
 * @param {string} v1 Version of first item.
 * @param {string} v2 Version of second item.
 *
 * @return {number}  1 if first argument is higher
 *                   0 if arguments are equal
 *                  -1 if second argument is higher.
 * @deprecated Use goog.string.compareVersions.
 */
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2);
};


/**
 * Cache for {@link goog.userAgent.isVersion}. Calls to compareVersions are
 * surprisingly expensive and as a browsers version number is unlikely to change
 * during a session we cache the results.
 * @type {Object}
 * @private
 */
goog.userAgent.isVersionCache_ = {};


/**
 * Whether the user agent version is higher or the same as the given version.
 * NOTE: When checking the version numbers for Firefox and Safari, be sure to
 * use the engine's version, not the browser's version number.  For example,
 * Firefox 3.0 corresponds to Gecko 1.9 and Safari 3.0 to Webkit 522.11.
 * Opera and Internet Explorer versions match the product release number.<br>
 * @see <a href="http://en.wikipedia.org/wiki/Safari_version_history">
 *     Webkit</a>
 * @see <a href="http://en.wikipedia.org/wiki/Gecko_engine">Gecko</a>
 *
 * @param {string|number} version The version to check.
 * @return {boolean} Whether the user agent version is higher or the same as
 *     the given version.
 */
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.ASSUME_ANY_VERSION ||
      goog.userAgent.isVersionCache_[version] ||
      (goog.userAgent.isVersionCache_[version] =
          goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0);
};


/**
 * Whether the IE effective document mode is higher or the same as the given
 * document mode version.
 * NOTE: Only for IE, return false for another browser.
 *
 * @param {number} documentMode The document mode version to check.
 * @return {boolean} Whether the IE effective document mode is higher or the
 *     same as the given version.
 */
goog.userAgent.isDocumentMode = function(documentMode) {
  return goog.userAgent.IE && goog.userAgent.DOCUMENT_MODE >= documentMode;
};


/**
 * For IE version < 7, documentMode is undefined, so attempt to use the
 * CSS1Compat property to see if we are in standards mode. If we are in
 * standards mode, treat the browser version as the document mode. Otherwise,
 * IE is emulating version 5.
 * @type {number|undefined}
 * @const
 */
goog.userAgent.DOCUMENT_MODE = (function() {
  var doc = goog.global['document'];
  if (!doc || !goog.userAgent.IE) {
    return undefined;
  }
  var mode = goog.userAgent.getDocumentMode_();
  return mode || (doc['compatMode'] == 'CSS1Compat' ?
      parseInt(goog.userAgent.VERSION, 10) : 5);
})();

// Input 15
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Logging and debugging utilities.
 *
 * @see ../demos/debug.html
 */

goog.provide('goog.debug');

goog.require('goog.array');
goog.require('goog.string');
goog.require('goog.structs.Set');
goog.require('goog.userAgent');


/**
 * Catches onerror events fired by windows and similar objects.
 * @param {function(Object)} logFunc The function to call with the error
 *    information.
 * @param {boolean=} opt_cancel Whether to stop the error from reaching the
 *    browser.
 * @param {Object=} opt_target Object that fires onerror events.
 */
goog.debug.catchErrors = function(logFunc, opt_cancel, opt_target) {
  var target = opt_target || goog.global;
  var oldErrorHandler = target.onerror;
  var retVal = !!opt_cancel;

  // Chrome interprets onerror return value backwards (http://crbug.com/92062)
  // until it was fixed in webkit revision r94061 (Webkit 535.3). This
  // workaround still needs to be skipped in Safari after the webkit change
  // gets pushed out in Safari.
  // See https://bugs.webkit.org/show_bug.cgi?id=67119
  if (goog.userAgent.WEBKIT && !goog.userAgent.isVersion('535.3')) {
    retVal = !retVal;
  }
  target.onerror = function(message, url, line) {
    if (oldErrorHandler) {
      oldErrorHandler(message, url, line);
    }
    logFunc({
      message: message,
      fileName: url,
      line: line
    });
    return retVal;
  };
};


/**
 * Creates a string representing an object and all its properties.
 * @param {Object|null|undefined} obj Object to expose.
 * @param {boolean=} opt_showFn Show the functions as well as the properties,
 *     default is false.
 * @return {string} The string representation of {@code obj}.
 */
goog.debug.expose = function(obj, opt_showFn) {
  if (typeof obj == 'undefined') {
    return 'undefined';
  }
  if (obj == null) {
    return 'NULL';
  }
  var str = [];

  for (var x in obj) {
    if (!opt_showFn && goog.isFunction(obj[x])) {
      continue;
    }
    var s = x + ' = ';
    /** @preserveTry */
    try {
      s += obj[x];
    } catch (e) {
      s += '*** ' + e + ' ***';
    }
    str.push(s);
  }
  return str.join('\n');
};


/**
 * Creates a string representing a given primitive or object, and for an
 * object, all its properties and nested objects.  WARNING: If an object is
 * given, it and all its nested objects will be modified.  To detect reference
 * cycles, this method identifies objects using goog.getUid() which mutates the
 * object.
 * @param {*} obj Object to expose.
 * @param {boolean=} opt_showFn Also show properties that are functions (by
 *     default, functions are omitted).
 * @return {string} A string representation of {@code obj}.
 */
goog.debug.deepExpose = function(obj, opt_showFn) {
  var previous = new goog.structs.Set();
  var str = [];

  var helper = function(obj, space) {
    var nestspace = space + '  ';

    var indentMultiline = function(str) {
      return str.replace(/\n/g, '\n' + space);
    };

    /** @preserveTry */
    try {
      if (!goog.isDef(obj)) {
        str.push('undefined');
      } else if (goog.isNull(obj)) {
        str.push('NULL');
      } else if (goog.isString(obj)) {
        str.push('"' + indentMultiline(obj) + '"');
      } else if (goog.isFunction(obj)) {
        str.push(indentMultiline(String(obj)));
      } else if (goog.isObject(obj)) {
        if (previous.contains(obj)) {
          // TODO(user): This is a bug; it falsely detects non-loops as loops
          // when the reference tree contains two references to the same object.
          str.push('*** reference loop detected ***');
        } else {
          previous.add(obj);
          str.push('{');
          for (var x in obj) {
            if (!opt_showFn && goog.isFunction(obj[x])) {
              continue;
            }
            str.push('\n');
            str.push(nestspace);
            str.push(x + ' = ');
            helper(obj[x], nestspace);
          }
          str.push('\n' + space + '}');
        }
      } else {
        str.push(obj);
      }
    } catch (e) {
      str.push('*** ' + e + ' ***');
    }
  };

  helper(obj, '');
  return str.join('');
};


/**
 * Recursively outputs a nested array as a string.
 * @param {Array} arr The array.
 * @return {string} String representing nested array.
 */
goog.debug.exposeArray = function(arr) {
  var str = [];
  for (var i = 0; i < arr.length; i++) {
    if (goog.isArray(arr[i])) {
      str.push(goog.debug.exposeArray(arr[i]));
    } else {
      str.push(arr[i]);
    }
  }
  return '[ ' + str.join(', ') + ' ]';
};


/**
 * Exposes an exception that has been caught by a try...catch and outputs the
 * error with a stack trace.
 * @param {Object} err Error object or string.
 * @param {Function=} opt_fn Optional function to start stack trace from.
 * @return {string} Details of exception.
 */
goog.debug.exposeException = function(err, opt_fn) {
  /** @preserveTry */
  try {
    var e = goog.debug.normalizeErrorObject(err);

    // Create the error message
    var error = 'Message: ' + goog.string.htmlEscape(e.message) +
        '\nUrl: <a href="view-source:' + e.fileName + '" target="_new">' +
        e.fileName + '</a>\nLine: ' + e.lineNumber + '\n\nBrowser stack:\n' +
        goog.string.htmlEscape(e.stack + '-> ') +
        '[end]\n\nJS stack traversal:\n' + goog.string.htmlEscape(
            goog.debug.getStacktrace(opt_fn) + '-> ');
    return error;
  } catch (e2) {
    return 'Exception trying to expose exception! You win, we lose. ' + e2;
  }
};


/**
 * Normalizes the error/exception object between browsers.
 * @param {Object} err Raw error object.
 * @return {Object} Normalized error object.
 */
goog.debug.normalizeErrorObject = function(err) {
  var href = goog.getObjectByName('window.location.href');
  if (goog.isString(err)) {
    return {
      'message': err,
      'name': 'Unknown error',
      'lineNumber': 'Not available',
      'fileName': href,
      'stack': 'Not available'
    };
  }

  var lineNumber, fileName;
  var threwError = false;

  try {
    lineNumber = err.lineNumber || err.line || 'Not available';
  } catch (e) {
    // Firefox 2 sometimes throws an error when accessing 'lineNumber':
    // Message: Permission denied to get property UnnamedClass.lineNumber
    lineNumber = 'Not available';
    threwError = true;
  }

  try {
    fileName = err.fileName || err.filename || err.sourceURL || href;
  } catch (e) {
    // Firefox 2 may also throw an error when accessing 'filename'.
    fileName = 'Not available';
    threwError = true;
  }

  // The IE Error object contains only the name and the message.
  // The Safari Error object uses the line and sourceURL fields.
  if (threwError || !err.lineNumber || !err.fileName || !err.stack) {
    return {
      'message': err.message,
      'name': err.name,
      'lineNumber': lineNumber,
      'fileName': fileName,
      'stack': err.stack || 'Not available'
    };
  }

  // Standards error object
  return err;
};


/**
 * Converts an object to an Error if it's a String,
 * adds a stacktrace if there isn't one,
 * and optionally adds an extra message.
 * @param {Error|string} err  the original thrown object or string.
 * @param {string=} opt_message  optional additional message to add to the
 *     error.
 * @return {Error} If err is a string, it is used to create a new Error,
 *     which is enhanced and returned.  Otherwise err itself is enhanced
 *     and returned.
 */
goog.debug.enhanceError = function(err, opt_message) {
  var error = typeof err == 'string' ? Error(err) : err;
  if (!error.stack) {
    error.stack = goog.debug.getStacktrace(arguments.callee.caller);
  }
  if (opt_message) {
    // find the first unoccupied 'messageX' property
    var x = 0;
    while (error['message' + x]) {
      ++x;
    }
    error['message' + x] = String(opt_message);
  }
  return error;
};


/**
 * Gets the current stack trace. Simple and iterative - doesn't worry about
 * catching circular references or getting the args.
 * @param {number=} opt_depth Optional maximum depth to trace back to.
 * @return {string} A string with the function names of all functions in the
 *     stack, separated by \n.
 */
goog.debug.getStacktraceSimple = function(opt_depth) {
  var sb = [];
  var fn = arguments.callee.caller;
  var depth = 0;

  while (fn && (!opt_depth || depth < opt_depth)) {
    sb.push(goog.debug.getFunctionName(fn));
    sb.push('()\n');
    /** @preserveTry */
    try {
      fn = fn.caller;
    } catch (e) {
      sb.push('[exception trying to get caller]\n');
      break;
    }
    depth++;
    if (depth >= goog.debug.MAX_STACK_DEPTH) {
      sb.push('[...long stack...]');
      break;
    }
  }
  if (opt_depth && depth >= opt_depth) {
    sb.push('[...reached max depth limit...]');
  } else {
    sb.push('[end]');
  }

  return sb.join('');
};


/**
 * Max length of stack to try and output
 * @type {number}
 */
goog.debug.MAX_STACK_DEPTH = 50;


/**
 * Gets the current stack trace, either starting from the caller or starting
 * from a specified function that's currently on the call stack.
 * @param {Function=} opt_fn Optional function to start getting the trace from.
 *     If not provided, defaults to the function that called this.
 * @return {string} Stack trace.
 */
goog.debug.getStacktrace = function(opt_fn) {
  return goog.debug.getStacktraceHelper_(opt_fn || arguments.callee.caller, []);
};


/**
 * Private helper for getStacktrace().
 * @param {Function} fn Function to start getting the trace from.
 * @param {Array} visited List of functions visited so far.
 * @return {string} Stack trace starting from function fn.
 * @private
 */
goog.debug.getStacktraceHelper_ = function(fn, visited) {
  var sb = [];

  // Circular reference, certain functions like bind seem to cause a recursive
  // loop so we need to catch circular references
  if (goog.array.contains(visited, fn)) {
    sb.push('[...circular reference...]');

  // Traverse the call stack until function not found or max depth is reached
  } else if (fn && visited.length < goog.debug.MAX_STACK_DEPTH) {
    sb.push(goog.debug.getFunctionName(fn) + '(');
    var args = fn.arguments;
    for (var i = 0; i < args.length; i++) {
      if (i > 0) {
        sb.push(', ');
      }
      var argDesc;
      var arg = args[i];
      switch (typeof arg) {
        case 'object':
          argDesc = arg ? 'object' : 'null';
          break;

        case 'string':
          argDesc = arg;
          break;

        case 'number':
          argDesc = String(arg);
          break;

        case 'boolean':
          argDesc = arg ? 'true' : 'false';
          break;

        case 'function':
          argDesc = goog.debug.getFunctionName(arg);
          argDesc = argDesc ? argDesc : '[fn]';
          break;

        case 'undefined':
        default:
          argDesc = typeof arg;
          break;
      }

      if (argDesc.length > 40) {
        argDesc = argDesc.substr(0, 40) + '...';
      }
      sb.push(argDesc);
    }
    visited.push(fn);
    sb.push(')\n');
    /** @preserveTry */
    try {
      sb.push(goog.debug.getStacktraceHelper_(fn.caller, visited));
    } catch (e) {
      sb.push('[exception trying to get caller]\n');
    }

  } else if (fn) {
    sb.push('[...long stack...]');
  } else {
    sb.push('[end]');
  }
  return sb.join('');
};


/**
 * Set a custom function name resolver.
 * @param {function(Function): string} resolver Resolves functions to their
 *     names.
 */
goog.debug.setFunctionResolver = function(resolver) {
  goog.debug.fnNameResolver_ = resolver;
};


/**
 * Gets a function name
 * @param {Function} fn Function to get name of.
 * @return {string} Function's name.
 */
goog.debug.getFunctionName = function(fn) {
  if (goog.debug.fnNameCache_[fn]) {
    return goog.debug.fnNameCache_[fn];
  }
  if (goog.debug.fnNameResolver_) {
    var name = goog.debug.fnNameResolver_(fn);
    if (name) {
      goog.debug.fnNameCache_[fn] = name;
      return name;
    }
  }

  // Heuristically determine function name based on code.
  var functionSource = String(fn);
  if (!goog.debug.fnNameCache_[functionSource]) {
    var matches = /function ([^\(]+)/.exec(functionSource);
    if (matches) {
      var method = matches[1];
      goog.debug.fnNameCache_[functionSource] = method;
    } else {
      goog.debug.fnNameCache_[functionSource] = '[Anonymous]';
    }
  }

  return goog.debug.fnNameCache_[functionSource];
};


/**
 * Makes whitespace visible by replacing it with printable characters.
 * This is useful in finding diffrences between the expected and the actual
 * output strings of a testcase.
 * @param {string} string whose whitespace needs to be made visible.
 * @return {string} string whose whitespace is made visible.
 */
goog.debug.makeWhitespaceVisible = function(string) {
  return string.replace(/ /g, '[_]')
      .replace(/\f/g, '[f]')
      .replace(/\n/g, '[n]\n')
      .replace(/\r/g, '[r]')
      .replace(/\t/g, '[t]');
};


/**
 * Hash map for storing function names that have already been looked up.
 * @type {Object}
 * @private
 */
goog.debug.fnNameCache_ = {};


/**
 * Resolves functions to their names.  Resolved function names will be cached.
 * @type {function(Function):string}
 * @private
 */
goog.debug.fnNameResolver_;

// Input 16
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Definition of the LogRecord class. Please minimize
 * dependencies this file has on other closure classes as any dependency it
 * takes won't be able to use the logging infrastructure.
 *
 */

goog.provide('goog.debug.LogRecord');



/**
 * LogRecord objects are used to pass logging requests between
 * the logging framework and individual log Handlers.
 * @constructor
 * @param {goog.debug.Logger.Level} level One of the level identifiers.
 * @param {string} msg The string message.
 * @param {string} loggerName The name of the source logger.
 * @param {number=} opt_time Time this log record was created if other than now.
 *     If 0, we use #goog.now.
 * @param {number=} opt_sequenceNumber Sequence number of this log record. This
 *     should only be passed in when restoring a log record from persistence.
 */
goog.debug.LogRecord = function(level, msg, loggerName,
    opt_time, opt_sequenceNumber) {
  this.reset(level, msg, loggerName, opt_time, opt_sequenceNumber);
};


/**
 * Time the LogRecord was created.
 * @type {number}
 * @private
 */
goog.debug.LogRecord.prototype.time_;


/**
 * Level of the LogRecord
 * @type {goog.debug.Logger.Level}
 * @private
 */
goog.debug.LogRecord.prototype.level_;


/**
 * Message associated with the record
 * @type {string}
 * @private
 */
goog.debug.LogRecord.prototype.msg_;


/**
 * Name of the logger that created the record.
 * @type {string}
 * @private
 */
goog.debug.LogRecord.prototype.loggerName_;


/**
 * Sequence number for the LogRecord. Each record has a unique sequence number
 * that is greater than all log records created before it.
 * @type {number}
 * @private
 */
goog.debug.LogRecord.prototype.sequenceNumber_ = 0;


/**
 * Exception associated with the record
 * @type {Object}
 * @private
 */
goog.debug.LogRecord.prototype.exception_ = null;


/**
 * Exception text associated with the record
 * @type {?string}
 * @private
 */
goog.debug.LogRecord.prototype.exceptionText_ = null;


/**
 * @define {boolean} Whether to enable log sequence numbers.
 */
goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS = true;


/**
 * A sequence counter for assigning increasing sequence numbers to LogRecord
 * objects.
 * @type {number}
 * @private
 */
goog.debug.LogRecord.nextSequenceNumber_ = 0;


/**
 * Sets all fields of the log record.
 * @param {goog.debug.Logger.Level} level One of the level identifiers.
 * @param {string} msg The string message.
 * @param {string} loggerName The name of the source logger.
 * @param {number=} opt_time Time this log record was created if other than now.
 *     If 0, we use #goog.now.
 * @param {number=} opt_sequenceNumber Sequence number of this log record. This
 *     should only be passed in when restoring a log record from persistence.
 */
goog.debug.LogRecord.prototype.reset = function(level, msg, loggerName,
    opt_time, opt_sequenceNumber) {
  if (goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS) {
    this.sequenceNumber_ = typeof opt_sequenceNumber == 'number' ?
        opt_sequenceNumber : goog.debug.LogRecord.nextSequenceNumber_++;
  }

  this.time_ = opt_time || goog.now();
  this.level_ = level;
  this.msg_ = msg;
  this.loggerName_ = loggerName;
  delete this.exception_;
  delete this.exceptionText_;
};


/**
 * Get the source Logger's name.
 *
 * @return {string} source logger name (may be null).
 */
goog.debug.LogRecord.prototype.getLoggerName = function() {
  return this.loggerName_;
};


/**
 * Get the exception that is part of the log record.
 *
 * @return {Object} the exception.
 */
goog.debug.LogRecord.prototype.getException = function() {
  return this.exception_;
};


/**
 * Set the exception that is part of the log record.
 *
 * @param {Object} exception the exception.
 */
goog.debug.LogRecord.prototype.setException = function(exception) {
  this.exception_ = exception;
};


/**
 * Get the exception text that is part of the log record.
 *
 * @return {?string} Exception text.
 */
goog.debug.LogRecord.prototype.getExceptionText = function() {
  return this.exceptionText_;
};


/**
 * Set the exception text that is part of the log record.
 *
 * @param {string} text The exception text.
 */
goog.debug.LogRecord.prototype.setExceptionText = function(text) {
  this.exceptionText_ = text;
};


/**
 * Get the source Logger's name.
 *
 * @param {string} loggerName source logger name (may be null).
 */
goog.debug.LogRecord.prototype.setLoggerName = function(loggerName) {
  this.loggerName_ = loggerName;
};


/**
 * Get the logging message level, for example Level.SEVERE.
 * @return {goog.debug.Logger.Level} the logging message level.
 */
goog.debug.LogRecord.prototype.getLevel = function() {
  return this.level_;
};


/**
 * Set the logging message level, for example Level.SEVERE.
 * @param {goog.debug.Logger.Level} level the logging message level.
 */
goog.debug.LogRecord.prototype.setLevel = function(level) {
  this.level_ = level;
};


/**
 * Get the "raw" log message, before localization or formatting.
 *
 * @return {string} the raw message string.
 */
goog.debug.LogRecord.prototype.getMessage = function() {
  return this.msg_;
};


/**
 * Set the "raw" log message, before localization or formatting.
 *
 * @param {string} msg the raw message string.
 */
goog.debug.LogRecord.prototype.setMessage = function(msg) {
  this.msg_ = msg;
};


/**
 * Get event time in milliseconds since 1970.
 *
 * @return {number} event time in millis since 1970.
 */
goog.debug.LogRecord.prototype.getMillis = function() {
  return this.time_;
};


/**
 * Set event time in milliseconds since 1970.
 *
 * @param {number} time event time in millis since 1970.
 */
goog.debug.LogRecord.prototype.setMillis = function(time) {
  this.time_ = time;
};


/**
 * Get the sequence number.
 * <p>
 * Sequence numbers are normally assigned in the LogRecord
 * constructor, which assigns unique sequence numbers to
 * each new LogRecord in increasing order.
 * @return {number} the sequence number.
 */
goog.debug.LogRecord.prototype.getSequenceNumber = function() {
  return this.sequenceNumber_;
};


// Input 17
// Copyright 2010 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A buffer for log records. The purpose of this is to improve
 * logging performance by re-using old objects when the buffer becomes full and
 * to eliminate the need for each app to implement their own log buffer. The
 * disadvantage to doing this is that log handlers cannot maintain references to
 * log records and expect that they are not overwriten at a later point.
 *
 * @author agrieve@google.com (Andrew Grieve)
 */

goog.provide('goog.debug.LogBuffer');

goog.require('goog.asserts');
goog.require('goog.debug.LogRecord');



/**
 * Creates the log buffer.
 * @constructor
 */
goog.debug.LogBuffer = function() {
  goog.asserts.assert(goog.debug.LogBuffer.isBufferingEnabled(),
      'Cannot use goog.debug.LogBuffer without defining ' +
      'goog.debug.LogBuffer.CAPACITY.');
  this.clear();
};


/**
 * A static method that always returns the same instance of LogBuffer.
 * @return {!goog.debug.LogBuffer} The LogBuffer singleton instance.
 */
goog.debug.LogBuffer.getInstance = function() {
  if (!goog.debug.LogBuffer.instance_) {
    // This function is written with the return statement after the assignment
    // to avoid the jscompiler StripCode bug described in http://b/2608064.
    // After that bug is fixed this can be refactored.
    goog.debug.LogBuffer.instance_ = new goog.debug.LogBuffer();
  }
  return goog.debug.LogBuffer.instance_;
};


/**
 * @define {number} The number of log records to buffer. 0 means disable
 * buffering.
 */
goog.debug.LogBuffer.CAPACITY = 0;


/**
 * The array to store the records.
 * @type {!Array.<!goog.debug.LogRecord|undefined>}
 * @private
 */
goog.debug.LogBuffer.prototype.buffer_;


/**
 * The index of the most recently added record or -1 if there are no records.
 * @type {number}
 * @private
 */
goog.debug.LogBuffer.prototype.curIndex_;


/**
 * Whether the buffer is at capacity.
 * @type {boolean}
 * @private
 */
goog.debug.LogBuffer.prototype.isFull_;


/**
 * Adds a log record to the buffer, possibly overwriting the oldest record.
 * @param {goog.debug.Logger.Level} level One of the level identifiers.
 * @param {string} msg The string message.
 * @param {string} loggerName The name of the source logger.
 * @return {!goog.debug.LogRecord} The log record.
 */
goog.debug.LogBuffer.prototype.addRecord = function(level, msg, loggerName) {
  var curIndex = (this.curIndex_ + 1) % goog.debug.LogBuffer.CAPACITY;
  this.curIndex_ = curIndex;
  if (this.isFull_) {
    var ret = this.buffer_[curIndex];
    ret.reset(level, msg, loggerName);
    return ret;
  }
  this.isFull_ = curIndex == goog.debug.LogBuffer.CAPACITY - 1;
  return this.buffer_[curIndex] =
      new goog.debug.LogRecord(level, msg, loggerName);
};


/**
 * @return {boolean} Whether the log buffer is enabled.
 */
goog.debug.LogBuffer.isBufferingEnabled = function() {
  return goog.debug.LogBuffer.CAPACITY > 0;
};


/**
 * Removes all buffered log records.
 */
goog.debug.LogBuffer.prototype.clear = function() {
  this.buffer_ = new Array(goog.debug.LogBuffer.CAPACITY);
  this.curIndex_ = -1;
  this.isFull_ = false;
};


/**
 * Calls the given function for each buffered log record, starting with the
 * oldest one.
 * @param {function(!goog.debug.LogRecord)} func The function to call.
 */
goog.debug.LogBuffer.prototype.forEachRecord = function(func) {
  var buffer = this.buffer_;
  // Corner case: no records.
  if (!buffer[0]) {
    return;
  }
  var curIndex = this.curIndex_;
  var i = this.isFull_ ? curIndex : -1;
  do {
    i = (i + 1) % goog.debug.LogBuffer.CAPACITY;
    func(/** @type {!goog.debug.LogRecord} */ (buffer[i]));
  } while (i != curIndex);
};


// Input 18
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Definition of the Logger class. Please minimize dependencies
 * this file has on other closure classes as any dependency it takes won't be
 * able to use the logging infrastructure.
 *
 * @see ../demos/debug.html
 */

goog.provide('goog.debug.LogManager');
goog.provide('goog.debug.Logger');
goog.provide('goog.debug.Logger.Level');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.debug');
goog.require('goog.debug.LogBuffer');
goog.require('goog.debug.LogRecord');



/**
 * The Logger is an object used for logging debug messages. Loggers are
 * normally named, using a hierarchical dot-separated namespace. Logger names
 * can be arbitrary strings, but they should normally be based on the package
 * name or class name of the logged component, such as goog.net.BrowserChannel.
 *
 * The Logger object is loosely based on the java class
 * java.util.logging.Logger. It supports different levels of filtering for
 * different loggers.
 *
 * The logger object should never be instantiated by application code. It
 * should always use the goog.debug.Logger.getLogger function.
 *
 * @constructor
 * @param {string} name The name of the Logger.
 */
goog.debug.Logger = function(name) {
  /**
   * Name of the Logger. Generally a dot-separated namespace
   * @type {string}
   * @private
   */
  this.name_ = name;
};


/**
 * Parent Logger.
 * @type {goog.debug.Logger}
 * @private
 */
goog.debug.Logger.prototype.parent_ = null;


/**
 * Level that this logger only filters above. Null indicates it should
 * inherit from the parent.
 * @type {goog.debug.Logger.Level}
 * @private
 */
goog.debug.Logger.prototype.level_ = null;


/**
 * Map of children loggers. The keys are the leaf names of the children and
 * the values are the child loggers.
 * @type {Object}
 * @private
 */
goog.debug.Logger.prototype.children_ = null;


/**
 * Handlers that are listening to this logger.
 * @type {Array.<Function>}
 * @private
 */
goog.debug.Logger.prototype.handlers_ = null;


/**
 * @define {boolean} Toggles whether loggers other than the root logger can have
 *     log handlers attached to them and whether they can have their log level
 *     set. Logging is a bit faster when this is set to false.
 */
goog.debug.Logger.ENABLE_HIERARCHY = true;


if (!goog.debug.Logger.ENABLE_HIERARCHY) {
  /**
   * @type {!Array.<Function>}
   * @private
   */
  goog.debug.Logger.rootHandlers_ = [];


  /**
   * @type {goog.debug.Logger.Level}
   * @private
   */
  goog.debug.Logger.rootLevel_;
}



/**
 * The Level class defines a set of standard logging levels that
 * can be used to control logging output.  The logging Level objects
 * are ordered and are specified by ordered integers.  Enabling logging
 * at a given level also enables logging at all higher levels.
 * <p>
 * Clients should normally use the predefined Level constants such
 * as Level.SEVERE.
 * <p>
 * The levels in descending order are:
 * <ul>
 * <li>SEVERE (highest value)
 * <li>WARNING
 * <li>INFO
 * <li>CONFIG
 * <li>FINE
 * <li>FINER
 * <li>FINEST  (lowest value)
 * </ul>
 * In addition there is a level OFF that can be used to turn
 * off logging, and a level ALL that can be used to enable
 * logging of all messages.
 *
 * @param {string} name The name of the level.
 * @param {number} value The numeric value of the level.
 * @constructor
 */
goog.debug.Logger.Level = function(name, value) {
  /**
   * The name of the level
   * @type {string}
   */
  this.name = name;

  /**
   * The numeric value of the level
   * @type {number}
   */
  this.value = value;
};


/**
 * @return {string} String representation of the logger level.
 * @override
 */
goog.debug.Logger.Level.prototype.toString = function() {
  return this.name;
};


/**
 * OFF is a special level that can be used to turn off logging.
 * This level is initialized to <CODE>Number.MAX_VALUE</CODE>.
 * @type {!goog.debug.Logger.Level}
 */
goog.debug.Logger.Level.OFF =
    new goog.debug.Logger.Level('OFF', Infinity);


/**
 * SHOUT is a message level for extra debugging loudness.
 * This level is initialized to <CODE>1200</CODE>.
 * @type {!goog.debug.Logger.Level}
 */
goog.debug.Logger.Level.SHOUT = new goog.debug.Logger.Level('SHOUT', 1200);


/**
 * SEVERE is a message level indicating a serious failure.
 * This level is initialized to <CODE>1000</CODE>.
 * @type {!goog.debug.Logger.Level}
 */
goog.debug.Logger.Level.SEVERE = new goog.debug.Logger.Level('SEVERE', 1000);


/**
 * WARNING is a message level indicating a potential problem.
 * This level is initialized to <CODE>900</CODE>.
 * @type {!goog.debug.Logger.Level}
 */
goog.debug.Logger.Level.WARNING = new goog.debug.Logger.Level('WARNING', 900);


/**
 * INFO is a message level for informational messages.
 * This level is initialized to <CODE>800</CODE>.
 * @type {!goog.debug.Logger.Level}
 */
goog.debug.Logger.Level.INFO = new goog.debug.Logger.Level('INFO', 800);


/**
 * CONFIG is a message level for static configuration messages.
 * This level is initialized to <CODE>700</CODE>.
 * @type {!goog.debug.Logger.Level}
 */
goog.debug.Logger.Level.CONFIG = new goog.debug.Logger.Level('CONFIG', 700);


/**
 * FINE is a message level providing tracing information.
 * This level is initialized to <CODE>500</CODE>.
 * @type {!goog.debug.Logger.Level}
 */
goog.debug.Logger.Level.FINE = new goog.debug.Logger.Level('FINE', 500);


/**
 * FINER indicates a fairly detailed tracing message.
 * This level is initialized to <CODE>400</CODE>.
 * @type {!goog.debug.Logger.Level}
 */
goog.debug.Logger.Level.FINER = new goog.debug.Logger.Level('FINER', 400);

/**
 * FINEST indicates a highly detailed tracing message.
 * This level is initialized to <CODE>300</CODE>.
 * @type {!goog.debug.Logger.Level}
 */

goog.debug.Logger.Level.FINEST = new goog.debug.Logger.Level('FINEST', 300);


/**
 * ALL indicates that all messages should be logged.
 * This level is initialized to <CODE>Number.MIN_VALUE</CODE>.
 * @type {!goog.debug.Logger.Level}
 */
goog.debug.Logger.Level.ALL = new goog.debug.Logger.Level('ALL', 0);


/**
 * The predefined levels.
 * @type {!Array.<!goog.debug.Logger.Level>}
 * @final
 */
goog.debug.Logger.Level.PREDEFINED_LEVELS = [
  goog.debug.Logger.Level.OFF,
  goog.debug.Logger.Level.SHOUT,
  goog.debug.Logger.Level.SEVERE,
  goog.debug.Logger.Level.WARNING,
  goog.debug.Logger.Level.INFO,
  goog.debug.Logger.Level.CONFIG,
  goog.debug.Logger.Level.FINE,
  goog.debug.Logger.Level.FINER,
  goog.debug.Logger.Level.FINEST,
  goog.debug.Logger.Level.ALL];


/**
 * A lookup map used to find the level object based on the name or value of
 * the level object.
 * @type {Object}
 * @private
 */
goog.debug.Logger.Level.predefinedLevelsCache_ = null;


/**
 * Creates the predefined levels cache and populates it.
 * @private
 */
goog.debug.Logger.Level.createPredefinedLevelsCache_ = function() {
  goog.debug.Logger.Level.predefinedLevelsCache_ = {};
  for (var i = 0, level; level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];
       i++) {
    goog.debug.Logger.Level.predefinedLevelsCache_[level.value] = level;
    goog.debug.Logger.Level.predefinedLevelsCache_[level.name] = level;
  }
};


/**
 * Gets the predefined level with the given name.
 * @param {string} name The name of the level.
 * @return {goog.debug.Logger.Level} The level, or null if none found.
 */
goog.debug.Logger.Level.getPredefinedLevel = function(name) {
  if (!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_();
  }

  return goog.debug.Logger.Level.predefinedLevelsCache_[name] || null;
};


/**
 * Gets the highest predefined level <= #value.
 * @param {number} value Level value.
 * @return {goog.debug.Logger.Level} The level, or null if none found.
 */
goog.debug.Logger.Level.getPredefinedLevelByValue = function(value) {
  if (!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_();
  }

  if (value in goog.debug.Logger.Level.predefinedLevelsCache_) {
    return goog.debug.Logger.Level.predefinedLevelsCache_[value];
  }

  for (var i = 0; i < goog.debug.Logger.Level.PREDEFINED_LEVELS.length; ++i) {
    var level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];
    if (level.value <= value) {
      return level;
    }
  }
  return null;
};


/**
 * Find or create a logger for a named subsystem. If a logger has already been
 * created with the given name it is returned. Otherwise a new logger is
 * created. If a new logger is created its log level will be configured based
 * on the LogManager configuration and it will configured to also send logging
 * output to its parent's handlers. It will be registered in the LogManager
 * global namespace.
 *
 * @param {string} name A name for the logger. This should be a dot-separated
 * name and should normally be based on the package name or class name of the
 * subsystem, such as goog.net.BrowserChannel.
 * @return {!goog.debug.Logger} The named logger.
 */
goog.debug.Logger.getLogger = function(name) {
  return goog.debug.LogManager.getLogger(name);
};


/**
 * Logs a message to profiling tools, if available.
 * {@see http://code.google.com/webtoolkit/speedtracer/logging-api.html}
 * {@see http://msdn.microsoft.com/en-us/library/dd433074(VS.85).aspx}
 * @param {string} msg The message to log.
 */
goog.debug.Logger.logToProfilers = function(msg) {
  // Using goog.global, as loggers might be used in window-less contexts.
  if (goog.global['console']) {
    if (goog.global['console']['timeStamp']) {
      // Logs a message to Firebug, Web Inspector, SpeedTracer, etc.
      goog.global['console']['timeStamp'](msg);
    } else if (goog.global['console']['markTimeline']) {
      // TODO(user): markTimeline is deprecated. Drop this else clause entirely
      // after Chrome M14 hits stable.
      goog.global['console']['markTimeline'](msg);
    }
  }

  if (goog.global['msWriteProfilerMark']) {
    // Logs a message to the Microsoft profiler
    goog.global['msWriteProfilerMark'](msg);
  }
};


/**
 * Gets the name of this logger.
 * @return {string} The name of this logger.
 */
goog.debug.Logger.prototype.getName = function() {
  return this.name_;
};


/**
 * Adds a handler to the logger. This doesn't use the event system because
 * we want to be able to add logging to the event system.
 * @param {Function} handler Handler function to add.
 */
goog.debug.Logger.prototype.addHandler = function(handler) {
  if (goog.debug.Logger.ENABLE_HIERARCHY) {
    if (!this.handlers_) {
      this.handlers_ = [];
    }
    this.handlers_.push(handler);
  } else {
    goog.asserts.assert(!this.name_,
        'Cannot call addHandler on a non-root logger when ' +
        'goog.debug.Logger.ENABLE_HIERARCHY is false.');
    goog.debug.Logger.rootHandlers_.push(handler);
  }
};


/**
 * Removes a handler from the logger. This doesn't use the event system because
 * we want to be able to add logging to the event system.
 * @param {Function} handler Handler function to remove.
 * @return {boolean} Whether the handler was removed.
 */
goog.debug.Logger.prototype.removeHandler = function(handler) {
  var handlers = goog.debug.Logger.ENABLE_HIERARCHY ? this.handlers_ :
      goog.debug.Logger.rootHandlers_;
  return !!handlers && goog.array.remove(handlers, handler);
};


/**
 * Returns the parent of this logger.
 * @return {goog.debug.Logger} The parent logger or null if this is the root.
 */
goog.debug.Logger.prototype.getParent = function() {
  return this.parent_;
};


/**
 * Returns the children of this logger as a map of the child name to the logger.
 * @return {!Object} The map where the keys are the child leaf names and the
 *     values are the Logger objects.
 */
goog.debug.Logger.prototype.getChildren = function() {
  if (!this.children_) {
    this.children_ = {};
  }
  return this.children_;
};


/**
 * Set the log level specifying which message levels will be logged by this
 * logger. Message levels lower than this value will be discarded.
 * The level value Level.OFF can be used to turn off logging. If the new level
 * is null, it means that this node should inherit its level from its nearest
 * ancestor with a specific (non-null) level value.
 *
 * @param {goog.debug.Logger.Level} level The new level.
 */
goog.debug.Logger.prototype.setLevel = function(level) {
  if (goog.debug.Logger.ENABLE_HIERARCHY) {
    this.level_ = level;
  } else {
    goog.asserts.assert(!this.name_,
        'Cannot call setLevel() on a non-root logger when ' +
        'goog.debug.Logger.ENABLE_HIERARCHY is false.');
    goog.debug.Logger.rootLevel_ = level;
  }
};


/**
 * Gets the log level specifying which message levels will be logged by this
 * logger. Message levels lower than this value will be discarded.
 * The level value Level.OFF can be used to turn off logging. If the level
 * is null, it means that this node should inherit its level from its nearest
 * ancestor with a specific (non-null) level value.
 *
 * @return {goog.debug.Logger.Level} The level.
 */
goog.debug.Logger.prototype.getLevel = function() {
  return this.level_;
};


/**
 * Returns the effective level of the logger based on its ancestors' levels.
 * @return {goog.debug.Logger.Level} The level.
 */
goog.debug.Logger.prototype.getEffectiveLevel = function() {
  if (!goog.debug.Logger.ENABLE_HIERARCHY) {
    return goog.debug.Logger.rootLevel_;
  }
  if (this.level_) {
    return this.level_;
  }
  if (this.parent_) {
    return this.parent_.getEffectiveLevel();
  }
  goog.asserts.fail('Root logger has no level set.');
  return null;
};


/**
 * Check if a message of the given level would actually be logged by this
 * logger. This check is based on the Loggers effective level, which may be
 * inherited from its parent.
 * @param {goog.debug.Logger.Level} level The level to check.
 * @return {boolean} Whether the message would be logged.
 */
goog.debug.Logger.prototype.isLoggable = function(level) {
  return level.value >= this.getEffectiveLevel().value;
};


/**
 * Log a message. If the logger is currently enabled for the
 * given message level then the given message is forwarded to all the
 * registered output Handler objects.
 * @param {goog.debug.Logger.Level} level One of the level identifiers.
 * @param {string} msg The string message.
 * @param {Error|Object=} opt_exception An exception associated with the
 *     message.
 */
goog.debug.Logger.prototype.log = function(level, msg, opt_exception) {
  // java caches the effective level, not sure it's necessary here
  if (this.isLoggable(level)) {
    this.doLogRecord_(this.getLogRecord(level, msg, opt_exception));
  }
};


/**
 * Creates a new log record and adds the exception (if present) to it.
 * @param {goog.debug.Logger.Level} level One of the level identifiers.
 * @param {string} msg The string message.
 * @param {Error|Object=} opt_exception An exception associated with the
 *     message.
 * @return {!goog.debug.LogRecord} A log record.
 */
goog.debug.Logger.prototype.getLogRecord = function(level, msg, opt_exception) {
  if (goog.debug.LogBuffer.isBufferingEnabled()) {
    var logRecord =
        goog.debug.LogBuffer.getInstance().addRecord(level, msg, this.name_);
  } else {
    logRecord = new goog.debug.LogRecord(level, String(msg), this.name_);
  }
  if (opt_exception) {
    logRecord.setException(opt_exception);
    logRecord.setExceptionText(
        goog.debug.exposeException(opt_exception, arguments.callee.caller));
  }
  return logRecord;
};


/**
 * Log a message at the Logger.Level.SHOUT level.
 * If the logger is currently enabled for the given message level then the
 * given message is forwarded to all the registered output Handler objects.
 * @param {string} msg The string message.
 * @param {Error=} opt_exception An exception associated with the message.
 */
goog.debug.Logger.prototype.shout = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SHOUT, msg, opt_exception);
};


/**
 * Log a message at the Logger.Level.SEVERE level.
 * If the logger is currently enabled for the given message level then the
 * given message is forwarded to all the registered output Handler objects.
 * @param {string} msg The string message.
 * @param {Error=} opt_exception An exception associated with the message.
 */
goog.debug.Logger.prototype.severe = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SEVERE, msg, opt_exception);
};


/**
 * Log a message at the Logger.Level.WARNING level.
 * If the logger is currently enabled for the given message level then the
 * given message is forwarded to all the registered output Handler objects.
 * @param {string} msg The string message.
 * @param {Error=} opt_exception An exception associated with the message.
 */
goog.debug.Logger.prototype.warning = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.WARNING, msg, opt_exception);
};


/**
 * Log a message at the Logger.Level.INFO level.
 * If the logger is currently enabled for the given message level then the
 * given message is forwarded to all the registered output Handler objects.
 * @param {string} msg The string message.
 * @param {Error=} opt_exception An exception associated with the message.
 */
goog.debug.Logger.prototype.info = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.INFO, msg, opt_exception);
};


/**
 * Log a message at the Logger.Level.CONFIG level.
 * If the logger is currently enabled for the given message level then the
 * given message is forwarded to all the registered output Handler objects.
 * @param {string} msg The string message.
 * @param {Error=} opt_exception An exception associated with the message.
 */
goog.debug.Logger.prototype.config = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.CONFIG, msg, opt_exception);
};


/**
 * Log a message at the Logger.Level.FINE level.
 * If the logger is currently enabled for the given message level then the
 * given message is forwarded to all the registered output Handler objects.
 * @param {string} msg The string message.
 * @param {Error=} opt_exception An exception associated with the message.
 */
goog.debug.Logger.prototype.fine = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINE, msg, opt_exception);
};


/**
 * Log a message at the Logger.Level.FINER level.
 * If the logger is currently enabled for the given message level then the
 * given message is forwarded to all the registered output Handler objects.
 * @param {string} msg The string message.
 * @param {Error=} opt_exception An exception associated with the message.
 */
goog.debug.Logger.prototype.finer = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINER, msg, opt_exception);
};


/**
 * Log a message at the Logger.Level.FINEST level.
 * If the logger is currently enabled for the given message level then the
 * given message is forwarded to all the registered output Handler objects.
 * @param {string} msg The string message.
 * @param {Error=} opt_exception An exception associated with the message.
 */
goog.debug.Logger.prototype.finest = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINEST, msg, opt_exception);
};


/**
 * Log a LogRecord. If the logger is currently enabled for the
 * given message level then the given message is forwarded to all the
 * registered output Handler objects.
 * @param {goog.debug.LogRecord} logRecord A log record to log.
 */
goog.debug.Logger.prototype.logRecord = function(logRecord) {
  if (this.isLoggable(logRecord.getLevel())) {
    this.doLogRecord_(logRecord);
  }
};


/**
 * Log a LogRecord.
 * @param {goog.debug.LogRecord} logRecord A log record to log.
 * @private
 */
goog.debug.Logger.prototype.doLogRecord_ = function(logRecord) {
  goog.debug.Logger.logToProfilers('log:' + logRecord.getMessage());
  if (goog.debug.Logger.ENABLE_HIERARCHY) {
    var target = this;
    while (target) {
      target.callPublish_(logRecord);
      target = target.getParent();
    }
  } else {
    for (var i = 0, handler; handler = goog.debug.Logger.rootHandlers_[i++]; ) {
      handler(logRecord);
    }
  }
};


/**
 * Calls the handlers for publish.
 * @param {goog.debug.LogRecord} logRecord The log record to publish.
 * @private
 */
goog.debug.Logger.prototype.callPublish_ = function(logRecord) {
  if (this.handlers_) {
    for (var i = 0, handler; handler = this.handlers_[i]; i++) {
      handler(logRecord);
    }
  }
};


/**
 * Sets the parent of this logger. This is used for setting up the logger tree.
 * @param {goog.debug.Logger} parent The parent logger.
 * @private
 */
goog.debug.Logger.prototype.setParent_ = function(parent) {
  this.parent_ = parent;
};


/**
 * Adds a child to this logger. This is used for setting up the logger tree.
 * @param {string} name The leaf name of the child.
 * @param {goog.debug.Logger} logger The child logger.
 * @private
 */
goog.debug.Logger.prototype.addChild_ = function(name, logger) {
  this.getChildren()[name] = logger;
};


/**
 * There is a single global LogManager object that is used to maintain a set of
 * shared state about Loggers and log services. This is loosely based on the
 * java class java.util.logging.LogManager.
 */
goog.debug.LogManager = {};


/**
 * Map of logger names to logger objects
 *
 * @type {!Object}
 * @private
 */
goog.debug.LogManager.loggers_ = {};


/**
 * The root logger which is the root of the logger tree.
 * @type {goog.debug.Logger}
 * @private
 */
goog.debug.LogManager.rootLogger_ = null;


/**
 * Initialize the LogManager if not already initialized
 */
goog.debug.LogManager.initialize = function() {
  if (!goog.debug.LogManager.rootLogger_) {
    goog.debug.LogManager.rootLogger_ = new goog.debug.Logger('');
    goog.debug.LogManager.loggers_[''] = goog.debug.LogManager.rootLogger_;
    goog.debug.LogManager.rootLogger_.setLevel(goog.debug.Logger.Level.CONFIG);
  }
};


/**
 * Returns all the loggers
 * @return {!Object} Map of logger names to logger objects.
 */
goog.debug.LogManager.getLoggers = function() {
  return goog.debug.LogManager.loggers_;
};


/**
 * Returns the root of the logger tree namespace, the logger with the empty
 * string as its name
 *
 * @return {!goog.debug.Logger} The root logger.
 */
goog.debug.LogManager.getRoot = function() {
  goog.debug.LogManager.initialize();
  return /** @type {!goog.debug.Logger} */ (goog.debug.LogManager.rootLogger_);
};


/**
 * Method to find a named logger.
 *
 * @param {string} name A name for the logger. This should be a dot-separated
 * name and should normally be based on the package name or class name of the
 * subsystem, such as goog.net.BrowserChannel.
 * @return {!goog.debug.Logger} The named logger.
 */
goog.debug.LogManager.getLogger = function(name) {
  goog.debug.LogManager.initialize();
  var ret = goog.debug.LogManager.loggers_[name];
  return ret || goog.debug.LogManager.createLogger_(name);
};


/**
 * Creates a function that can be passed to goog.debug.catchErrors. The function
 * will log all reported errors using the given logger.
 * @param {goog.debug.Logger=} opt_logger The logger to log the errors to.
 *     Defaults to the root logger.
 * @return {function(Object)} The created function.
 */
goog.debug.LogManager.createFunctionForCatchErrors = function(opt_logger) {
  return function(info) {
    var logger = opt_logger || goog.debug.LogManager.getRoot();
    logger.severe('Error: ' + info.message + ' (' + info.fileName +
                  ' @ Line: ' + info.line + ')');
  };
};


/**
 * Creates the named logger. Will also create the parents of the named logger
 * if they don't yet exist.
 * @param {string} name The name of the logger.
 * @return {!goog.debug.Logger} The named logger.
 * @private
 */
goog.debug.LogManager.createLogger_ = function(name) {
  // find parent logger
  var logger = new goog.debug.Logger(name);
  if (goog.debug.Logger.ENABLE_HIERARCHY) {
    var lastDotIndex = name.lastIndexOf('.');
    var parentName = name.substr(0, lastDotIndex);
    var leafName = name.substr(lastDotIndex + 1);
    var parentLogger = goog.debug.LogManager.getLogger(parentName);

    // tell the parent about the child and the child about the parent
    parentLogger.addChild_(leafName, logger);
    logger.setParent_(parentLogger);
  }

  goog.debug.LogManager.loggers_[name] = logger;
  return logger;
};

// Input 19
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Functions to provide timezone information for use with
 * date/time format.
 */

goog.provide('goog.i18n.TimeZone');

goog.require('goog.array');
goog.require('goog.date.DateLike');
goog.require('goog.string');



/**
 * TimeZone class implemented a time zone resolution and name information
 * source for client applications. The time zone object is initiated from
 * a time zone information object. Application can initiate a time zone
 * statically, or it may choose to initiate from a data obtained from server.
 * Each time zone information array is small, but the whole set of data
 * is too much for client application to download. If end user is allowed to
 * change time zone setting, dynamic retrieval should be the method to use.
 * In case only time zone offset is known, there is a decent fallback
 * that only use the time zone offset to create a TimeZone object.
 * A whole set of time zone information array was available under
 * http://go/js_locale_data. It is generated based on CLDR and
 * Olson time zone data base (through pytz), and will be updated timely.
 *
 * @constructor
 */
goog.i18n.TimeZone = function() {
  /**
   * The standard time zone id.
   * @type {string}
   * @private
   */
  this.timeZoneId_;


  /**
   * The standard, non-daylight time zone offset, in minutes WEST of UTC.
   * @type {number}
   * @private
   */
  this.standardOffset_;


  /**
   * An array of strings that can have 2 or 4 elements.  The first two elements
   * are the long and short names for standard time in this time zone, and the
   * last two elements (if present) are the long and short names for daylight
   * time in this time zone.
   * @type {Array.<string>}
   * @private
   */
  this.tzNames_;


  /**
   * This array specifies the Daylight Saving Time transitions for this time
   * zone.  This is a flat array of numbers which are interpreted in pairs:
   * [time1, adjustment1, time2, adjustment2, ...] where each time is a DST
   * transition point given as a number of hours since 00:00 UTC, January 1,
   * 1970, and each adjustment is the adjustment to apply for times after the
   * DST transition, given as minutes EAST of UTC.
   * @type {Array.<number>}
   * @private
   */
  this.transitions_;
};


/**
 * The number of milliseconds in an hour.
 * @type {number}
 * @private
 */
goog.i18n.TimeZone.MILLISECONDS_PER_HOUR_ = 3600 * 1000;


/**
 * Indices into the array of time zone names.
 * @enum {number}
 */
goog.i18n.TimeZone.NameType = {
  STD_SHORT_NAME: 0,
  STD_LONG_NAME: 1,
  DLT_SHORT_NAME: 2,
  DLT_LONG_NAME: 3
};


/**
 * This factory method creates a time zone instance.  It takes either an object
 * containing complete time zone information, or a single number representing a
 * constant time zone offset.  If the latter form is used, DST functionality is
 * not available.
 *
 * @param {number|Object} timeZoneData If this parameter is a number, it should
 *     indicate minutes WEST of UTC to be used as a constant time zone offset.
 *     Otherwise, it should be an object with these four fields:
 *     <ul>
 *     <li>id: A string ID for the time zone.
 *     <li>std_offset: The standard time zone offset in minutes EAST of UTC.
 *     <li>names: An array of four names (standard short name, standard long
 *           name, daylight short name, daylight long, name)
 *     <li>transitions: An array of numbers which are interpreted in pairs:
 *           [time1, adjustment1, time2, adjustment2, ...] where each time is
 *           a DST transition point given as a number of hours since 00:00 UTC,
 *           January 1, 1970, and each adjustment is the adjustment to apply
 *           for times after the DST transition, given as minutes EAST of UTC.
 *     </ul>
 * @return {goog.i18n.TimeZone} A goog.i18n.TimeZone object for the given
 *     time zone data.
 */
goog.i18n.TimeZone.createTimeZone = function(timeZoneData) {
  if (typeof timeZoneData == 'number') {
    return goog.i18n.TimeZone.createSimpleTimeZone_(timeZoneData);
  }
  var tz = new goog.i18n.TimeZone();
  tz.timeZoneId_ = timeZoneData['id'];
  tz.standardOffset_ = -timeZoneData['std_offset'];
  tz.tzNames_ = timeZoneData['names'];
  tz.transitions_ = timeZoneData['transitions'];
  return tz;
};


/**
 * This factory method creates a time zone object with a constant offset.
 * @param {number} timeZoneOffsetInMinutes Offset in minutes WEST of UTC.
 * @return {goog.i18n.TimeZone} A time zone object with the given constant
 *     offset.  Note that the time zone ID of this object will use the POSIX
 *     convention, which has a reversed sign ("Etc/GMT+8" means UTC-8 or PST).
 * @private
 */
goog.i18n.TimeZone.createSimpleTimeZone_ = function(timeZoneOffsetInMinutes) {
  var tz = new goog.i18n.TimeZone();
  tz.standardOffset_ = timeZoneOffsetInMinutes;
  tz.timeZoneId_ =
      goog.i18n.TimeZone.composePosixTimeZoneID_(timeZoneOffsetInMinutes);
  var str = goog.i18n.TimeZone.composeUTCString_(timeZoneOffsetInMinutes);
  tz.tzNames_ = [str, str];
  tz.transitions_ = [];
  return tz;
};


/**
 * Generate a GMT-relative string for a constant time zone offset.
 * @param {number} offset The time zone offset in minutes WEST of UTC.
 * @return {string} The GMT string for this offset, which will indicate
 *     hours EAST of UTC.
 * @private
 */
goog.i18n.TimeZone.composeGMTString_ = function(offset) {
  var parts = ['GMT'];
  parts.push(offset <= 0 ? '+' : '-');
  offset = Math.abs(offset);
  parts.push(goog.string.padNumber(Math.floor(offset / 60) % 100, 2),
             ':', goog.string.padNumber(offset % 60, 2));
  return parts.join('');
};


/**
 * Generate a POSIX time zone ID for a constant time zone offset.
 * @param {number} offset The time zone offset in minutes WEST of UTC.
 * @return {string} The POSIX time zone ID for this offset, which will indicate
 *     hours WEST of UTC.
 * @private
 */
goog.i18n.TimeZone.composePosixTimeZoneID_ = function(offset) {
  if (offset == 0) {
    return 'Etc/GMT';
  }
  var parts = ['Etc/GMT', offset < 0 ? '-' : '+'];
  offset = Math.abs(offset);
  parts.push(Math.floor(offset / 60) % 100);
  offset = offset % 60;
  if (offset != 0) {
    parts.push(':', goog.string.padNumber(offset, 2));
  }
  return parts.join('');
};


/**
 * Generate a UTC-relative string for a constant time zone offset.
 * @param {number} offset The time zone offset in minutes WEST of UTC.
 * @return {string} The UTC string for this offset, which will indicate
 *     hours EAST of UTC.
 * @private
 */
goog.i18n.TimeZone.composeUTCString_ = function(offset) {
  if (offset == 0) {
    return 'UTC';
  }
  var parts = ['UTC', offset < 0 ? '+' : '-'];
  offset = Math.abs(offset);
  parts.push(Math.floor(offset / 60) % 100);
  offset = offset % 60;
  if (offset != 0) {
    parts.push(':', offset);
  }
  return parts.join('');
};


/**
 * Convert the contents of time zone object to a timeZoneData object, suitable
 * for passing to goog.i18n.TimeZone.createTimeZone.
 * @return {Object} A timeZoneData object (see the documentation for
 *     goog.i18n.TimeZone.createTimeZone).
 */
goog.i18n.TimeZone.prototype.getTimeZoneData = function() {
  return {
    'id': this.timeZoneId_,
    'std_offset': -this.standardOffset_,  // note createTimeZone flips the sign
    'names': goog.array.clone(this.tzNames_),  // avoid aliasing the array
    'transitions': goog.array.clone(this.transitions_)  // avoid aliasing
  };
};


/**
 * Return the DST adjustment to the time zone offset for a given time.
 * While Daylight Saving Time is in effect, this number is positive.
 * Otherwise, it is zero.
 * @param {goog.date.DateLike} date The time to check.
 * @return {number} The DST adjustment in minutes EAST of UTC.
 */
goog.i18n.TimeZone.prototype.getDaylightAdjustment = function(date) {
  var timeInMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
                          date.getUTCDate(), date.getUTCHours(),
                          date.getUTCMinutes());
  var timeInHours = timeInMs / goog.i18n.TimeZone.MILLISECONDS_PER_HOUR_;
  var index = 0;
  while (index < this.transitions_.length &&
         timeInHours >= this.transitions_[index]) {
    index += 2;
  }
  return (index == 0) ? 0 : this.transitions_[index - 1];
};


/**
 * Return the GMT representation of this time zone object.
 * @param {goog.date.DateLike} date The date for which time to retrieve
 *     GMT string.
 * @return {string} GMT representation string.
 */
goog.i18n.TimeZone.prototype.getGMTString = function(date) {
  return goog.i18n.TimeZone.composeGMTString_(this.getOffset(date));
};


/**
 * Get the long time zone name for a given date/time.
 * @param {goog.date.DateLike} date The time for which to retrieve
 *     the long time zone name.
 * @return {string} The long time zone name.
 */
goog.i18n.TimeZone.prototype.getLongName = function(date) {
  return this.tzNames_[this.isDaylightTime(date) ?
      goog.i18n.TimeZone.NameType.DLT_LONG_NAME :
      goog.i18n.TimeZone.NameType.STD_LONG_NAME];
};


/**
 * Get the time zone offset in minutes WEST of UTC for a given date/time.
 * @param {goog.date.DateLike} date The time for which to retrieve
 *     the time zone offset.
 * @return {number} The time zone offset in minutes WEST of UTC.
 */
goog.i18n.TimeZone.prototype.getOffset = function(date) {
  return this.standardOffset_ - this.getDaylightAdjustment(date);
};


/**
 * Get the RFC representation of the time zone for a given date/time.
 * @param {goog.date.DateLike} date The time for which to retrieve the
 *     RFC time zone string.
 * @return {string} The RFC time zone string.
 */
goog.i18n.TimeZone.prototype.getRFCTimeZoneString = function(date) {
  var offset = -this.getOffset(date);
  var parts = [offset < 0 ? '-' : '+'];
  offset = Math.abs(offset);
  parts.push(goog.string.padNumber(Math.floor(offset / 60) % 100, 2),
             goog.string.padNumber(offset % 60, 2));
  return parts.join('');
};


/**
 * Get the short time zone name for given date/time.
 * @param {goog.date.DateLike} date The time for which to retrieve
 *     the short time zone name.
 * @return {string} The short time zone name.
 */
goog.i18n.TimeZone.prototype.getShortName = function(date) {
  return this.tzNames_[this.isDaylightTime(date) ?
      goog.i18n.TimeZone.NameType.DLT_SHORT_NAME :
      goog.i18n.TimeZone.NameType.STD_SHORT_NAME];
};


/**
 * Return the time zone ID for this time zone.
 * @return {string} The time zone ID.
 */
goog.i18n.TimeZone.prototype.getTimeZoneId = function() {
  return this.timeZoneId_;
};


/**
 * Check if Daylight Saving Time is in effect at a given time in this time zone.
 * @param {goog.date.DateLike} date The time to check.
 * @return {boolean} True if Daylight Saving Time is in effect.
 */
goog.i18n.TimeZone.prototype.isDaylightTime = function(date) {
  return this.getDaylightAdjustment(date) > 0;
};


// Input 20
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Functions for dealing with date/time formatting.
 */


/**
 * Namespace for i18n date/time formatting functions
 */
goog.provide('goog.i18n.DateTimeFormat');
goog.provide('goog.i18n.DateTimeFormat.Format');

goog.require('goog.asserts');
goog.require('goog.date.DateLike');
goog.require('goog.i18n.DateTimeSymbols');
goog.require('goog.i18n.TimeZone');
goog.require('goog.string');


/**
 * Datetime formatting functions following the pattern specification as defined
 * in JDK, ICU and CLDR, with minor modification for typical usage in JS.
 * Pattern specification: (Refer to JDK/ICU/CLDR)
 * <pre>
 * Symbol Meaning Presentation        Example
 * ------   -------                 ------------        -------
 * G        era designator          (Text)              AD
 * y#       year                    (Number)            1996
 * Y*       year (week of year)     (Number)            1997
 * u*       extended year           (Number)            4601
 * M        month in year           (Text & Number)     July & 07
 * d        day in month            (Number)            10
 * h        hour in am/pm (1~12)    (Number)            12
 * H        hour in day (0~23)      (Number)            0
 * m        minute in hour          (Number)            30
 * s        second in minute        (Number)            55
 * S        fractional second       (Number)            978
 * E        day of week             (Text)              Tuesday
 * e*       day of week (local 1~7) (Number)            2
 * D*       day in year             (Number)            189
 * F*       day of week in month    (Number)            2 (2nd Wed in July)
 * w*       week in year            (Number)            27
 * W*       week in month           (Number)            2
 * a        am/pm marker            (Text)              PM
 * k        hour in day (1~24)      (Number)            24
 * K        hour in am/pm (0~11)    (Number)            0
 * z        time zone               (Text)              Pacific Standard Time
 * Z        time zone (RFC 822)     (Number)            -0800
 * v        time zone (generic)     (Text)              Pacific Time
 * g*       Julian day              (Number)            2451334
 * A*       milliseconds in day     (Number)            69540000
 * '        escape for text         (Delimiter)         'Date='
 * ''       single quote            (Literal)           'o''clock'
 *
 * Item marked with '*' are not supported yet.
 * Item marked with '#' works different than java
 *
 * The count of pattern letters determine the format.
 * (Text): 4 or more, use full form, <4, use short or abbreviated form if it
 * exists. (e.g., "EEEE" produces "Monday", "EEE" produces "Mon")
 *
 * (Number): the minimum number of digits. Shorter numbers are zero-padded to
 * this amount (e.g. if "m" produces "6", "mm" produces "06"). Year is handled
 * specially; that is, if the count of 'y' is 2, the Year will be truncated to
 * 2 digits. (e.g., if "yyyy" produces "1997", "yy" produces "97".) Unlike other
 * fields, fractional seconds are padded on the right with zero.
 *
 * (Text & Number): 3 or over, use text, otherwise use number. (e.g., "M"
 * produces "1", "MM" produces "01", "MMM" produces "Jan", and "MMMM" produces
 * "January".)
 *
 * Any characters in the pattern that are not in the ranges of ['a'..'z'] and
 * ['A'..'Z'] will be treated as quoted text. For instance, characters like ':',
 * '.', ' ', '#' and '@' will appear in the resulting time text even they are
 * not embraced within single quotes.
 * </pre>
 */



/**
 * Construct a DateTimeFormat object based on current locale.
 * @constructor
 * @param {string|number} pattern pattern specification or pattern type.
 */
goog.i18n.DateTimeFormat = function(pattern) {
  goog.asserts.assert(goog.isDef(pattern), 'Pattern must be defined');
  this.patternParts_ = [];
  if (typeof pattern == 'number') {
    this.applyStandardPattern_(pattern);
  } else {
    this.applyPattern_(pattern);
  }
};


/**
 * Enum to identify predefined Date/Time format pattern.
 * @enum {number}
 */
goog.i18n.DateTimeFormat.Format = {
  FULL_DATE: 0,
  LONG_DATE: 1,
  MEDIUM_DATE: 2,
  SHORT_DATE: 3,
  FULL_TIME: 4,
  LONG_TIME: 5,
  MEDIUM_TIME: 6,
  SHORT_TIME: 7,
  FULL_DATETIME: 8,
  LONG_DATETIME: 9,
  MEDIUM_DATETIME: 10,
  SHORT_DATETIME: 11
};


/**
 * regular expression pattern for parsing pattern string
 * @type {Array.<RegExp>}
 * @private
 */
goog.i18n.DateTimeFormat.TOKENS_ = [
  //quote string
  /^\'(?:[^\']|\'\')*\'/,
  // pattern chars
  /^(?:G+|y+|M+|k+|S+|E+|a+|h+|K+|H+|c+|L+|Q+|d+|m+|s+|v+|z+|Z+)/,
  // and all the other chars
  /^[^\'GyMkSEahKHcLQdmsvzZ]+/  // and all the other chars
];


/**
 * These are token types, corresponding to above token definitions.
 * @enum {number}
 * @private
 */
goog.i18n.DateTimeFormat.PartTypes_ = {
  QUOTED_STRING: 0,
  FIELD: 1,
  LITERAL: 2
};


/**
 * Apply specified pattern to this formatter object.
 * @param {string} pattern String specifying how the date should be formatted.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.applyPattern_ = function(pattern) {
  // lex the pattern, once for all uses
  while (pattern) {
    for (var i = 0; i < goog.i18n.DateTimeFormat.TOKENS_.length; ++i) {
      var m = pattern.match(goog.i18n.DateTimeFormat.TOKENS_[i]);
      if (m) {
        var part = m[0];
        pattern = pattern.substring(part.length);
        if (i == goog.i18n.DateTimeFormat.PartTypes_.QUOTED_STRING) {
          if (part == "''") {
            part = "'";  // '' -> '
          } else {
            part = part.substring(1, part.length - 1); // strip quotes
            part = part.replace(/\'\'/, "'");
          }
        }
        this.patternParts_.push({ text: part, type: i });
        break;
      }
    }
  }
};


/**
 * Format the given date object according to preset pattern and current lcoale.
 * @param {goog.date.DateLike} date The Date object that is being formatted.
 * @param {goog.i18n.TimeZone=} opt_timeZone optional, if specified, time
 *    related fields will be formatted based on its setting. When this field
 *    is not specified, "undefined" will be pass around and those function
 *    that really need time zone service will create a default one.
 * @return {string} Formatted string for the given date.
 */
goog.i18n.DateTimeFormat.prototype.format = function(date, opt_timeZone) {
  // We don't want to write code to calculate each date field because we
  // want to maximize performance and minimize code size.
  // JavaScript only provide API to render local time.
  // Suppose target date is: 16:00 GMT-0400
  // OS local time is:       12:00 GMT-0800
  // We want to create a Local Date Object : 16:00 GMT-0800, and fix the
  // time zone display ourselves.
  // Thing get a little bit tricky when daylight time transition happens. For
  // example, suppose OS timeZone is America/Los_Angeles, it is impossible to
  // represent "2006/4/2 02:30" even for those timeZone that has no transition
  // at this time. Because 2:00 to 3:00 on that day does not exising in
  // America/Los_Angeles time zone. To avoid calculating date field through
  // our own code, we uses 3 Date object instead, one for "Year, month, day",
  // one for time within that day, and one for timeZone object since it need
  // the real time to figure out actual time zone offset.
  var diff = opt_timeZone ?
      (date.getTimezoneOffset() - opt_timeZone.getOffset(date)) * 60000 : 0;
  var dateForDate = diff ? new Date(date.getTime() + diff) : date;
  var dateForTime = dateForDate;
  // in daylight time switch on/off hour, diff adjustment could alter time
  // because of timeZone offset change, move 1 day forward or backward.
  if (opt_timeZone &&
      dateForDate.getTimezoneOffset() != date.getTimezoneOffset()) {
    diff += diff > 0 ? -24 * 60 * 60000 : 24 * 60 * 60000;
    dateForTime = new Date(date.getTime() + diff);
  }

  var out = [];
  for (var i = 0; i < this.patternParts_.length; ++i) {
    var text = this.patternParts_[i].text;
    if (goog.i18n.DateTimeFormat.PartTypes_.FIELD ==
        this.patternParts_[i].type) {
      out.push(this.formatField_(text, date, dateForDate, dateForTime,
                                 opt_timeZone));
    } else {
      out.push(text);
    }
  }
  return out.join('');
};


/**
 * Apply a predefined pattern as identified by formatType, which is stored in
 * locale specific repository.
 * @param {number} formatType A number that identified the predefined pattern.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.applyStandardPattern_ =
    function(formatType) {
  var pattern;
  if (formatType < 4) {
    pattern = goog.i18n.DateTimeSymbols.DATEFORMATS[formatType];
  } else if (formatType < 8) {
    pattern = goog.i18n.DateTimeSymbols.TIMEFORMATS[formatType - 4];
  } else if (formatType < 12) {
    pattern = goog.i18n.DateTimeSymbols.DATEFORMATS[formatType - 8] +
              ' ' + goog.i18n.DateTimeSymbols.TIMEFORMATS[formatType - 8];
  } else {
    this.applyStandardPattern_(goog.i18n.DateTimeFormat.Format.MEDIUM_DATETIME);
    return;
  }
  this.applyPattern_(pattern);
};


/**
 * Localizes a string potentially containing numbers, replacing ASCII digits
 * with native digits if specified so by the locale. Leaves other characters.
 *
 * @param {string} input the string to be localized, using ASCII digits.
 * @return {string} localized string, potentially using native digits.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.localizeNumbers_ = function(input) {
  if (goog.i18n.DateTimeSymbols.ZERODIGIT === undefined) {
    return input;
  }

  var parts = [];
  for (var i = 0; i < input.length; i++) {
    var c = input.charCodeAt(i);
    parts.push((0x30 <= c && c <= 0x39) ? // '0' <= c <= '9'
        String.fromCharCode(goog.i18n.DateTimeSymbols.ZERODIGIT + c - 0x30) :
        input.charAt(i));
  }
  return parts.join('');
};


/**
 * Formats Era field according to pattern specified.
 *
 * @param {number} count Number of time pattern char repeats, it controls
 *     how a field should be formatted.
 * @param {goog.date.DateLike} date It holds the date object to be formatted.
 * @return {string} Formatted string that represent this field.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.formatEra_ = function(count, date) {
  var value = date.getFullYear() > 0 ? 1 : 0;
  return count >= 4 ? goog.i18n.DateTimeSymbols.ERANAMES[value] :
                      goog.i18n.DateTimeSymbols.ERAS[value];
};


/**
 * Formats Year field according to pattern specified
 *   Javascript Date object seems incapable handling 1BC and
 *   year before. It can show you year 0 which does not exists.
 *   following we just keep consistent with javascript's
 *   toString method. But keep in mind those things should be
 *   unsupported.
 * @param {number} count Number of time pattern char repeats, it controls
 *     how a field should be formatted.
 * @param {goog.date.DateLike} date It holds the date object to be formatted.
 * @return {string} Formatted string that represent this field.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.formatYear_ = function(count, date) {
  var value = date.getFullYear();
  if (value < 0) {
    value = -value;
  }
  return this.localizeNumbers_(count == 2 ?
      goog.string.padNumber(value % 100, 2) :
      String(value));
};


/**
 * Formats Month field according to pattern specified
 *
 * @param {number} count Number of time pattern char repeats, it controls
 *     how a field should be formatted.
 * @param {goog.date.DateLike} date It holds the date object to be formatted.
 * @return {string} Formatted string that represent this field.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.formatMonth_ = function(count, date) {
  var value = date.getMonth();
  switch (count) {
    case 5: return goog.i18n.DateTimeSymbols.NARROWMONTHS[value];
    case 4: return goog.i18n.DateTimeSymbols.MONTHS[value];
    case 3: return goog.i18n.DateTimeSymbols.SHORTMONTHS[value];
    default:
      return this.localizeNumbers_(goog.string.padNumber(value + 1, count));
  }
};


/**
 * Formats (1..24) Hours field according to pattern specified
 *
 * @param {number} count Number of time pattern char repeats. This controls
 *     how a field should be formatted.
 * @param {goog.date.DateLike} date It holds the date object to be formatted.
 * @return {string} Formatted string that represent this field.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.format24Hours_ =
    function(count, date) {
  return this.localizeNumbers_(
      goog.string.padNumber(date.getHours() || 24, count));
};


/**
 * Formats Fractional seconds field according to pattern
 * specified
 *
 * @param {number} count Number of time pattern char repeats, it controls
 *     how a field should be formatted.
 * @param {goog.date.DateLike} date It holds the date object to be formatted.
 *
 * @return {string} Formatted string that represent this field.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.formatFractionalSeconds_ =
    function(count, date) {
  // Fractional seconds left-justify, append 0 for precision beyond 3
  var value = date.getTime() % 1000 / 1000;
  return this.localizeNumbers_(
      value.toFixed(Math.min(3, count)).substr(2) +
      (count > 3 ? goog.string.padNumber(0, count - 3) : ''));
};


/**
 * Formats Day of week field according to pattern specified
 *
 * @param {number} count Number of time pattern char repeats, it controls
 *     how a field should be formatted.
 * @param {goog.date.DateLike} date It holds the date object to be formatted.
 * @return {string} Formatted string that represent this field.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.formatDayOfWeek_ =
    function(count, date) {
  var value = date.getDay();
  return count >= 4 ? goog.i18n.DateTimeSymbols.WEEKDAYS[value] :
                      goog.i18n.DateTimeSymbols.SHORTWEEKDAYS[value];
};


/**
 * Formats Am/Pm field according to pattern specified
 *
 * @param {number} count Number of time pattern char repeats, it controls
 *     how a field should be formatted.
 * @param {goog.date.DateLike} date It holds the date object to be formatted.
 * @return {string} Formatted string that represent this field.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.formatAmPm_ = function(count, date) {
  var hours = date.getHours();
  return goog.i18n.DateTimeSymbols.AMPMS[hours >= 12 && hours < 24 ? 1 : 0];
};


/**
 * Formats (1..12) Hours field according to pattern specified
 *
 * @param {number} count Number of time pattern char repeats, it controls
 *     how a field should be formatted.
 * @param {goog.date.DateLike} date It holds the date object to be formatted.
 * @return {string} formatted string that represent this field.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.format1To12Hours_ =
    function(count, date) {
  return this.localizeNumbers_(
      goog.string.padNumber(date.getHours() % 12 || 12, count));
};


/**
 * Formats (0..11) Hours field according to pattern specified
 *
 * @param {number} count Number of time pattern char repeats, it controls
 *     how a field should be formatted.
 * @param {goog.date.DateLike} date It holds the date object to be formatted.
 * @return {string} formatted string that represent this field.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.format0To11Hours_ =
    function(count, date) {
  return this.localizeNumbers_(
      goog.string.padNumber(date.getHours() % 12, count));
};


/**
 * Formats (0..23) Hours field according to pattern specified
 *
 * @param {number} count Number of time pattern char repeats, it controls
 *     how a field should be formatted.
 * @param {goog.date.DateLike} date It holds the date object to be formatted.
 * @return {string} formatted string that represent this field.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.format0To23Hours_ =
    function(count, date) {
  return this.localizeNumbers_(goog.string.padNumber(date.getHours(), count));
};


/**
 * Formats Standalone weekday field according to pattern specified
 *
 * @param {number} count Number of time pattern char repeats, it controls
 *     how a field should be formatted.
 * @param {goog.date.DateLike} date It holds the date object to be formatted.
 * @return {string} formatted string that represent this field.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.formatStandaloneDay_ =
    function(count, date) {
  var value = date.getDay();
  switch (count) {
    case 5:
      return goog.i18n.DateTimeSymbols.STANDALONENARROWWEEKDAYS[value];
    case 4:
      return goog.i18n.DateTimeSymbols.STANDALONEWEEKDAYS[value];
    case 3:
      return goog.i18n.DateTimeSymbols.STANDALONESHORTWEEKDAYS[value];
    default:
      return this.localizeNumbers_(goog.string.padNumber(value, 1));
  }
};


/**
 * Formats Standalone Month field according to pattern specified
 *
 * @param {number} count Number of time pattern char repeats, it controls
 *     how a field should be formatted.
 * @param {goog.date.DateLike} date It holds the date object to be formatted.
 * @return {string} formatted string that represent this field.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.formatStandaloneMonth_ =
    function(count, date) {
  var value = date.getMonth();
  switch (count) {
    case 5:
      return goog.i18n.DateTimeSymbols.STANDALONENARROWMONTHS[value];
    case 4:
      return goog.i18n.DateTimeSymbols.STANDALONEMONTHS[value];
    case 3:
      return goog.i18n.DateTimeSymbols.STANDALONESHORTMONTHS[value];
    default:
      return this.localizeNumbers_(goog.string.padNumber(value + 1, count));
  }
};


/**
 * Formats Quarter field according to pattern specified
 *
 * @param {number} count Number of time pattern char repeats, it controls
 *     how a field should be formatted.
 * @param {goog.date.DateLike} date It holds the date object to be formatted.
 * @return {string} Formatted string that represent this field.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.formatQuarter_ =
    function(count, date) {
  var value = Math.floor(date.getMonth() / 3);
  return count < 4 ? goog.i18n.DateTimeSymbols.SHORTQUARTERS[value] :
                     goog.i18n.DateTimeSymbols.QUARTERS[value];
};


/**
 * Formats Date field according to pattern specified
 *
 * @param {number} count Number of time pattern char repeats, it controls
 *     how a field should be formatted.
 * @param {goog.date.DateLike} date It holds the date object to be formatted.
 * @return {string} Formatted string that represent this field.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.formatDate_ = function(count, date) {
  return this.localizeNumbers_(goog.string.padNumber(date.getDate(), count));
};


/**
 * Formats Minutes field according to pattern specified
 *
 * @param {number} count Number of time pattern char repeats, it controls
 *     how a field should be formatted.
 * @param {goog.date.DateLike} date It holds the date object to be formatted.
 * @return {string} Formatted string that represent this field.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.formatMinutes_ =
    function(count, date) {
  return this.localizeNumbers_(goog.string.padNumber(date.getMinutes(), count));
};


/**
 * Formats Seconds field according to pattern specified
 *
 * @param {number} count Number of time pattern char repeats, it controls
 *     how a field should be formatted.
 * @param {goog.date.DateLike} date It holds the date object to be formatted.
 * @return {string} Formatted string that represent this field.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.formatSeconds_ =
    function(count, date) {
  return this.localizeNumbers_(goog.string.padNumber(date.getSeconds(), count));
};


/**
 * Formats TimeZone field following RFC
 *
 * @param {number} count Number of time pattern char repeats, it controls
 *     how a field should be formatted.
 * @param {goog.date.DateLike} date It holds the date object to be formatted.
 * @param {goog.i18n.TimeZone=} opt_timeZone This holds current time zone info.
 * @return {string} Formatted string that represent this field.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.formatTimeZoneRFC_ =
    function(count, date, opt_timeZone) {
  opt_timeZone = opt_timeZone ||
      goog.i18n.TimeZone.createTimeZone(date.getTimezoneOffset());

  // RFC 822 formats should be kept in ASCII, but localized GMT formats may need
  // to use native digits.
  return count < 4 ? opt_timeZone.getRFCTimeZoneString(date) :
                     this.localizeNumbers_(opt_timeZone.getGMTString(date));
};


/**
 * Generate GMT timeZone string for given date
 * @param {number} count Number of time pattern char repeats, it controls
 *     how a field should be formatted.
 * @param {goog.date.DateLike} date Whose value being evaluated.
 * @param {goog.i18n.TimeZone=} opt_timeZone This holds current time zone info.
 * @return {string} GMT timeZone string.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.formatTimeZone_ =
    function(count, date, opt_timeZone) {
  opt_timeZone = opt_timeZone ||
      goog.i18n.TimeZone.createTimeZone(date.getTimezoneOffset());
  return count < 4 ? opt_timeZone.getShortName(date) :
             opt_timeZone.getLongName(date);
};


/**
 * Generate GMT timeZone string for given date
 * @param {goog.date.DateLike} date Whose value being evaluated.
 * @param {goog.i18n.TimeZone=} opt_timeZone This holds current time zone info.
 * @return {string} GMT timeZone string.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.formatTimeZoneId_ =
    function(date, opt_timeZone) {
  opt_timeZone = opt_timeZone ||
      goog.i18n.TimeZone.createTimeZone(date.getTimezoneOffset());
  return opt_timeZone.getTimeZoneId();
};


/**
 * Formatting one date field.
 * @param {string} patternStr The pattern string for the field being formatted.
 * @param {goog.date.DateLike} date represents the real date to be formatted.
 * @param {goog.date.DateLike} dateForDate used to resolve date fields
 *     for formatting.
 * @param {goog.date.DateLike} dateForTime used to resolve time fields
 *     for formatting.
 * @param {goog.i18n.TimeZone=} opt_timeZone This holds current time zone info.
 * @return {string} string representation for the given field.
 * @private
 */
goog.i18n.DateTimeFormat.prototype.formatField_ =
    function(patternStr, date, dateForDate, dateForTime, opt_timeZone) {
  var count = patternStr.length;
  switch (patternStr.charAt(0)) {
    case 'G': return this.formatEra_(count, dateForDate);
    case 'y': return this.formatYear_(count, dateForDate);
    case 'M': return this.formatMonth_(count, dateForDate);
    case 'k': return this.format24Hours_(count, dateForTime);
    case 'S': return this.formatFractionalSeconds_(count, dateForTime);
    case 'E': return this.formatDayOfWeek_(count, dateForDate);
    case 'a': return this.formatAmPm_(count, dateForTime);
    case 'h': return this.format1To12Hours_(count, dateForTime);
    case 'K': return this.format0To11Hours_(count, dateForTime);
    case 'H': return this.format0To23Hours_(count, dateForTime);
    case 'c': return this.formatStandaloneDay_(count, dateForDate);
    case 'L': return this.formatStandaloneMonth_(count, dateForDate);
    case 'Q': return this.formatQuarter_(count, dateForDate);
    case 'd': return this.formatDate_(count, dateForDate);
    case 'm': return this.formatMinutes_(count, dateForTime);
    case 's': return this.formatSeconds_(count, dateForTime);
    case 'v': return this.formatTimeZoneId_(date, opt_timeZone);
    case 'z': return this.formatTimeZone_(count, date, opt_timeZone);
    case 'Z': return this.formatTimeZoneRFC_(count, date, opt_timeZone);
    default: return '';
  }
};


// Input 21
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview JSON utility functions.
 * @author arv@google.com (Erik Arvidsson)
 */


goog.provide('goog.json');
goog.provide('goog.json.Serializer');


/**
 * Tests if a string is an invalid JSON string. This only ensures that we are
 * not using any invalid characters
 * @param {string} s The string to test.
 * @return {boolean} True if the input is a valid JSON string.
 * @private
 */
goog.json.isValid_ = function(s) {
  // All empty whitespace is not valid.
  if (/^\s*$/.test(s)) {
    return false;
  }

  // This is taken from http://www.json.org/json2.js which is released to the
  // public domain.
  // Changes: We dissallow \u2028 Line separator and \u2029 Paragraph separator
  // inside strings.  We also treat \u2028 and \u2029 as whitespace which they
  // are in the RFC but IE and Safari does not match \s to these so we need to
  // include them in the reg exps in all places where whitespace is allowed.
  // We allowed \x7f inside strings because some tools don't escape it,
  // e.g. http://www.json.org/java/org/json/JSONObject.java

  // Parsing happens in three stages. In the first stage, we run the text
  // against regular expressions that look for non-JSON patterns. We are
  // especially concerned with '()' and 'new' because they can cause invocation,
  // and '=' because it can cause mutation. But just to be safe, we want to
  // reject all unexpected forms.

  // We split the first stage into 4 regexp operations in order to work around
  // crippling inefficiencies in IE's and Safari's regexp engines. First we
  // replace all backslash pairs with '@' (a non-JSON character). Second, we
  // replace all simple value tokens with ']' characters. Third, we delete all
  // open brackets that follow a colon or comma or that begin the text. Finally,
  // we look to see that the remaining characters are only whitespace or ']' or
  // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

  // Don't make these static since they have the global flag.
  var backslashesRe = /\\["\\\/bfnrtu]/g;
  var simpleValuesRe =
      /"[^"\\\n\r\u2028\u2029\x00-\x08\x0a-\x1f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
  var openBracketsRe = /(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g;
  var remainderRe = /^[\],:{}\s\u2028\u2029]*$/;

  return remainderRe.test(s.replace(backslashesRe, '@').
      replace(simpleValuesRe, ']').
      replace(openBracketsRe, ''));
};


/**
 * Parses a JSON string and returns the result. This throws an exception if
 * the string is an invalid JSON string.
 *
 * Note that this is very slow on large strings. If you trust the source of
 * the string then you should use unsafeParse instead.
 *
 * @param {*} s The JSON string to parse.
 * @return {Object} The object generated from the JSON string.
 */
goog.json.parse = function(s) {
  var o = String(s);
  if (goog.json.isValid_(o)) {
    /** @preserveTry */
    try {
      return /** @type {Object} */ (eval('(' + o + ')'));
    } catch (ex) {
    }
  }
  throw Error('Invalid JSON string: ' + o);
};


/**
 * Parses a JSON string and returns the result. This uses eval so it is open
 * to security issues and it should only be used if you trust the source.
 *
 * @param {string} s The JSON string to parse.
 * @return {Object} The object generated from the JSON string.
 */
goog.json.unsafeParse = function(s) {
  return /** @type {Object} */ (eval('(' + s + ')'));
};


/**
 * JSON replacer, as defined in Section 15.12.3 of the ES5 spec.
 *
 * TODO(nicksantos): Array should also be a valid replacer.
 *
 * @typedef {function(this:Object, string, *): *}
 */
goog.json.Replacer;


/**
 * JSON reviver, as defined in Section 15.12.2 of the ES5 spec.
 *
 * @typedef {function(this:Object, string, *): *}
 */
goog.json.Reviver;


/**
 * Serializes an object or a value to a JSON string.
 *
 * @param {*} object The object to serialize.
 * @param {?goog.json.Replacer=} opt_replacer A replacer function
 *     called for each (key, value) pair that determines how the value
 *     should be serialized. By defult, this just returns the value
 *     and allows default serialization to kick in.
 * @throws Error if there are loops in the object graph.
 * @return {string} A JSON string representation of the input.
 */
goog.json.serialize = function(object, opt_replacer) {
  // NOTE(nicksantos): Currently, we never use JSON.stringify.
  //
  // The last time I evaluated this, JSON.stringify had subtle bugs and behavior
  // differences on all browsers, and the performance win was not large enough
  // to justify all the issues. This may change in the future as browser
  // implementations get better.
  //
  // assertSerialize in json_test contains if branches for the cases
  // that fail.
  return new goog.json.Serializer(opt_replacer).serialize(object);
};



/**
 * Class that is used to serialize JSON objects to a string.
 * @param {?goog.json.Replacer=} opt_replacer Replacer.
 * @constructor
 */
goog.json.Serializer = function(opt_replacer) {
  /**
   * @type {goog.json.Replacer|null|undefined}
   * @private
   */
  this.replacer_ = opt_replacer;
};


/**
 * Serializes an object or a value to a JSON string.
 *
 * @param {*} object The object to serialize.
 * @throws Error if there are loops in the object graph.
 * @return {string} A JSON string representation of the input.
 */
goog.json.Serializer.prototype.serialize = function(object) {
  var sb = [];
  this.serialize_(object, sb);
  return sb.join('');
};


/**
 * Serializes a generic value to a JSON string
 * @private
 * @param {*} object The object to serialize.
 * @param {Array} sb Array used as a string builder.
 * @throws Error if there are loops in the object graph.
 */
goog.json.Serializer.prototype.serialize_ = function(object, sb) {
  switch (typeof object) {
    case 'string':
      this.serializeString_(/** @type {string} */ (object), sb);
      break;
    case 'number':
      this.serializeNumber_(/** @type {number} */ (object), sb);
      break;
    case 'boolean':
      sb.push(object);
      break;
    case 'undefined':
      sb.push('null');
      break;
    case 'object':
      if (object == null) {
        sb.push('null');
        break;
      }
      if (goog.isArray(object)) {
        this.serializeArray(/** @type {!Array} */ (object), sb);
        break;
      }
      // should we allow new String, new Number and new Boolean to be treated
      // as string, number and boolean? Most implementations do not and the
      // need is not very big
      this.serializeObject_(/** @type {Object} */ (object), sb);
      break;
    case 'function':
      // Skip functions.
      // TODO(user) Should we return something here?
      break;
    default:
      throw Error('Unknown type: ' + typeof object);
  }
};


/**
 * Character mappings used internally for goog.string.quote
 * @private
 * @type {Object}
 */
goog.json.Serializer.charToJsonCharCache_ = {
  '\"': '\\"',
  '\\': '\\\\',
  '/': '\\/',
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',

  '\x0B': '\\u000b' // '\v' is not supported in JScript
};


/**
 * Regular expression used to match characters that need to be replaced.
 * The S60 browser has a bug where unicode characters are not matched by
 * regular expressions. The condition below detects such behaviour and
 * adjusts the regular expression accordingly.
 * @private
 * @type {RegExp}
 */
goog.json.Serializer.charsToReplace_ = /\uffff/.test('\uffff') ?
    /[\\\"\x00-\x1f\x7f-\uffff]/g : /[\\\"\x00-\x1f\x7f-\xff]/g;


/**
 * Serializes a string to a JSON string
 * @private
 * @param {string} s The string to serialize.
 * @param {Array} sb Array used as a string builder.
 */
goog.json.Serializer.prototype.serializeString_ = function(s, sb) {
  // The official JSON implementation does not work with international
  // characters.
  sb.push('"', s.replace(goog.json.Serializer.charsToReplace_, function(c) {
    // caching the result improves performance by a factor 2-3
    if (c in goog.json.Serializer.charToJsonCharCache_) {
      return goog.json.Serializer.charToJsonCharCache_[c];
    }

    var cc = c.charCodeAt(0);
    var rv = '\\u';
    if (cc < 16) {
      rv += '000';
    } else if (cc < 256) {
      rv += '00';
    } else if (cc < 4096) { // \u1000
      rv += '0';
    }
    return goog.json.Serializer.charToJsonCharCache_[c] = rv + cc.toString(16);
  }), '"');
};


/**
 * Serializes a number to a JSON string
 * @private
 * @param {number} n The number to serialize.
 * @param {Array} sb Array used as a string builder.
 */
goog.json.Serializer.prototype.serializeNumber_ = function(n, sb) {
  sb.push(isFinite(n) && !isNaN(n) ? n : 'null');
};


/**
 * Serializes an array to a JSON string
 * @param {Array} arr The array to serialize.
 * @param {Array} sb Array used as a string builder.
 * @protected
 */
goog.json.Serializer.prototype.serializeArray = function(arr, sb) {
  var l = arr.length;
  sb.push('[');
  var sep = '';
  for (var i = 0; i < l; i++) {
    sb.push(sep);

    var value = arr[i];
    this.serialize_(
        this.replacer_ ? this.replacer_.call(arr, String(i), value) : value,
        sb);

    sep = ',';
  }
  sb.push(']');
};


/**
 * Serializes an object to a JSON string
 * @private
 * @param {Object} obj The object to serialize.
 * @param {Array} sb Array used as a string builder.
 */
goog.json.Serializer.prototype.serializeObject_ = function(obj, sb) {
  sb.push('{');
  var sep = '';
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var value = obj[key];
      // Skip functions.
      // TODO(ptucker) Should we return something for function properties?
      if (typeof value != 'function') {
        sb.push(sep);
        this.serializeString_(key, sb);
        sb.push(':');

        this.serialize_(
            this.replacer_ ? this.replacer_.call(obj, key, value) : value,
            sb);

        sep = ',';
      }
    }
  }
  sb.push('}');
};

// Input 22
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utility for fast string concatenation.
 */

goog.provide('goog.string.StringBuffer');



/**
 * Utility class to facilitate string concatenation.
 *
 * @param {*=} opt_a1 Optional first initial item to append.
 * @param {...*} var_args Other initial items to
 *     append, e.g., new goog.string.StringBuffer('foo', 'bar').
 * @constructor
 */
goog.string.StringBuffer = function(opt_a1, var_args) {
  if (opt_a1 != null) {
    this.append.apply(this, arguments);
  }
};


/**
 * Internal buffer for the string to be concatenated.
 * @type {string}
 * @private
 */
goog.string.StringBuffer.prototype.buffer_ = '';


/**
 * Sets the contents of the string buffer object, replacing what's currently
 * there.
 *
 * @param {*} s String to set.
 */
goog.string.StringBuffer.prototype.set = function(s) {
  this.buffer_ = '' + s;
};


/**
 * Appends one or more items to the buffer.
 *
 * Calling this with null, undefined, or empty arguments is an error.
 *
 * @param {*} a1 Required first string.
 * @param {*=} opt_a2 Optional second string.
 * @param {...*} var_args Other items to append,
 *     e.g., sb.append('foo', 'bar', 'baz').
 * @return {goog.string.StringBuffer} This same StringBuffer object.
 * @suppress {duplicate}
 */
goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
  // Use a1 directly to avoid arguments instantiation for single-arg case.
  this.buffer_ += a1;
  if (opt_a2 != null) { // second argument is undefined (null == undefined)
    for (var i = 1; i < arguments.length; i++) {
      this.buffer_ += arguments[i];
    }
  }
  return this;
};


/**
 * Clears the internal buffer.
 */
goog.string.StringBuffer.prototype.clear = function() {
  this.buffer_ = '';
};


/**
 * @return {number} the length of the current contents of the buffer.
 */
goog.string.StringBuffer.prototype.getLength = function() {
  return this.buffer_.length;
};


/**
 * @return {string} The concatenated string.
 * @override
 */
goog.string.StringBuffer.prototype.toString = function() {
  return this.buffer_;
};

// Input 23
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Implementation of sprintf-like, python-%-operator-like,
 * .NET-String.Format-like functionality. Uses JS string's replace method to
 * extract format specifiers and sends those specifiers to a handler function,
 * which then, based on conversion type part of the specifier, calls the
 * appropriate function to handle the specific conversion.
 * For specific functionality implemented, look at formatRe below, or look
 * at the tests.
 */

goog.provide('goog.string.format');

goog.require('goog.string');


/**
 * Performs sprintf-like conversion, ie. puts the values in a template.
 * DO NOT use it instead of built-in conversions in simple cases such as
 * 'Cost: %.2f' as it would introduce unneccessary latency oposed to
 * 'Cost: ' + cost.toFixed(2).
 * @param {string} formatString Template string containing % specifiers.
 * @param {...string|number} var_args Values formatString is to be filled with.
 * @return {string} Formatted string.
 */
goog.string.format = function(formatString, var_args) {

  // Convert the arguments to an array (MDC recommended way).
  var args = Array.prototype.slice.call(arguments);

  // Try to get the template.
  var template = args.shift();
  if (typeof template == 'undefined') {
    throw Error('[goog.string.format] Template required');
  }

  // This re is used for matching, it also defines what is supported.
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;

  /**
   * Chooses which conversion function to call based on type conversion
   * specifier.
   * @param {string} match Contains the re matched string.
   * @param {string} flags Formatting flags.
   * @param {string} width Replacement string minimum width.
   * @param {string} dotp Matched precision including a dot.
   * @param {string} precision Specifies floating point precision.
   * @param {string} type Type conversion specifier.
   * @param {string} offset Matching location in the original string.
   * @param {string} wholeString Has the actualString being searched.
   * @return {string} Formatted parameter.
   */
  function replacerDemuxer(match,
                           flags,
                           width,
                           dotp,
                           precision,
                           type,
                           offset,
                           wholeString) {

    // The % is too simple and doesn't take an argument.
    if (type == '%') {
      return '%';
    }

    // Try to get the actual value from parent function.
    var value = args.shift();

    // If we didn't get any arguments, fail.
    if (typeof value == 'undefined') {
      throw Error('[goog.string.format] Not enough arguments');
    }

    // Patch the value argument to the beginning of our type specific call.
    arguments[0] = value;

    return goog.string.format.demuxes_[type].apply(null, arguments);

  }

  return template.replace(formatRe, replacerDemuxer);
};


/**
 * Contains various conversion functions (to be filled in later on).
 * @type {Object}
 * @private
 */
goog.string.format.demuxes_ = {};


/**
 * Processes %s conversion specifier.
 * @param {string} value Contains the formatRe matched string.
 * @param {string} flags Formatting flags.
 * @param {string} width Replacement string minimum width.
 * @param {string} dotp Matched precision including a dot.
 * @param {string} precision Specifies floating point precision.
 * @param {string} type Type conversion specifier.
 * @param {string} offset Matching location in the original string.
 * @param {string} wholeString Has the actualString being searched.
 * @return {string} Replacement string.
 */
goog.string.format.demuxes_['s'] = function(value,
                                            flags,
                                            width,
                                            dotp,
                                            precision,
                                            type,
                                            offset,
                                            wholeString) {
  var replacement = value;
  // If no padding is necessary we're done.
  // The check for '' is necessary because Firefox incorrectly provides the
  // empty string instead of undefined for non-participating capture groups,
  // and isNaN('') == false.
  if (isNaN(width) || width == '' || replacement.length >= width) {
    return replacement;
  }

  // Otherwise we should find out where to put spaces.
  if (flags.indexOf('-', 0) > -1) {
    replacement =
        replacement + goog.string.repeat(' ', width - replacement.length);
  } else {
    replacement =
        goog.string.repeat(' ', width - replacement.length) + replacement;
  }
  return replacement;
};


/**
 * Processes %f conversion specifier.
 * @param {number} value Contains the formatRe matched string.
 * @param {string} flags Formatting flags.
 * @param {string} width Replacement string minimum width.
 * @param {string} dotp Matched precision including a dot.
 * @param {string} precision Specifies floating point precision.
 * @param {string} type Type conversion specifier.
 * @param {string} offset Matching location in the original string.
 * @param {string} wholeString Has the actualString being searched.
 * @return {string} Replacement string.
 */
goog.string.format.demuxes_['f'] = function(value,
                                            flags,
                                            width,
                                            dotp,
                                            precision,
                                            type,
                                            offset,
                                            wholeString) {

  var replacement = value.toString();

  // The check for '' is necessary because Firefox incorrectly provides the
  // empty string instead of undefined for non-participating capture groups,
  // and isNaN('') == false.
  if (!(isNaN(precision) || precision == '')) {
    replacement = value.toFixed(precision);
  }

  // Generates sign string that will be attached to the replacement.
  var sign;
  if (value < 0) {
    sign = '-';
  } else if (flags.indexOf('+') >= 0) {
    sign = '+';
  } else if (flags.indexOf(' ') >= 0) {
    sign = ' ';
  } else {
    sign = '';
  }

  if (value >= 0) {
    replacement = sign + replacement;
  }

  // If no padding is neccessary we're done.
  if (isNaN(width) || replacement.length >= width) {
    return replacement;
  }

  // We need a clean signless replacement to start with
  replacement = isNaN(precision) ?
      Math.abs(value).toString() :
      Math.abs(value).toFixed(precision);

  var padCount = width - replacement.length - sign.length;

  // Find out which side to pad, and if it's left side, then which character to
  // pad, and set the sign on the left and padding in the middle.
  if (flags.indexOf('-', 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(' ', padCount);
  } else {
    // Decides which character to pad.
    var paddingChar = (flags.indexOf('0', 0) >= 0) ? '0' : ' ';
    replacement =
        sign + goog.string.repeat(paddingChar, padCount) + replacement;
  }

  return replacement;
};


/**
 * Processes %d conversion specifier.
 * @param {string} value Contains the formatRe matched string.
 * @param {string} flags Formatting flags.
 * @param {string} width Replacement string minimum width.
 * @param {string} dotp Matched precision including a dot.
 * @param {string} precision Specifies floating point precision.
 * @param {string} type Type conversion specifier.
 * @param {string} offset Matching location in the original string.
 * @param {string} wholeString Has the actualString being searched.
 * @return {string} Replacement string.
 */
goog.string.format.demuxes_['d'] = function(value,
                                            flags,
                                            width,
                                            dotp,
                                            precision,
                                            type,
                                            offset,
                                            wholeString) {
  return goog.string.format.demuxes_['f'](
      parseInt(value, 10) /* value */,
      flags, width, dotp, 0 /* precision */,
      type, offset, wholeString);
};


// These are additional aliases, for integer conversion.
goog.string.format.demuxes_['i'] = goog.string.format.demuxes_['d'];
goog.string.format.demuxes_['u'] = goog.string.format.demuxes_['d'];


// Input 24
// Copyright 2010 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Creates a string of a JSON object, properly indented for
 * display.
 *
 */

goog.provide('goog.format.JsonPrettyPrinter');
goog.provide('goog.format.JsonPrettyPrinter.HtmlDelimiters');
goog.provide('goog.format.JsonPrettyPrinter.TextDelimiters');

goog.require('goog.json');
goog.require('goog.json.Serializer');
goog.require('goog.string');
goog.require('goog.string.StringBuffer');
goog.require('goog.string.format');



/**
 * Formats a JSON object as a string, properly indented for display.  Supports
 * displaying the string as text or html.  Users can also specify their own
 * set of delimiters for different environments.  For example, the JSON object:
 *
 * <code>{"a": 1, "b": {"c": null, "d": true, "e": [1, 2]}}</code>
 *
 * Will be displayed like this:
 *
 * <code>{
 *   "a": 1,
 *   "b": {
 *     "c": null,
 *     "d": true,
 *     "e": [
 *       1,
 *       2
 *     ]
 *   }
 * }</code>
 * @param {goog.format.JsonPrettyPrinter.TextDelimiters} delimiters Container
 *     for the various strings to use to delimit objects, arrays, newlines, and
 *     other pieces of the output.
 * @constructor
 */
goog.format.JsonPrettyPrinter = function(delimiters) {

  /**
   * The set of characters to use as delimiters.
   * @type {goog.format.JsonPrettyPrinter.TextDelimiters}
   * @private
   */
  this.delimiters_ = delimiters ||
      new goog.format.JsonPrettyPrinter.TextDelimiters();

  /**
   * Used to serialize property names and values.
   * @type {goog.json.Serializer}
   * @private
   */
  this.jsonSerializer_ = new goog.json.Serializer();
};


/**
 * Formats a JSON object as a string, properly indented for display.
 * @param {*} json The object to pretty print. It could be a JSON object, a
 *     string representing a JSON object, or any other type.
 * @return {string} Returns a string of the JSON object, properly indented for
 *     display.
 */
goog.format.JsonPrettyPrinter.prototype.format = function(json) {
  // If input is undefined, null, or empty, return an empty string.
  if (!goog.isDefAndNotNull(json)) {
    return '';
  }
  if (goog.isString(json)) {
    if (goog.string.isEmpty(json)) {
      return '';
    }
    // Try to coerce a string into a JSON object.
    json = goog.json.parse(json);
  }
  var outputBuffer = new goog.string.StringBuffer();
  this.printObject_(json, outputBuffer, 0);
  return outputBuffer.toString();
};


/**
 * Formats a property value based on the type of the propery.
 * @param {*} val The object to format.
 * @param {goog.string.StringBuffer} outputBuffer The buffer to write the
 *     response to.
 * @param {number} indent The number of spaces to indent each line of the
 *     output.
 * @private
 */
goog.format.JsonPrettyPrinter.prototype.printObject_ = function(val,
    outputBuffer, indent) {
  var typeOf = goog.typeOf(val);
  switch (typeOf) {
    case 'null':
    case 'boolean':
    case 'number':
    case 'string':
      // "null", "boolean", "number" and "string" properties are printed
      // directly to the output.
      this.printValue_(
          /** @type {null|string|boolean|number} */ (val),
          typeOf, outputBuffer);
      break;
    case 'array':
      // Example of how an array looks when formatted
      // (using the default delimiters):
      // [
      //   1,
      //   2,
      //   3
      // ]
      outputBuffer.append(this.delimiters_.arrayStart);
      var i = 0;
      // Iterate through the array and format each element.
      for (i = 0; i < val.length; i++) {
        if (i > 0) {
          // There are multiple elements, add a comma to separate them.
          outputBuffer.append(this.delimiters_.propertySeparator);
        }
        outputBuffer.append(this.delimiters_.lineBreak);
        this.printSpaces_(indent + this.delimiters_.indent, outputBuffer);
        this.printObject_(val[i], outputBuffer,
            indent + this.delimiters_.indent);
      }
      // If there are no properties in this object, don't put a line break
      // between the beginning "[" and ending "]", so the output of an empty
      // array looks like <code>[]</code>.
      if (i > 0) {
        outputBuffer.append(this.delimiters_.lineBreak);
        this.printSpaces_(indent, outputBuffer);
      }
      outputBuffer.append(this.delimiters_.arrayEnd);
      break;
    case 'object':
      // Example of how an object looks when formatted
      // (using the default delimiters):
      // {
      //   "a": 1,
      //   "b": 2,
      //   "c": "3"
      // }
      outputBuffer.append(this.delimiters_.objectStart);
      var propertyCount = 0;
      // Iterate through the object and display each property.
      for (var name in val) {
        if (!val.hasOwnProperty(name)) {
          continue;
        }
        if (propertyCount > 0) {
          // There are multiple properties, add a comma to separate them.
          outputBuffer.append(this.delimiters_.propertySeparator);
        }
        outputBuffer.append(this.delimiters_.lineBreak);
        this.printSpaces_(indent + this.delimiters_.indent, outputBuffer);
        this.printName_(name, outputBuffer);
        outputBuffer.append(this.delimiters_.nameValueSeparator,
            this.delimiters_.space);
        this.printObject_(val[name], outputBuffer,
            indent + this.delimiters_.indent);
        propertyCount++;
      }
      // If there are no properties in this object, don't put a line break
      // between the beginning "{" and ending "}", so the output of an empty
      // object looks like <code>{}</code>.
      if (propertyCount > 0) {
        outputBuffer.append(this.delimiters_.lineBreak);
        this.printSpaces_(indent, outputBuffer);
      }
      outputBuffer.append(this.delimiters_.objectEnd);
      break;
    // Other types, such as "function", aren't expected in JSON, and their
    // behavior is undefined.  In these cases, just print an empty string to the
    // output buffer.  This allows the pretty printer to continue while still
    // outputing well-formed JSON.
    default:
      this.printValue_('', 'unknown', outputBuffer);
  }
};


/**
 * Prints a property name to the output.
 * @param {string} name The property name.
 * @param {goog.string.StringBuffer} outputBuffer The buffer to write the
 *     response to.
 * @private
 */
goog.format.JsonPrettyPrinter.prototype.printName_ = function(name,
    outputBuffer) {
  outputBuffer.append(this.delimiters_.preName,
      this.jsonSerializer_.serialize(name), this.delimiters_.postName);
};


/**
 * Prints a property name to the output.
 * @param {string|boolean|number|null} val The property value.
 * @param {string} typeOf The type of the value.  Used to customize
 *     value-specific css in the display.  This allows clients to distinguish
 *     between different types in css.  For example, the client may define two
 *     classes: "goog-jsonprettyprinter-propertyvalue-string" and
 *     "goog-jsonprettyprinter-propertyvalue-number" to assign a different color
 *     to string and number values.
 * @param {goog.string.StringBuffer} outputBuffer The buffer to write the
 *     response to.
 * @private
 */
goog.format.JsonPrettyPrinter.prototype.printValue_ = function(val,
    typeOf, outputBuffer) {
  outputBuffer.append(goog.string.format(this.delimiters_.preValue, typeOf),
      this.jsonSerializer_.serialize(val),
      goog.string.format(this.delimiters_.postValue, typeOf));
};


/**
 * Print a number of space characters to the output.
 * @param {number} indent The number of spaces to indent the line.
 * @param {goog.string.StringBuffer} outputBuffer The buffer to write the
 *     response to.
 * @private
 */
goog.format.JsonPrettyPrinter.prototype.printSpaces_ = function(indent,
    outputBuffer) {
  outputBuffer.append(goog.string.repeat(this.delimiters_.space, indent));
};



/**
 * A container for the delimiting characters used to display the JSON string
 * to a text display.  Each delimiter is a publicly accessible property of
 * the object, which makes it easy to tweak delimiters to specific environments.
 * @constructor
 */
goog.format.JsonPrettyPrinter.TextDelimiters = function() {
};


/**
 * Represents a space character in the output.  Used to indent properties a
 * certain number of spaces, and to separate property names from property
 * values.
 * @type {string}
 */
goog.format.JsonPrettyPrinter.TextDelimiters.prototype.space = ' ';


/**
 * Represents a newline character in the output.  Used to begin a new line.
 * @type {string}
 */
goog.format.JsonPrettyPrinter.TextDelimiters.prototype.lineBreak = '\n';


/**
 * Represents the start of an object in the output.
 * @type {string}
 */
goog.format.JsonPrettyPrinter.TextDelimiters.prototype.objectStart = '{';


/**
 * Represents the end of an object in the output.
 * @type {string}
 */
goog.format.JsonPrettyPrinter.TextDelimiters.prototype.objectEnd = '}';


/**
 * Represents the start of an array in the output.
 * @type {string}
 */
goog.format.JsonPrettyPrinter.TextDelimiters.prototype.arrayStart = '[';


/**
 * Represents the end of an array in the output.
 * @type {string}
 */
goog.format.JsonPrettyPrinter.TextDelimiters.prototype.arrayEnd = ']';


/**
 * Represents the string used to separate properties in the output.
 * @type {string}
 */
goog.format.JsonPrettyPrinter.TextDelimiters.prototype.propertySeparator = ',';


/**
 * Represents the string used to separate property names from property values in
 * the output.
 * @type {string}
 */
goog.format.JsonPrettyPrinter.TextDelimiters.prototype.nameValueSeparator = ':';


/**
 * A string that's placed before a property name in the output.  Useful for
 * wrapping a property name in an html tag.
 * @type {string}
 */
goog.format.JsonPrettyPrinter.TextDelimiters.prototype.preName = '';


/**
 * A string that's placed after a property name in the output.  Useful for
 * wrapping a property name in an html tag.
 * @type {string}
 */
goog.format.JsonPrettyPrinter.TextDelimiters.prototype.postName = '';


/**
 * A string that's placed before a property value in the output.  Useful for
 * wrapping a property value in an html tag.
 * @type {string}
 */
goog.format.JsonPrettyPrinter.TextDelimiters.prototype.preValue = '';


/**
 * A string that's placed after a property value in the output.  Useful for
 * wrapping a property value in an html tag.
 * @type {string}
 */
goog.format.JsonPrettyPrinter.TextDelimiters.prototype.postValue = '';


/**
 * Represents the number of spaces to indent each sub-property of the JSON.
 * @type {number}
 */
goog.format.JsonPrettyPrinter.TextDelimiters.prototype.indent = 2;



/**
 * A container for the delimiting characters used to display the JSON string
 * to an HTML <code>&lt;pre&gt;</code> or <code>&lt;code&gt;</code> element.
 * @constructor
 * @extends {goog.format.JsonPrettyPrinter.TextDelimiters}
 */
goog.format.JsonPrettyPrinter.HtmlDelimiters = function() {
  goog.format.JsonPrettyPrinter.TextDelimiters.call(this);
};
goog.inherits(goog.format.JsonPrettyPrinter.HtmlDelimiters,
    goog.format.JsonPrettyPrinter.TextDelimiters);


/**
 * A <code>span</code> tag thats placed before a property name.  Used to style
 * property names with CSS.
 * @type {string}
 * @override
 */
goog.format.JsonPrettyPrinter.HtmlDelimiters.prototype.preName =
    '<span class="' +
    goog.getCssName('goog-jsonprettyprinter-propertyname') +
    '">';


/**
 * A closing <code>span</code> tag that's placed after a property name.
 * @type {string}
 * @override
 */
goog.format.JsonPrettyPrinter.HtmlDelimiters.prototype.postName = '</span>';


/**
 * A <code>span</code> tag thats placed before a property value.  Used to style
 * property value with CSS.  The span tag's class is in the format
 * goog-jsonprettyprinter-propertyvalue-{TYPE}, where {TYPE} is the JavaScript
 * type of the object (the {TYPE} parameter is obtained from goog.typeOf).  This
 * can be used to style different value types.
 * @type {string}
 * @override
 */
goog.format.JsonPrettyPrinter.HtmlDelimiters.prototype.preValue =
    '<span class="' +
    goog.getCssName('goog-jsonprettyprinter-propertyvalue') +
    '-%s">';


/**
 * A closing <code>span</code> tag that's placed after a property value.
 * @type {string}
 * @override
 */
goog.format.JsonPrettyPrinter.HtmlDelimiters.prototype.postValue = '</span>';

// Input 25
goog.require('goog.array');
goog.require('goog.date');
goog.require('goog.debug.Logger');
goog.require('goog.i18n.DateTimeFormat');
goog.require('goog.json');
goog.require('goog.structs.Set');
//goog.require('goog.ui.DatePicker');
goog.require('goog.format.JsonPrettyPrinter');

