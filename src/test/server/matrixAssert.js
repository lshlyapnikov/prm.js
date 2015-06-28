var linearAlgebra = require("../../main/server/linearAlgebra");
var utils = require("../../main/server/utils");
var assert = require("assert");
var _ = require("underscore")

exports.equal = function(actualMatrix, expectedMatrix, scale) {
  linearAlgebra.validateMatrix(actualMatrix);
  linearAlgebra.validateMatrix(expectedMatrix);
  if (_.isUndefined(scale)) {
    throw new Error("InvalidArgument: scale is not defined");
  }
  assert.deepEqual(
    utils.setMatrixElementsScale(linearAlgebra.copyMatrix(actualMatrix), scale),
    utils.setMatrixElementsScale(linearAlgebra.copyMatrix(expectedMatrix), scale));
};

exports.notEqual = function(actualMatrix, expectedMatrix, scale) {
  linearAlgebra.validateMatrix(actualMatrix);
  linearAlgebra.validateMatrix(expectedMatrix);
  if (_.isUndefined(scale)) {
    throw new Error("InvalidArgument: scale is not defined");
  }
  assert.notDeepEqual(
    utils.setMatrixElementsScale(linearAlgebra.copyMatrix(actualMatrix), scale),
    utils.setMatrixElementsScale(linearAlgebra.copyMatrix(expectedMatrix), scale));
};