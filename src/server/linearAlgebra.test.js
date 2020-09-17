// @flow strict
import {
  Matrix,
  matrixFrom,
  rowMatrix,
  columnMatrix,
  transpose,
  multiplyMatrices,
  inverseMatrix,
  copyMatrix,
  validateMatrix
} from "./linearAlgebra"
import { assertEqualMatrices, assertNotEqualMatrices } from "./matrixAssert"
import assert from "assert"
import { setMatrixElementsScale } from "./utils"

describe("linearAlgebra", () => {
  describe("#matrixFrom()", () => {
    it("should return matrix dimensions", () => {
      const actual = matrixFrom(2, 4, [
        [1, 2, 3, 4],
        [6, 7, 8, 9]
      ])
      assert.equal(actual.m, 2)
      assert.equal(actual.n, 4)
    })
    it("should return 3x1 for a column matrix", () => {
      const actual = matrixFrom(3, 1, [[1], [2], [3]])
      assert.deepEqual(actual.dim(), [3, 1])
    })
    it("should return 1x3 for a row matrix", () => {
      const actual = matrixFrom(1, 3, [[1, 2, 3]])
      assert.deepEqual(actual.dim(), [1, 3])
    })
  })
  describe("#rowMatrix", () => {
    it("should create a row 1xN matrix from a vector of N elements", () => {
      const actual = rowMatrix(3, [1, 2, 3])
      assert.deepEqual(actual.dim(), [1, 3])
      assert.deepEqual(actual.values, [[1, 2, 3]])
    })
  })
  describe("#columnMatrix", () => {
    it("should create a column Nx1 matrix from a vector of N elements", () => {
      const actual: Matrix<number, 3, 1> = columnMatrix(3, [1, 2, 3])
      assert.deepEqual(actual.dim(), [3, 1])
      assert.deepEqual(actual.values, [[1], [2], [3]])
    })
  })
  describe("#transpose()", () => {
    it("should transpose a matrix", () => {
      // GIVEN
      var expected = matrixFrom(4, 2, [
        [1, 6],
        [2, 7],
        [3, 8],
        [4, 9]
      ])
      // WHEN
      const actual: Matrix<number, 4, 2> = transpose(
        matrixFrom(2, 4, [
          [1, 2, 3, 4],
          [6, 7, 8, 9]
        ])
      )
      // THEN
      assert.deepEqual(actual.values, expected.values)
    })
    it("should transpose 2x1 matrix to 1x2", () => {
      const actual = transpose(matrixFrom(2, 1, [[1], [2]]))
      assert.deepEqual(actual.values, [[1, 2]])
    })
    it("should transpose 1x2 matrix to 2x1", () => {
      const actual: Matrix<number, 2, 1> = transpose(matrixFrom(1, 2, [[1, 2]]))
      assert.deepEqual(actual.values, [[1], [2]])
    })
  })
  describe("#multiplyMatrices()", () => {
    it("should multiply two matrices", () => {
      // GIVEN
      const expected = [
        [-2, -7],
        [-22, 11],
        [32, -9]
      ]
      // WHEN
      const actual = multiplyMatrices(
        matrixFrom(3, 2, [
          [4, -1],
          [-4, -3],
          [2, 5]
        ]),
        matrixFrom(2, 2, [
          [1, -2],
          [6, -1]
        ])
      )
      // THEN
      assert.deepEqual(actual, expected)
    })
    it("should multiply 2x1 and 1x2 matrices", () => {
      assert.deepEqual(multiplyMatrices(columnMatrix(2, [1, 2]), rowMatrix(2, [2, 1])).values, [
        [2, 1],
        [4, 2]
      ])
    })
    it("should multiply 1x2 and 2x1 matrices", () => {
      assert.equal(multiplyMatrices(rowMatrix(2, [1, 2]), columnMatrix(2, [2, 1])), 4)
    })
    it("should multiply 1x2 and 2x1 matrices, failing scenario", () => {
      const a = matrixFrom(1, 2, [[1.296, -0.2959]])
      const b = matrixFrom(2, 1, [[1.296], [-0.2959]])
      const actual = multiplyMatrices(a, b)
      const expected = [[1.767173]]
      assert.deepEqual(setMatrixElementsScale(actual.values, 5), setMatrixElementsScale(expected, 5))
    })
    it("should multiply 1x2 and 2x2 matrices and return zero 1x2 matrix", () => {
      const a = matrixFrom(1, 2, [[-0.2958994892957374, 1.2958994892957374]])
      const b = matrixFrom(2, 2, [
        [0.00042280114208275815, 0.0000965403899371335],
        [0.0000965403899371335, 0.000022043570751257575]
      ])
      const actual = multiplyMatrices(a, b)
      const expected = [[0, 0]]
      assert.deepEqual(actual.values, expected)
    })
    it("should throw exception when argument 2x1 and 2x1", () => {
      assert.throws(() => {
        multiplyMatrices(matrixFrom(2, 1, [[1, 2]]), matrixFrom(2, 1, [[2, 1]]))
      }, Error)
    })
  })
  describe("#validateMatrix()", () => {
    it("matrix should pass validation when all rows have the same number of elements", () => {
      var matrix = matrixFrom(2, 3, [
        [1, 2, 3],
        [1, 2, 3]
      ])
      validateMatrix(matrix)
    })
    it("matrix should fail validation when a row contains number of elements less than expected", () => {
      const matrix: Matrix<number, 3, 3> = new Matrix(3, 3)
      matrix.values = [
        [1, 2, 3],
        [1, 2],
        [1, 2, 3]
      ]
      assert.throws(() => validateMatrix(matrix))
    })
    it("matrix should fail validation when a row contains number of elements larger than expected", () => {
      const values: Array<Array<number>> = [
        [1, 2, 3],
        [1, 2, 3, 4],
        [1, 2, 3]
      ]
      assert.throws(() => matrixFrom(3, 3, values))
    })
  })
  describe("#copyMatrix", () => {
    it("should copy matrix", () => {
      var matrix = matrixFrom(2, 3, [
        [1.1, 2.2, 3.3],
        [4.4, 5.5, 6.6]
      ])
      var matrixCopy = copyMatrix(matrix)
      assertEqualMatrices(matrixCopy, matrix, 4)
    })
    it("should create a deep copy of the original matrix", () => {
      var matrix = matrixFrom(2, 3, [
        [1.1, 2.2, 3.3],
        [4.4, 5.5, 6.6]
      ])
      var matrixCopy = copyMatrix(matrix)
      matrixCopy.values[0][0] = -1.1
      assertNotEqualMatrices(matrixCopy, matrix, 4)
      assert.equal(matrix.values[0][0], 1.1)
    })
  })
  describe("#inverseMatrix", () => {
    it("should inverse matrix", () => {
      var matrix = matrixFrom(3, 3, [
        [1, 3, 3],
        [1, 4, 3],
        [1, 3, 4]
      ])
      const actual: Matrix<number, 3, 3> = inverseMatrix(matrix)
      var expected = matrixFrom(3, 3, [
        [7, -3, -3],
        [-1, 1, 0],
        [-1, 0, 1]
      ])
      assertEqualMatrices(actual, expected, 4)
    })
  })
})
