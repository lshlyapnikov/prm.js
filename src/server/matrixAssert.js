// @flow strict
import { type Matrix, validateMatrix, copyMatrix } from "./linearAlgebra"
import { setMatrixElementsScale } from "./utils"
import assert from "assert"
import _ from "underscore"

export function assertEqualMatrices(actualMatrix: Matrix<number>, expectedMatrix: Matrix<number>, scale: number): void {
  validateMatrix(actualMatrix)
  validateMatrix(expectedMatrix)
  if (_.isUndefined(scale)) {
    throw new Error("InvalidArgument: scale is not defined")
  }
  assert.deepEqual(
    setMatrixElementsScale(copyMatrix(actualMatrix), scale),
    setMatrixElementsScale(copyMatrix(expectedMatrix), scale)
  )
}

export function assertNotEqualMatrices(
  actualMatrix: Matrix<number>,
  expectedMatrix: Matrix<number>,
  scale: number
): void {
  validateMatrix(actualMatrix)
  validateMatrix(expectedMatrix)
  if (_.isUndefined(scale)) {
    throw new Error("InvalidArgument: scale is not defined")
  }
  assert.notDeepEqual(
    setMatrixElementsScale(copyMatrix(actualMatrix), scale),
    setMatrixElementsScale(copyMatrix(expectedMatrix), scale)
  )
}
