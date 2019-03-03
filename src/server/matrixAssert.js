// @flow strict
import { type Matrix, validateMatrix, copyMatrix } from "./linearAlgebra"
import { setMatrixElementsScale } from "./utils"
import assert from "assert"

export function assertEqualMatrices(actualMatrix: Matrix<number>, expectedMatrix: Matrix<number>, scale: number): void {
  validateMatrix(actualMatrix)
  validateMatrix(expectedMatrix)
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
  assert.notDeepEqual(
    setMatrixElementsScale(copyMatrix(actualMatrix), scale),
    setMatrixElementsScale(copyMatrix(expectedMatrix), scale)
  )
}
