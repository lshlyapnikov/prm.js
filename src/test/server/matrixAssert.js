// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global exports, require */

var linearAlgebra = require("../../main/server/linearAlgebra");
var utils = require("../../main/server/utils");
var assert = require("assert");

exports.equal = function(actualMatrix, expectedMatrix, scale) {
  linearAlgebra.validateMatrix(actualMatrix);
  linearAlgebra.validateMatrix(expectedMatrix);
  if (!utils.defined(scale)) {
    throw new Error("InvalidArgument: scale is not defined");
  }
  assert.deepEqual(
    utils.setMatrixElementsScale(linearAlgebra.copyMatrix(actualMatrix), scale),
    utils.setMatrixElementsScale(linearAlgebra.copyMatrix(expectedMatrix), scale));
};

exports.notEqual = function(actualMatrix, expectedMatrix, scale) {
  linearAlgebra.validateMatrix(actualMatrix);
  linearAlgebra.validateMatrix(expectedMatrix);
  if (!utils.defined(scale)) {
    throw new Error("InvalidArgument: scale is not defined");
  }
  assert.notDeepEqual(
    utils.setMatrixElementsScale(linearAlgebra.copyMatrix(actualMatrix), scale),
    utils.setMatrixElementsScale(linearAlgebra.copyMatrix(expectedMatrix), scale));
};