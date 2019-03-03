/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

// @flow strict
// for some reason the current numeric.js implementation does not check matrix dimensions before multiplication.
// numeric.dot() does too many assumptions/deductions -- don't really like it. Want my functions to throw
// if vector is passed instead of matrix or if matrix dimensions do not allow multiplication.

import numeric from "numeric"
export type Matrix<T> = Array<Array<T>>

export function dim(matrixMxN: Matrix<number>): [number, number] {
  var m = matrixMxN.length
  var n = matrixMxN[0].length
  if (typeof n !== "number") {
    throw new Error("InvalidArgument: argument matrix does not have columns")
  }
  return [m, n]
}

export function matrix(m: number, n: number, initialValue: ?number): Matrix<number> {
  if (m <= 0) {
    throw new Error("InvalidArgument: invalid m: " + m)
  }
  if (n <= 0) {
    throw new Error("InvalidArgument: invalid n: " + n)
  }

  var result: Matrix<number> = new Array(m)

  for (let i = 0; i < m; i++) {
    result[i] = new Array(n)
  }

  if (initialValue != null) {
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        result[i][j] = initialValue
      }
    }
  }

  return result
}

export function rowMatrix(vector: Array<number>): Matrix<number> {
  return [vector]
}

export function columnMatrix(vector: Array<number>): Matrix<number> {
  return transpose(rowMatrix(vector))
}

// TODO(lshlyapnikov) will be slow, C++ Node plugin???
export function transpose(matrixMxN: Matrix<number>): Matrix<number> {
  var dimensions = dim(matrixMxN)
  var m = dimensions[0]
  var n = dimensions[1]

  var resultNxM: Matrix<number> = matrix(n, m)
  for (var i = 0; i < m; i++) {
    for (var j = 0; j < n; j++) {
      resultNxM[j][i] = matrixMxN[i][j]
    }
  }

  return resultNxM
}

// TODO(lshlyapnikov) will be slow, C++ Node plugin??, map reduce?? 3rd party library???
export function multiplyMatrices(mXn: Matrix<number>, nXm: Matrix<number>): Matrix<number> {
  var dim0: [number, number] = dim(mXn)
  var dim1: [number, number] = dim(nXm)

  if (dim0[1] !== dim1[0]) {
    throw new Error(
      "InvalidArgument: Invalid matrix dimensions. Cannot multiply " +
        JSON.stringify(dim0) +
        " matrix by " +
        JSON.stringify(dim1)
    )
  }

  return numeric.dot(mXn, nXm)
}

export function multiplyVectors(v0: Array<number>, v1: Array<number>): Matrix<number> {
  var d0: number = v0.length
  var d1: number = v1.length
  if (d0 !== d1) {
    throw new Error("InvalidArgument: vectors have different dimensions: " + d0 + " and " + d1)
  }
  return numeric.dotVV(v0, v1)
}

export function validateMatrix(mXn: Matrix<number>): void {
  const [m, n] = dim(mXn)
  if (m === 0) {
    throw new Error("InvalidArgument: matrix has 0 rows")
  }
  if (n === 0) {
    throw new Error("InvalidArgument: matrix has 0 columns")
  }

  for (let i = 1; i < m; i++) {
    let shouldBeN = mXn[i].length
    if (shouldBeN !== n) {
      throw new Error("InvalidArgument: expected " + n + " elements in row: " + i)
    }
  }
}

export function copyMatrix(mXn: Matrix<number>): Matrix<number> {
  validateMatrix(mXn)
  var mn: [number, number] = dim(mXn)
  var m = mn[0]
  var n = mn[1]

  var result: Matrix<number> = matrix(m, n, NaN)
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      result[i][j] = Number(mXn[i][j])
    }
  }

  return result
}

export function copyMatrixInto(mXn: Matrix<number>, outputMatrix: Matrix<number>): Matrix<number> {
  validateMatrix(mXn)
  const [m, n] = dim(mXn)
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      outputMatrix[i][j] = Number(mXn[i][j])
    }
  }
  return outputMatrix
}

export function inverseMatrix(mXn: Matrix<number>): Matrix<number> {
  return numeric.inv(mXn)
}
