/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, exports */

// for some reason the current numeric.js implementation does not check matrix dimensions before multiplication.
// numeric.dot() does too many assumption/deductions -- don't really like it. Want my functions to throw up
// if vector is passed instead of matrix or if matrix dimensions do not allow multiplication.

var numeric = require("numeric");

function dim(matrixMxN) {
  if("undefined" === typeof matrixMxN) {
    throw new Error("InvalidArgument: argument matrixMxN is undefined");
  }

  var m = matrixMxN.length;
  if("number" !== typeof m) {
    throw new Error("InvalidArgument: argument matrix does not have rows");
  }

  var n = matrixMxN[0].length;
  if("number" !== typeof n) {
    throw new Error("InvalidArgument: argument matrix does not have columns");
  }

  return [m, n];
}

function matrix(m, n, initialValue) {
  if("number" !== typeof m || m <= 0) {
    throw new Error("InvalidArgument: invalid m: " + m);
  }
  if("number" !== typeof n || n <= 0) {
    throw new Error("InvalidArgument: invalid n: " + n);
  }

  var result = new Array(m);
  var i, j;

  for(i = 0; i < m; i++) {
    result[i] = new Array(n);
  }

  if(undefined !== initialValue) {
    for(i = 0; i < m; i++) {
      for(j = 0; j < n; j++) {
        result[i][j] = initialValue;
      }
    }
  }

  return result;
}

// TODO(lshlyapnikov) will be slow, C++ Node plugin???
function transpose(matrixMxN) {
  var dimensions = dim(matrixMxN);
  var m = dimensions[0];
  var n = dimensions[1];

  var resultNxM = matrix(n, m);
  var i, j;
  for(i = 0; i < m; i++) {
    for(j = 0; j < n; j++) {
      resultNxM[j][i] = matrixMxN[i][j];
    }
  }

  return resultNxM;
}

// TODO(lshlyapnikov) will be slow, C++ Node plugin??, map reduce?? 3rd party library???
function multiplyMatrices(mXn, nXm) {
  if(undefined === mXn) {
    throw new Error("InvalidArgument: Argument mXn is undefined");
  }

  if(undefined === nXm) {
    throw new Error("InvalidArgument: Argument nXm is undefined");
  }

  var dim0 = dim(mXn);
  var dim1 = dim(nXm);

  if(dim0[1] !== dim1[0]) {
    throw new Error("InvalidArgument: " +
      "Invalid matrix dimensions. Cannot multiply " + dim0 + " matrix by " + dim1);
  }

  // delegate to numeric.js
  return numeric.dot(mXn, nXm);
}

function validateMatrix(mXn) {
  var mn = dim(mXn);
  var m = mn[0];
  var n = mn[1];

  if(m === 0) {
    throw new Error("InvalidArgument: matrix has 0 rows");
  }

  if(n === 0) {
    throw new Error("InvalidArgument: matrix has 0 columns");
  }

  var i, shouldBeN;
  for(i = 1; i < m; i++) {
    shouldBeN = mXn[i].length;
    if(shouldBeN !== n) {
      throw new Error("InvalidArgument: expected " + n + " elements in row: " + i);
    }
  }
}

exports.dim = dim;
exports.matrix = matrix;
exports.transpose = transpose;
exports.multiplyMatrices = multiplyMatrices;
exports.validateMatrix = validateMatrix;
