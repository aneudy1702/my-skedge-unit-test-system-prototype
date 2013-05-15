/** @type {function((Object|string)=): jQuery} */
jQuery.prototype.clickover = function(o) {};

/** @type {function((Object|string)): jQuery} */
jQuery.prototype.datepicker = function(o) {};

/** @type {function(Object=): ?} */
jQuery.prototype.dateTimeRestrict = function(o) {};

/** @type {function(Object): jQuery} */
jQuery.prototype.datetimepicker = function(o) {};

/** @type {function(!Object): ?} */
jQuery.prototype.dateTimeRestrict.setDefaults = function(o){};

/** @type {function((Object|string)=, ?=): jQuery} */
jQuery.prototype.editable = function(s, o) {};

/** @type {function((Object|string)=, Object=): jQuery} */
jQuery.prototype.modal = function(s,o) {};

/** @type {function((Object|string)=, Object=): jQuery} */
jQuery.prototype.typeahead = function(s,o) {};

/** @type {function((Object|string)=, Object=): jQuery} */
jQuery.prototype.tablecloth = function(s,o) {};

/** @type {function((Object|string)=): jQuery} */
jQuery.prototype.tooltip = function(s) {};

/** @type {function((Object|string)=): jQuery} */
jQuery.prototype.bubble = function(s) {};

/** @type {function((Object|string)=): jQuery} */
jQuery.prototype.dataTable = function(s) {};
