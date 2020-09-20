// @flow strict

import { assert } from "./utils"

export type Vector<A, N: number> = {|
  +n: N,
  +values: Array<A>
|}

export function vector<A, N: number>(n: N, initValue: ?A): Vector<A, N> {
  const values = new Array<A>(n)
  if (null != initValue) {
    for (let i = 0; i < n; i++) {
      values[i] = initValue
    }
  }
  return { n, values }
}

export function vectorFrom<A, N: number>(n: N, values: Array<A>): Vector<A, N> {
  const result: Vector<A, N> = { n, values }
  validateVector(result)
  return result
}

export function validateVector<A, N: number>(as: Vector<A, N>): void {
  assert(
    () => as.values.length == as.n,
    () => `Invalid vector: expected ${as.n} elements, but got ${as.values.length}`
  )
}

export function map<A, B, N: number>(as: Vector<A, N>, f: (A) => B): Vector<B, N> {
  const n = as.n
  const values: Array<B> = as.values.map(f)
  return { n, values }
}

export function fold<A, B, N: number>(zero: B, fn: (b: B, a: A, index: number) => B, as: Vector<A, N>): B {
  var acc: B = zero
  for (let i = 0; i < as.n; i++) {
    const a: A = as.values[i]
    acc = fn(acc, a, i)
  }
  return acc
}
