// @flow strict
import { type Matrix, validateMatrix, copyMatrix } from "./linearAlgebra"
import utils from "./utils"
import assert from "assert"
import _ from "underscore"

exports.equal = function (actualMatrix: Matrix<number>, expectedMatrix: Matrix<number>, scale: number): void {
  validateMatrix(actualMatrix);
  validateMatrix(expectedMatrix);
  if (_.isUndefined(scale)) {
    throw new Error("InvalidArgument: scale is not defined");
  }
  assert.deepEqual(
    utils.setMatrixElementsScale(copyMatrix(actualMatrix), scale),
    utils.setMatrixElementsScale(copyMatrix(expectedMatrix), scale));
};

exports.notEqual = function (actualMatrix: Matrix<number>, expectedMatrix: Matrix<number>, scale: number): void {
  validateMatrix(actualMatrix);
  validateMatrix(expectedMatrix);
  if (_.isUndefined(scale)) {
    throw new Error("InvalidArgument: scale is not defined");
  }
  assert.notDeepEqual(
    utils.setMatrixElementsScale(copyMatrix(actualMatrix), scale),
    utils.setMatrixElementsScale(copyMatrix(expectedMatrix), scale));
};