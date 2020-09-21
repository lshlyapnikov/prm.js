// @flow strict

import { assert } from "./utils"

import { type Vector } from "./vector"

export type Matrix<M: number, N: number, A> = {|
  +m: M,
  +n: N,
  +values: $ReadOnlyArray<$ReadOnlyArray<A>>
|}

export function emptyMatrix<M: number, N: number, A>(m: M, n: N, initValue: ?A): Matrix<M, N, A> {
  const values = new Array<Array<A>>(m)
  for (let i = 0; i < m; i++) {
    values[i] = new Array<A>(n)
  }
  if (null != initValue) {
    fillMatrix(m, n, values, initValue)
  }
  return { m, n, values }
}

function fillMatrix<M: number, N: number, A>(m: M, n: N, mXn: Array<Array<A>>, initValue: A): void {
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      mXn.values[i][j] = initValue
    }
  }
}

export function matrix<M: number, N: number, A>(
  m: M,
  n: N,
  values: $ReadOnlyArray<$ReadOnlyArray<A>>
): Matrix<M, N, A> {
  const result: Matrix<M, N, A> = { m, n, values }
  validateMatrix(result)
  return result
}

export function matrixFromVector<M: number, N: number, A>(as: Vector<M, Vector<N, A>>): Matrix<M, N, A> {
  const m: M = as.n
  const n: N = as.values[0].n
  const values: $ReadOnlyArray<$ReadOnlyArray<A>> = as.values.map((a) => a.values)
  return { m, n, values }
}

export function rowMatrix<N: number, A>(n: N, vector: $ReadOnlyArray<A>): Matrix<1, N, A> {
  return matrix(1, n, [vector])
}

// export function columnMatrix<T, M: number>(m: M, vector: Array<T>): Matrix<T, M, 1> {
//   const result: Matrix<T, 1, M> = rowMatrix(m, vector)
//   return transpose(result)
// }

export function validateMatrix<M: number, N: number, A>(mXn: Matrix<M, N, A>): void {
  const shouldBeM = mXn.values.length
  assert(
    () => shouldBeM == mXn.m,
    () => `Invalid matrix: expected ${mXn.m} rows, but got ${shouldBeM}`
  )
  for (let i = 0; i < mXn.m; i++) {
    const shouldBeN = mXn.values[i].length
    assert(
      () => shouldBeN == mXn.n,
      () => `Invalid matrix: expected ${mXn.n} elements/columns in row ${i}, but got ${shouldBeN}`
    )
  }
}
