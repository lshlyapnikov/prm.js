/// Author: Leonid Shlyapnikov
/// LGPL Licensed
// @flow strict

// for some reason the current numeric.js implementation does not check matrix dimensions before multiplication.
// numeric.dot() does too many assumptions/deductions -- don't really like it. Want my functions to throw
// if vector is passed instead of matrix or if matrix dimensions do not allow multiplication.

import numeric from "numeric"

import { type Vector } from "./vector"

export type Matrix<T, M: number, N: number> = {|
  +m: M,
  +n: N,
  +values: Array<Array<T>>
|}

export function matrix<A, M: number, N: number>(m: M, n: N, initValue: ?A): Matrix<A, M, N> {
  const result = emptyMatrix(m, n)
  if (null != initValue) {
    fillMatrix(result, initValue)
  }
  return result
}

function emptyMatrix<A, M: number, N: number>(m: M, n: N): Matrix<A, M, N> {
  const values = new Array<Array<A>>(m)
  for (let i = 0; i < m; i++) {
    values[i] = new Array<A>(n)
  }
  return { m, n, values }
}

function fillMatrix<A, M: number, N: number>(mXn: Matrix<A, M, N>, initValue: A): void {
  for (let i = 0; i < mXn.m; i++) {
    for (let j = 0; j < mXn.n; j++) {
      mXn.values[i][j] = initValue
    }
  }
}

export function matrixFromArray<A, M: number, N: number>(m: M, n: N, values: Array<Array<A>>): Matrix<A, M, N> {
  const result: Matrix<A, M, N> = { m, n, values }
  validateMatrix(result)
  return result
}

export function matrixFromVector<A, M: number, N: number>(as: Vector<Vector<A, N>, M>): Matrix<A, M, N> {
  const m: M = as.n
  const n: N = as.values[0].n
  const values: Array<Array<A>> = as.values.map((a) => a.values)
  return { m, n, values }
}

export function rowMatrix<T, N: number>(n: N, vector: Array<T>): Matrix<T, 1, N> {
  if (n != vector.length) {
    throw new Error(`InvalidArgument: ${n} != ${vector.length} `)
  }
  return matrixFromArray(1, n, [vector])
}

export function columnMatrix<T, M: number>(m: M, vector: Array<T>): Matrix<T, M, 1> {
  const result: Matrix<T, 1, M> = rowMatrix(m, vector)
  return transpose(result)
}

export function transpose<T, M: number, N: number>(matrixMxN: Matrix<T, M, N>): Matrix<T, N, M> {
  const resultNxM: Matrix<T, N, M> = matrix(matrixMxN.n, matrixMxN.m)
  for (let i = 0; i < matrixMxN.m; i++) {
    for (let j = 0; j < matrixMxN.n; j++) {
      resultNxM.values[j][i] = matrixMxN.values[i][j]
    }
  }
  return resultNxM
}

export function multiplyMatrices<M: number, N: number, K: number>(
  mXn: Matrix<number, M, N>,
  nXk: Matrix<number, N, K>
): Matrix<number, M, K> {
  const m: M = mXn.m
  const k: K = nXk.n
  const mXk: Array<Array<number>> = numeric.dot(mXn.values, nXk.values)
  return matrixFromArray(m, k, mXk)
}

export function validateMatrix<T, M: number, N: number>(mXn: Matrix<T, M, N>): void {
  const shouldBeM = mXn.values.length
  if (shouldBeM != mXn.m) {
    throw new Error(`Invalid matrix: expected ${mXn.m} rows, but got ${shouldBeM}`)
  }

  for (let i = 0; i < mXn.m; i++) {
    const shouldBeN = mXn.values[i].length
    if (shouldBeN !== mXn.n) {
      throw new Error(`Invalid matrix: expected ${mXn.n} elements/columns in row ${i}, but got ${shouldBeN}`)
    }
  }
}

export function copyMatrix<T, M: number, N: number>(mXn: Matrix<T, M, N>): Matrix<T, M, N> {
  const result: Matrix<T, M, N> = matrix(mXn.m, mXn.n)
  for (let i = 0; i < mXn.m; i++) {
    for (let j = 0; j < mXn.n; j++) {
      result.values[i][j] = mXn.values[i][j]
    }
  }
  return result
}

export function copyMatrixInto<T, M: number, N: number, K: number, L: number>(
  mXn: Matrix<T, M, N>,
  outputMatrix: Matrix<T, K, L>
): Matrix<T, K, L> {
  for (let i = 0; i < mXn.m; i++) {
    for (let j = 0; j < mXn.n; j++) {
      outputMatrix.values[i][j] = mXn.values[i][j]
    }
  }
  return outputMatrix
}

// export function copyMatrixInto(mXn: Matrix<number>, outputMatrix: Matrix<number>): Matrix<number> {
//   validateMatrix(mXn)
//   const [m, n] = dim(mXn)
//   for (let i = 0; i < m; i++) {
//     for (let j = 0; j < n; j++) {
//       outputMatrix[i][j] = Number(mXn[i][j])
//     }
//   }
//   return outputMatrix
// }

export function inverseMatrix<N: number>(nXn: Matrix<number, N, N>): Matrix<number, N, N> {
  if (!isInvertableMatrix(nXn)) {
    throw new Error(`Cannot inverse given matrix`)
  }
  const arr: Array<Array<number>> = numeric.inv(nXn.values)
  const result: Matrix<number, N, N> = matrixFromArray(nXn.n, nXn.n, arr)
  return result
}

export function isInvertableMatrix<N: number>(nXn: Matrix<number, N, N>): boolean {
  return nXn.m == nXn.n && numeric.det(nXn.values) != 0
}

export function dim<A, M: number, N: number>(mXn: Matrix<A, M, N>): [M, N] {
  return [mXn.m, mXn.n]
}

export function dimA<A>(mXn: Array<Array<A>>): [number, number] {
  return [mXn.length, mXn[0].length]
}

export function sumMatrixElements<M: number, N: number>(mXn: Matrix<number, M, N>): number {
  return numeric.sum(mXn.values)
}
