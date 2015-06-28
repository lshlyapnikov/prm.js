/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, exports */

var _ = require("underscore")

exports.assert = function(shouldBeTrue, doneFunc) {
  if (_.isUndefined(shouldBeTrue)) {
    doneFunc(Error("Async Test Failure, undefined shouldBeTrue assertion"));
    return;
  }
  if (!shouldBeTrue) {
    doneFunc(Error("Async Test Failure"));
  }
};
