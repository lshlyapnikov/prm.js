// @flow strict
import {
  dim,
  rowMatrix,
  columnMatrix,
  transpose,
  multiplyMatrices,
  multiplyVectors,
  inverseMatrix,
  copyMatrix,
  validateMatrix
} from "./linearAlgebra"
import { assertEqualMatrices, assertNotEqualMatrices } from "./matrixAssert"
import assert from "assert"
import { setMatrixElementsScale } from "./utils"

describe("linearAlgebra", () => {
  describe("#dim()", () => {
    it("should return matrix dimensions", () => {
      // WHEN
      const actual = dim([
        [1, 2, 3, 4],
        [6, 7, 8, 9]
      ])
      // THEN
      assert.deepEqual(actual, [2, 4])
    })
    it("should return 3x1 for a column matrix", () => {
      const actual = dim([[1], [2], [3]])
      assert.deepEqual(actual, [3, 1])
    })
    it("should return 1x3 for a row matrix", () => {
      const actual = dim([[1, 2, 3]])
      assert.deepEqual(actual, [1, 3])
    })
  })
  describe("#rowMatrix", () => {
    it("should create a row 1xN matrix from a vector of N elements", () => {
      const actual = rowMatrix([1, 2, 3])
      assert.deepEqual(dim(actual), [1, 3])
      assert.deepEqual(actual, [[1, 2, 3]])
    })
  })
  describe("#columnMatrix", () => {
    it("should create a column Nx1 matrix from a vector of N elements", () => {
      const actual = columnMatrix([1, 2, 3])
      assert.deepEqual(dim(actual), [3, 1])
      assert.deepEqual(actual, [[1], [2], [3]])
    })
  })
  describe("#transpose()", () => {
    it("should transpose a matrix", () => {
      // GIVEN
      var expected = [
        [1, 6],
        [2, 7],
        [3, 8],
        [4, 9]
      ]
      // WHEN
      const actual = transpose([
        [1, 2, 3, 4],
        [6, 7, 8, 9]
      ])
      // THEN
      assert.deepEqual(actual, expected)
    })
    it("should transpose 2x1 matrix to 1x2", () => {
      const actual = transpose([[1], [2]])
      assert.deepEqual(actual, [[1, 2]])
    })
    it("should transpose 1x2 matrix to 2x1", () => {
      const actual = transpose([[1, 2]])
      assert.deepEqual(actual, [[1], [2]])
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
        [
          [4, -1],
          [-4, -3],
          [2, 5]
        ],
        [
          [1, -2],
          [6, -1]
        ]
      )
      // THEN
      assert.deepEqual(actual, expected)
    })
    it("should multiply 2x1 and 1x2 matrices", () => {
      assert.deepEqual(multiplyMatrices(columnMatrix([1, 2]), rowMatrix([2, 1])), [
        [2, 1],
        [4, 2]
      ])
    })
    it("should multiply 1x2 and 2x1 matrices", () => {
      assert.equal(multiplyMatrices(rowMatrix([1, 2]), columnMatrix([2, 1])), 4)
    })
    it("should multiply 1x2 and 2x1 matrices, failing scenario", () => {
      const a = [[1.296, -0.2959]]
      const b = [[1.296], [-0.2959]]
      const actual = multiplyMatrices(a, b)
      const expected = [[1.767173]]
      assert.deepEqual(setMatrixElementsScale(actual, 5), setMatrixElementsScale(expected, 5))
    })
    it("should multiply 1x2 and 2x2 matrices and return zero 1x2 matrix", () => {
      const a = [[-0.2958994892957374, 1.2958994892957374]]
      const b = [
        [0.00042280114208275815, 0.0000965403899371335],
        [0.0000965403899371335, 0.000022043570751257575]
      ]
      const actual = multiplyMatrices(a, b)
      const expected = [[0, 0]]
      assert.deepEqual(actual, expected)
    })
    it("should throw exception when argument 2x1 and 2x1", () => {
      assert.throws(() => {
        multiplyMatrices([[1, 2]], [[2, 1]])
      }, Error)
    })
  })
  describe("#multiplyVectors", () => {
    it("should multiply two vectors", () => {
      assert.equal(multiplyVectors([1, 2], [2, 1]), 4)
    })
    it("should multiply two vectors and return zero vector", () => {
      assert.equal(multiplyVectors([1, 2], [0, 0]), 0)
    })
    it("should throw exception when arguments have different dimensions", () => {
      assert.throws(() => {
        multiplyVectors([1, 2, 3], [2, 1])
      }, /InvalidArgument: vectors have different dimensions/)

      assert.throws(() => {
        multiplyVectors([1, 2, 3], [4, 3, 2, 1])
      }, /InvalidArgument: vectors have different dimensions/)
    })
  })
  describe("#validateMatrix()", () => {
    it("matrix should pass validation when all rows have the same number of elements", () => {
      var matrix = [
        [1, 2, 3],
        [1, 2, 3]
      ]
      validateMatrix(matrix)
    })
    it("matrix should fail validation when a row contains number of elements less than expected", () => {
      var matrix = [
        [1, 2, 3],
        [1, 2],
        [1, 2, 3]
      ]
      assert.throws(() => validateMatrix(matrix))
    })
    it("matrix should fail validation when a row contains number of elements larger than expected", () => {
      var matrix = [
        [1, 2, 3],
        [1, 2, 3, 4],
        [1, 2, 3]
      ]
      assert.throws(() => validateMatrix(matrix))
    })
  })
  describe("#copyMatrix", () => {
    it("should copy matrix", () => {
      var matrix = [
        [1.1, 2.2, 3.3],
        [4.4, 5.5, 6.6]
      ]
      var matrixCopy = copyMatrix(matrix)
      assertEqualMatrices(matrixCopy, matrix, 4)
    })
    it("should create a deep copy of the original matrix", () => {
      var matrix = [
        [1.1, 2.2, 3.3],
        [4.4, 5.5, 6.6]
      ]
      var matrixCopy = copyMatrix(matrix)
      matrixCopy[0][0] = -1.1
      assertNotEqualMatrices(matrixCopy, matrix, 4)
      assert.equal(matrix[0][0], 1.1)
    })
  })
  describe("#inverseMatrix", () => {
    it("should inverse matrix", () => {
      var matrix = [
        [1, 3, 3],
        [1, 4, 3],
        [1, 3, 4]
      ]
      const actual = inverseMatrix(matrix)
      var expected = [
        [7, -3, -3],
        [-1, 1, 0],
        [-1, 0, 1]
      ]
      assertEqualMatrices(actual, expected, 4)
    })
  })
})
