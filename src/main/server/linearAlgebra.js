/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

// for some reason the current numeric.js implementation does not check matrix dimensions before multiplication.
// numeric.dot() does too many assumptions/deductions -- don't really like it. Want my functions to throw
// if vector is passed instead of matrix or if matrix dimensions do not allow multiplication.

const numeric = require("numeric")
const _ = require("underscore")

function dim(matrixMxN) {
  if(_.isUndefined(matrixMxN)) {
    throw new Error("InvalidArgument: argument matrixMxN is undefined")
  }

  if (!_.isArray(matrixMxN)) {
    throw new Error("InvalidArgument: argument matrixMxN has to be an Array")
  }

  var m = matrixMxN.length
  if(!_.isNumber(m)) {
    throw new Error("InvalidArgument: argument matrixMxN does not have rows")
  }

  if (!_.isArray(matrixMxN[0])) {
    throw new Error("InvalidArgument: matrixMxN is not a matrix")
  }

  var n = matrixMxN[0].length
  if(!_.isNumber(n)) {
    throw new Error("InvalidArgument: argument matrix does not have columns")
  }

  return [m, n]
}

function matrix(m, n, initialValue) {
  if(!_.isNumber(m) || m <= 0) {
    throw new Error("InvalidArgument: invalid m: " + m)
  }
  if(!_.isNumber(n) || n <= 0) {
    throw new Error("InvalidArgument: invalid n: " + n)
  }

  var result = new Array(m)
  var i, j

  for(i = 0; i < m; i++) {
    result[i] = new Array(n)
  }

  if(!_.isUndefined(initialValue)) {
    for(i = 0; i < m; i++) {
      for(j = 0; j < n; j++) {
        result[i][j] = initialValue
      }
    }
  }

  return result
}

function rowMatrix(vector) {
  if (!_.isArray(vector)) {
    throw new Error("InvalidArgument: argument vector has to be an Array")
  }
  return [vector]
}

function columnMatrix(vector) {
  return transpose(rowMatrix(vector))
}

// TODO(lshlyapnikov) will be slow, C++ Node plugin???
function transpose(matrixMxN) {
  var dimensions = dim(matrixMxN)
  var m = dimensions[0]
  var n = dimensions[1]

  var resultNxM = matrix(n, m)
  for(var i = 0; i < m; i++) {
    for(var j = 0; j < n; j++) {
      resultNxM[j][i] = matrixMxN[i][j]
    }
  }

  return resultNxM
}

// TODO(lshlyapnikov) will be slow, C++ Node plugin??, map reduce?? 3rd party library???
function multiplyMatrices(mXn, nXm) {
  if(_.isUndefined(mXn)) {
    throw new Error("InvalidArgument: Argument mXn is undefined")
  }

  if(_.isUndefined(nXm)) {
    throw new Error("InvalidArgument: Argument nXm is undefined")
  }

  var dim0 = dim(mXn)
  var dim1 = dim(nXm)

  if(dim0[1] !== dim1[0]) {
    throw new Error("InvalidArgument: Invalid matrix dimensions. Cannot multiply " + dim0 + " matrix by " + dim1)
  }

  return numeric.sdotMM(mXn, nXm)
}

function multiplyVectors(v0, v1) {
  var d0 = v0.length
  var d1 = v1.length
  if (_.isArray(v0[0])) {
    throw new Error("InvalidArgument: 1st argument has to be a vector")
  }
  if (_.isArray(v1[0])) {
    throw new Error("InvalidArgument: 2nd argument has to be a vector")
  }
  if (d0 !== d1) {
    throw new Error("InvalidArgument: vectors have different dimensions: " + d0 + " and " + d1)
  }
  return numeric.dotVV(v0, v1)
}

function validateMatrix(mXn) {
  var mn = dim(mXn)
  var m = mn[0]
  var n = mn[1]

  if(m === 0) {
    throw new Error("InvalidArgument: matrix has 0 rows")
  }

  if(n === 0) {
    throw new Error("InvalidArgument: matrix has 0 columns")
  }

  for(var i = 1; i < m; i++) {
    var shouldBeN = mXn[i].length
    if(shouldBeN !== n) {
      throw new Error("InvalidArgument: expected " + n + " elements in row: " + i)
    }
  }
}

exports.copyMatrix = function(mXn) {
  validateMatrix(mXn)
  var mn = dim(mXn)
  var m = mn[0]
  var n = mn[1]

  var result = matrix(m, n, NaN)
  for (var i = 0; i < m; i++) {
    for (var j = 0; j < n; j++) {
      result[i][j] = Number(mXn[i][j])
    }
  }

  return result
}

exports.copyMatrixInto = function(mXn, outputMatrix) {
  validateMatrix(mXn)
  var mn = dim(mXn)
  var m = mn[0]
  var n = mn[1]

  for (var i = 0; i < m; i++) {
    for (var j = 0; j < n; j++) {
      outputMatrix[i][j] = Number(mXn[i][j])
    }
  }

  return outputMatrix
}

exports.inverseMatrix = function(mXn) {
  return numeric.inv(mXn)
}

exports.dim = dim
exports.matrix = matrix
exports.rowMatrix = rowMatrix
exports.columnMatrix = columnMatrix
exports.transpose = transpose
exports.multiplyMatrices = multiplyMatrices
exports.multiplyVectors = multiplyVectors
exports.validateMatrix = validateMatrix
