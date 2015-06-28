/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

const _ = require("underscore")

exports.assert = function(shouldBeTrue, doneFunc) {
  if (_.isUndefined(shouldBeTrue)) {
    doneFunc(Error("Async Test Failure, undefined shouldBeTrue assertion"))
    return
  }
  if (!shouldBeTrue) {
    doneFunc(Error("Async Test Failure"))
  }
}
