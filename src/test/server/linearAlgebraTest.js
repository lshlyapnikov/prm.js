// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, describe, it */

var linearAlgebra = require("../../main/server/linearAlgebra");
var matrixAssert = require("./matrixAssert");
var assert = require("assert");

function shouldThrow(f) {
  var actualException;
  try {
    f();
  } catch (e) {
    actualException = e;
  }
  assert.notEqual(actualException, undefined);
  assert.equal("Error", actualException.name);
}

describe("linearAlgebra", function () {
  describe("#dim()", function () {
    it("should return matrix dimensions", function () {
      // GIVEN
      var expected = [2, 4];
      // WHEN
      var actual = linearAlgebra.dim([
        [1, 2, 3, 4],
        [6, 7, 8, 9]
      ]);
      // THEN
      assert.deepEqual(actual, expected);
    });
  });
  describe("#transpose()", function () {
    it("should transpose a matrix", function () {
      // GIVEN
      var expected = [
        [1, 6],
        [2, 7],
        [3, 8],
        [4, 9]
      ];
      // WHEN
      var actual = linearAlgebra.transpose([
        [1, 2, 3, 4],
        [6, 7, 8, 9]
      ]);
      // THEN
      assert.deepEqual(actual, expected);
    });
  });
  describe("#multiplyMatrices()", function () {
    it("should multiply two matrices", function () {
      // GIVEN
      var expected = [
        [-2, -7],
        [-22, 11],
        [32, -9]
      ];
      // WHEN
      var actual = linearAlgebra.multiplyMatrices(
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
  });
  describe("#validateMatrix()", function () {
    it("matrix should pass validation when all rows have the same number of elements", function () {
      var matrix = [
        [1, 2, 3],
        [1, 2, 3]
      ];
      linearAlgebra.validateMatrix(matrix);
    });
    it("undefined should fail validation", function () {
      shouldThrow(function () {
        linearAlgebra.validateMatrix(undefined);
      });
    });
    it("matrix should fail validation when a row contains number of elements less than expected", function () {
      var matrix = [
        [1, 2, 3],
        [1, 2],
        [1, 2, 3]
      ];
      shouldThrow(function () {
        linearAlgebra.validateMatrix(matrix);
      });
    });
    it("matrix should fail validation when a row contains number of elements larger than expected", function () {
      var matrix = [
        [1, 2, 3],
        [1, 2, 3, 4],
        [1, 2, 3]
      ];
      shouldThrow(function () {
        linearAlgebra.validateMatrix(matrix);
      });
    });
  });
  describe("#copyMatrix", function () {
    it("should copy matrix", function () {
      var matrix = [
        [1.1, 2.2, 3.3],
        [4.4, 5.5, 6.6]
      ];
      var matrixCopy = linearAlgebra.copyMatrix(matrix);
      matrixAssert.equal(matrixCopy, matrix, 4);
    });
    it("should create a deep copy of the original matrix", function () {
      var matrix = [
        [1.1, 2.2, 3.3],
        [4.4, 5.5, 6.6]
      ];
      var matrixCopy = linearAlgebra.copyMatrix(matrix);
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
      var actual = linearAlgebra.inverseMatrix(matrix);
      var expected = [
        [7, -3, -3],
        [-1, 1, 0],
        [-1, 0, 1]
      ];
      matrixAssert.equal(actual, expected, 4);
    });
  });
});
