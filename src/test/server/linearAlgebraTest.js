// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, describe, it */

var la = require("../../main/server/linearAlgebra");
var matrixAssert = require("./matrixAssert");
var assert = require("assert");

function shouldThrow(f) {
  var actualException;
  try {
    f();
  } catch(e) {
    actualException = e;
  }
  assert.notEqual(actualException, undefined);
  assert.equal("Error", actualException.name);
}

describe("linearAlgebra", function() {
  describe("#dim()", function() {
    it("should return matrix dimensions", function() {
      // GIVEN
      var expected = [2, 4];
      // WHEN
      var actual = la.dim([
        [1, 2, 3, 4],
        [6, 7, 8, 9]
      ]);
      // THEN
      assert.deepEqual(actual, expected);
    });
    it("should return 3x1 for a column matrix", function() {
      var actual = la.dim([
        [1],
        [2],
        [3]
      ]);
      assert.deepEqual(actual, [3, 1]);
    });
    it("should return 1x3 for a row matrix", function() {
      var actual = la.dim([
        [1, 2, 3]
      ]);
      assert.deepEqual(actual, [1, 3]);
    });
    it("should throw an exception when vector passed", function() {
      assert.throws(function() {
        la.dim([1, 2, 3]);
      }, Error);
    });
  });
  describe("#rowMatrix", function() {
    it("should create a row 1xN matrix from a vector of N elements", function() {
      var actual = la.rowMatrix([1, 2, 3]);
      assert.deepEqual(la.dim(actual), [1, 3]);
      assert.deepEqual(actual, [
        [1, 2, 3]
      ]);
    });
  });
  describe("#columnMatrix", function() {
    it("should create a column Nx1 matrix from a vector of N elements", function() {
      var actual = la.columnMatrix([1, 2, 3]);
      assert.deepEqual(la.dim(actual), [3, 1]);
      assert.deepEqual(actual, [
        [1],
        [2],
        [3]
      ]);
    });
  });
  describe("#transpose()", function() {
    it("should transpose a matrix", function() {
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
      ]);
      // THEN
      assert.deepEqual(actual, expected);
    });
    it("should transpose 2x1 matrix to 1x2", function() {
      var actual = la.transpose([
        [1],
        [2]
      ]);
      assert.deepEqual(actual, [
        [1, 2]
      ]);
    });
    it("should transpose 1x2 matrix to 2x1", function() {
      var actual = la.transpose([
        [1, 2]
      ]);
      assert.deepEqual(actual, [
        [1],
        [2]
      ]);
    });
  });
  describe("#multiplyMatrices()", function() {
    it("should multiply two matrices", function() {
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
        ]);
      // THEN
      assert.deepEqual(actual, expected);
    });
    it("should multiply 2x1 and 1x2 matrices", function() {
      assert.deepEqual(
        la.multiplyMatrices(la.columnMatrix([1, 2]), la.rowMatrix([2, 1])),
        [
          [2, 1],
          [4, 2]
        ]);
    });
    it("should multiply 1x2 and 2x1 matrices", function() {
      assert.equal(
        la.multiplyMatrices(la.rowMatrix([1, 2]), la.columnMatrix([2, 1])),
        4);
    });
    it("should throw exception when argument 2x1 and 2x1", function() {
      assert.throws(function() {
          la.multiplyMatrices([1, 2], [2, 1]);
        },
        Error);
    });
    it("should throw exception when argument 1x2 and 2x1", function() {
      assert.throws(function() {
          la.multiplyMatrices(la.transpose([1, 2]), [2, 1]);
        },
        Error);
    });
    it("should throw exception when argument 2x1 and 1x2", function() {
      assert.throws(function() {
        la.multiplyMatrices([1, 2], la.transpose([2, 1]));
      }, Error);
    });
  });
  describe("#multiplyVectors", function() {
    it("should multiply two vectors", function() {
      assert.equal(la.multiplyVectors([1, 2], [2, 1]), 4);
    });
    it("should throw exception 1st argument is not vector", function() {
      assert.throws(function() {
          la.multiplyVectors(la.columnMatrix([1, 2]), [2, 1]);
        },
        /InvalidArgument: 1st argument has to be a vector/);

    });
    it("should throw exception 2nd argument is not vector", function() {
      assert.throws(function() {
          la.multiplyVectors([1, 2], la.rowMatrix([2, 1]));
        },
        /InvalidArgument: 2nd argument has to be a vector/);

    });
    it("should throw exception when arguments have different dimensions", function() {
      assert.throws(function() {
          la.multiplyVectors([1, 2, 3], [2, 1]);
        },
        /InvalidArgument: vectors have different dimensions/);

      assert.throws(function() {
          la.multiplyVectors([1, 2, 3], [4, 3, 2, 1]);
        },
        /InvalidArgument: vectors have different dimensions/);
    });
  });
  describe("#validateMatrix()", function() {
    it("matrix should pass validation when all rows have the same number of elements", function() {
      var matrix = [
        [1, 2, 3],
        [1, 2, 3]
      ];
      la.validateMatrix(matrix);
    });
    it("undefined should fail validation", function() {
      shouldThrow(function() {
        la.validateMatrix(undefined);
      });
    });
    it("matrix should fail validation when a row contains number of elements less than expected", function() {
      var matrix = [
        [1, 2, 3],
        [1, 2],
        [1, 2, 3]
      ];
      shouldThrow(function() {
        la.validateMatrix(matrix);
      });
    });
    it("matrix should fail validation when a row contains number of elements larger than expected", function() {
      var matrix = [
        [1, 2, 3],
        [1, 2, 3, 4],
        [1, 2, 3]
      ];
      shouldThrow(function() {
        la.validateMatrix(matrix);
      });
    });
  });
  describe("#copyMatrix", function() {
    it("should copy matrix", function() {
      var matrix = [
        [1.1, 2.2, 3.3],
        [4.4, 5.5, 6.6]
      ];
      var matrixCopy = la.copyMatrix(matrix);
      matrixAssert.equal(matrixCopy, matrix, 4);
    });
    it("should create a deep copy of the original matrix", function() {
      var matrix = [
        [1.1, 2.2, 3.3],
        [4.4, 5.5, 6.6]
      ];
      var matrixCopy = la.copyMatrix(matrix);
      matrixCopy[0][0] = -1.1;
      matrixAssert.notEqual(matrixCopy, matrix, 4);
      assert.equal(matrix[0][0], 1.1);
    });
  });
  describe("#inverseMatrix", function() {
    it("should inverse matrix", function() {
      var matrix = [
        [1, 3, 3],
        [1, 4, 3],
        [1, 3, 4]
      ];
      var actual = la.inverseMatrix(matrix);
      var expected = [
        [7, -3, -3],
        [-1, 1, 0],
        [-1, 0, 1]
      ];
      matrixAssert.equal(actual, expected, 4);
    });
  });
});
