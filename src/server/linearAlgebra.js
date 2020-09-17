/// Author: Leonid Shlyapnikov
/// LGPL Licensed
// @flow strict

// for some reason the current numeric.js implementation does not check matrix dimensions before multiplication.
// numeric.dot() does too many assumptions/deductions -- don't really like it. Want my functions to throw
// if vector is passed instead of matrix or if matrix dimensions do not allow multiplication.

import numeric from "numeric"
// export type Matrix<T> = Array<Array<T>>

export class Matrix<T, M: number, N: number> {
  constructor(m: M, n: N) {
    if (m <= 0) {
      throw new Error("InvalidArgument: invalid m: " + m)
    }
    if (n <= 0) {
      throw new Error("InvalidArgument: invalid n: " + n)
    }
    this.m = m
    this.n = n
    this.values = new Array<Array<T>>(m)
    for (let i = 0; i < m; i++) {
      this.values[i] = new Array<T>(n)
    }
  }

  set(xs: Array<Array<T>>): void {
    this.values = xs
    validateMatrix(this)
  }

  dim(): [M, N] {
    return [this.m, this.n]
  }

  values: Array<Array<T>>
  m: M // rows
  n: N // columns
}

export function matrix<T, M: number, N: number>(m: M, n: N, initialValue: ?T): Matrix<T, M, N> {
  const result: Matrix<T, M, N> = new Matrix(m, n)
  if (initialValue != null) {
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        result.values[i][j] = initialValue
      }
    }
  }
  return result
}

export function matrixFrom<A, M: number, N: number>(m: M, n: N, as: Array<Array<A>>): Matrix<A, M, N> {
  const result: Matrix<A, M, N> = new Matrix(m, n)
  result.set(as)
  return result
}

export function rowMatrix<T, N: number>(n: N, vector: Array<T>): Matrix<T, 1, N> {
  if (n != vector.length) {
    throw new Error(`InvalidArgument: ${n} != ${vector.length} `)
  }
  const result: Matrix<T, 1, N> = new Matrix(1, n)
  result.values[0] = vector
  return result
}

export function columnMatrix<T, M: number>(m: M, vector: Array<T>): Matrix<T, M, 1> {
  const result: Matrix<T, 1, M> = rowMatrix(m, vector)
  return transpose(result)
}

export function transpose<T, M: number, N: number>(matrixMxN: Matrix<T, M, N>): Matrix<T, N, M> {
  const resultNxM: Matrix<T, N, M> = new Matrix(matrixMxN.n, matrixMxN.m)
  for (let i = 0; i < matrixMxN.m; i++) {
    for (let j = 0; j < matrixMxN.n; j++) {
      resultNxM.values[j][i] = matrixMxN.values[i][j]
    }
  }
  return resultNxM
}

export function multiplyMatrices<M: number, N: number>(
  mXn: Matrix<number, M, N>,
  nXm: Matrix<number, N, M>
): Matrix<number, M, M> {
  return numeric.dot(mXn.values, nXm.values)
}

export function validateMatrix<T, M: number, N: number>(mXn: Matrix<T, M, N>): void {
  const shouldBeM = mXn.values.length
  if (shouldBeM != mXn.m) {
    throw new Error(`Invalid matrix: expected ${mXn.m} rows, but got ${shouldBeM}`)
  }

  for (let i = 1; i < mXn.m; i++) {
    const shouldBeN = mXn.values[i].length
    if (shouldBeN !== mXn.n) {
      throw new Error(`Invalid matrix: expected ${mXn.n} elements/columns in row ${i}, but got ${shouldBeN}`)
    }
  }
}

export function copyMatrix<T, M: number, N: number>(mXn: Matrix<T, M, N>): Matrix<T, M, N> {
  const result: Matrix<T, M, N> = new Matrix(mXn.m, mXn.n)
  for (let i = 0; i < mXn.m; i++) {
    for (let j = 0; j < mXn.n; j++) {
      result.values[i][j] = mXn.values[i][j]
    }
  }

  return result
}

export function copyMatrixInto<T, M: number, N: number>(
  mXn: Matrix<T, M, N>,
  outputMatrix: Matrix<T, M, N>
): Matrix<T, M, N> {
  for (let i = 0; i < mXn.m; i++) {
    for (let j = 0; j < mXn.n; j++) {
      outputMatrix.values[i][j] = mXn.values[i][j]
    }
  }
  return outputMatrix
}

export function inverseMatrix<N: number>(nXn: Matrix<number, N, N>): Matrix<number, N, N> {
  if (!isInvertableMatrix(nXn)) {
    throw new Error(`Cannot inverse given matrix`)
  }
  const result: Matrix<number, N, N> = new Matrix(nXn.m, nXn.n)
  result.set(numeric.inv(nXn.values))
  return result
}

export function isInvertableMatrix<N: number>(nXn: Matrix<number, N, N>): boolean {
  return nXn.m == nXn.n && numeric.det(nXn.values) != 0
}
