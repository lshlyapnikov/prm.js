// @flow strict

import { assert } from "./utils"

export type Vector<N: number, A> = {|
  +n: N,
  +values: Array<A>
|}

export function vector<N: number, A>(n: N, initValue: ?A): Vector<N, A> {
  const values = new Array<A>(n)
  if (null != initValue) {
    for (let i = 0; i < n; i++) {
      values[i] = initValue
    }
  }
  return { n, values }
}

export function vectorFrom<N: number, A>(n: N, values: Array<A>): Vector<N, A> {
  const result: Vector<N, A> = { n, values }
  validateVector(result)
  return result
}

export function validateVector<N: number, A>(as: Vector<N, A>): void {
  assert(
    () => as.values.length == as.n,
    () => `Invalid vector: expected ${as.n} elements, but got ${as.values.length}`
  )
}

export function map<N: number, A, B>(as: Vector<N, A>, f: (A) => B): Vector<N, B> {
  const n = as.n
  const values: Array<B> = as.values.map(f)
  return { n, values }
}

export function fold<N: number, A, B>(zero: B, fn: (b: B, a: A, index: number) => B, as: Vector<N, A>): B {
  var acc: B = zero
  for (let i = 0; i < as.n; i++) {
    const a: A = as.values[i]
    acc = fn(acc, a, i)
  }
  return acc
}
