/* global describe, it */

const la = require("./linearAlgebra")
const matrixAssert = require("./matrixAssert")
const assert = require("assert")
const utils = require("./utils")

describe("linearAlgebra", () => {
  describe("#dim()", () => {
    it("should return matrix dimensions", () => {
      // GIVEN
      var expected = [2, 4];
      // WHEN
      var actual = la.dim([
        [1, 2, 3, 4],
        [6, 7, 8, 9]
      ])
      // THEN
      assert.deepEqual(actual, expected)
    })
    it("should return 3x1 for a column matrix", () => {
      var actual = la.dim([
        [1],
        [2],
        [3]
      ])
      assert.deepEqual(actual, [3, 1])
    })
    it("should return 1x3 for a row matrix", () => {
      var actual = la.dim([
        [1, 2, 3]
      ])
      assert.deepEqual(actual, [1, 3])
    })
    it("should throw an exception when vector passed", () => {
      assert.throws(() => la.dim([1, 2, 3]))
    })
  })
  describe("#rowMatrix", () => {
    it("should create a row 1xN matrix from a vector of N elements", () => {
      var actual = la.rowMatrix([1, 2, 3])
      assert.deepEqual(la.dim(actual), [1, 3])
      assert.deepEqual(actual, [
        [1, 2, 3]
      ])
    })
  })
  describe("#columnMatrix", () => {
    it("should create a column Nx1 matrix from a vector of N elements", () => {
      var actual = la.columnMatrix([1, 2, 3])
      assert.deepEqual(la.dim(actual), [3, 1])
      assert.deepEqual(actual, [
        [1],
        [2],
        [3]
      ])
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
      ];
      // WHEN
      var actual = la.transpose([
        [1, 2, 3, 4],
        [6, 7, 8, 9]
      ])
      // THEN
      assert.deepEqual(actual, expected)
    })
    it("should transpose 2x1 matrix to 1x2", () => {
      var actual = la.transpose([
        [1],
        [2]
      ])
      assert.deepEqual(actual, [
        [1, 2]
      ])
    })
    it("should transpose 1x2 matrix to 2x1", () => {
      var actual = la.transpose([
        [1, 2]
      ])
      assert.deepEqual(actual, [
        [1],
        [2]
      ])
    })
  })
  describe("#multiplyMatrices()", () => {
    it("should multiply two matrices", () => {
      // GIVEN
      var expected = [
        [-2, -7],
        [-22, 11],
        [32, -9]
      ];
      // WHEN
      var actual = la.multiplyMatrices(
        [
          [4, -1],
          [-4, -3],
          [2, 5]
        ],
        [
          [1, -2],
          [6, -1]
        ])
      // THEN
      assert.deepEqual(actual, expected)
    })
    it("should multiply 2x1 and 1x2 matrices", () => {
      assert.deepEqual(
        la.multiplyMatrices(la.columnMatrix([1, 2]), la.rowMatrix([2, 1])),
        [
          [2, 1],
          [4, 2]
        ])
    })
    it("should multiply 1x2 and 2x1 matrices", () => {
      assert.equal(
        la.multiplyMatrices(la.rowMatrix([1, 2]), la.columnMatrix([2, 1])),
        4)
    })
    it("should multiply 1x2 and 2x1 matrices, failing scenario", () => {
      const a = [[1.296, -0.2959]]
      const b = [[1.296], [-0.2959]]
      const actual = la.multiplyMatrices(a, b)
      const expected = [[1.767173]]
      assert.deepEqual(utils.setMatrixElementsScale(actual, 5), utils.setMatrixElementsScale(expected, 5))
    })
    it("should multiply 1x2 and 2x2 matrices and return zero 1x2 matrix", () => {
      const a = [[-0.2958994892957374, 1.2958994892957374]]
      const b = [
        [0.00042280114208275815, 0.0000965403899371335],
        [0.0000965403899371335, 0.000022043570751257575]
      ]
      const actual = la.multiplyMatrices(a, b)
      const expected = [[0, 0]]
      assert.deepEqual(actual, expected)
    })
    it("should throw exception when argument 2x1 and 2x1", () => {
      assert.throws(() => {
          la.multiplyMatrices([1, 2], [2, 1])
        },
        Error)
    })
    it("should throw exception when argument 1x2 and 2x1", () => {
      assert.throws(() => {
          la.multiplyMatrices(la.transpose([1, 2]), [2, 1])
        },
        Error)
    })
    it("should throw exception when argument 2x1 and 1x2", () => {
      assert.throws(() => {
        la.multiplyMatrices([1, 2], la.transpose([2, 1]))
      }, Error)
    })
  })
  describe("#multiplyVectors", () => {
    it("should multiply two vectors", () => {
      assert.equal(la.multiplyVectors([1, 2], [2, 1]), 4)
    })
    it("should multiply two vectors and return zero vector", () => {
      assert.equal(la.multiplyVectors([1, 2], [0, 0]), 0)
    })
    it("should throw exception 1st argument is not vector", () => {
      assert.throws(() => {
          la.multiplyVectors(la.columnMatrix([1, 2]), [2, 1])
        },
        /InvalidArgument: 1st argument has to be a vector/)

    })
    it("should throw exception 2nd argument is not vector", () => {
      assert.throws(() => {
          la.multiplyVectors([1, 2], la.rowMatrix([2, 1]))
        },
        /InvalidArgument: 2nd argument has to be a vector/)

    })
    it("should throw exception when arguments have different dimensions", () => {
      assert.throws(() => {
          la.multiplyVectors([1, 2, 3], [2, 1])
        },
        /InvalidArgument: vectors have different dimensions/)

      assert.throws(() => {
          la.multiplyVectors([1, 2, 3], [4, 3, 2, 1])
        },
        /InvalidArgument: vectors have different dimensions/)
    })
  })
  describe("#validateMatrix()", () => {
    it("matrix should pass validation when all rows have the same number of elements", () => {
      var matrix = [
        [1, 2, 3],
        [1, 2, 3]
      ];
      la.validateMatrix(matrix)
    })
    it("undefined should fail validation", () => {
      assert.throws(() => la.validateMatrix(undefined), Error)
    })
    it("matrix should fail validation when a row contains number of elements less than expected", () => {
      var matrix = [
        [1, 2, 3],
        [1, 2],
        [1, 2, 3]
      ];
      assert.throws(() => la.validateMatrix(matrix))
    })
    it("matrix should fail validation when a row contains number of elements larger than expected", () => {
      var matrix = [
        [1, 2, 3],
        [1, 2, 3, 4],
        [1, 2, 3]
      ];
      assert.throws(() => la.validateMatrix(matrix))
    })
  })
  describe("#copyMatrix", () => {
    it("should copy matrix", () => {
      var matrix = [
        [1.1, 2.2, 3.3],
        [4.4, 5.5, 6.6]
      ];
      var matrixCopy = la.copyMatrix(matrix)
      matrixAssert.equal(matrixCopy, matrix, 4)
    })
    it("should create a deep copy of the original matrix", () => {
      var matrix = [
        [1.1, 2.2, 3.3],
        [4.4, 5.5, 6.6]
      ];
      var matrixCopy = la.copyMatrix(matrix)
      matrixCopy[0][0] = -1.1;
      matrixAssert.notEqual(matrixCopy, matrix, 4)
      assert.equal(matrix[0][0], 1.1)
    })
  })
  describe("#inverseMatrix", () => {
    it("should inverse matrix", () => {
      var matrix = [
        [1, 3, 3],
        [1, 4, 3],
        [1, 3, 4]
      ];
      var actual = la.inverseMatrix(matrix)
      var expected = [
        [7, -3, -3],
        [-1, 1, 0],
        [-1, 0, 1]
      ];
      matrixAssert.equal(actual, expected, 4)
    })
  })
})
