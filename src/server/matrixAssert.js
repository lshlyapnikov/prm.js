// @flow strict
import { type Matrix, validateMatrix, copyMatrix } from "./linearAlgebra"
import { setMatrixElementsScale } from "./utils"
import assert from "assert"

export function assertEqualMatrices<M: number, N: number>(
  actualMatrix: Matrix<number, M, N>,
  expectedMatrix: Matrix<number, M, N>,
  scale: number
): void {
  validateMatrix(actualMatrix)
  validateMatrix(expectedMatrix)
  assert.deepStrictEqual(
    setMatrixElementsScale(copyMatrix(actualMatrix).values, scale),
    setMatrixElementsScale(copyMatrix(expectedMatrix).values, scale)
  )
}

export function assertNotEqualMatrices<M: number, N: number>(
  actualMatrix: Matrix<number, M, N>,
  expectedMatrix: Matrix<number, M, N>,
  scale: number
): void {
  validateMatrix(actualMatrix)
  validateMatrix(expectedMatrix)
  assert.notDeepStrictEqual(
    setMatrixElementsScale(copyMatrix(actualMatrix).values, scale),
    setMatrixElementsScale(copyMatrix(expectedMatrix).values, scale)
  )
}
