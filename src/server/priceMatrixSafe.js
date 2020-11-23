// @flow strict
import { type Matrix, matrix, transpose } from "./matrix.js"
import { type Vector } from "./vector"
import { type Result, equalArrays } from "./utils"

export type SymbolPrices = {|
  +symbol: string,
  +prices: $ReadOnlyArray<number>
|}

export function symbolPrices(symbol: string, prices: Array<number>): SymbolPrices {
  return { symbol, prices }
}

export function maxPriceArrayLength(arr: Array<SymbolPrices>): number {
  const result: number = arr.reduce((z, ps) => Math.max(z, ps.prices.length), 0)
  return result
}

export function createPriceMatrix<M: number, N: number>(
  symbols: Vector<N, string>,
  symbolPrices: Vector<M, SymbolPrices>
): Result<Matrix<M, N, number>> {
  const m: M = symbolPrices.n
  const n: N = symbols.n
  if (m <= 0) {
    return { success: false, error: new Error(`Cannot build a price matrix. m: ${m}.`) }
  }
  if (n <= 0) {
    return { success: false, error: new Error(`Cannot build a price matrix. n: ${n}.`) }
  }

  const invalidPrices: $ReadOnlyArray<SymbolPrices> = findInvalidPriceArray(symbolPrices)

  if (invalidPrices.length > 0) {
    const badSymbols: Array<string> = invalidPrices.map((p) => p.symbol)
    const error = new Error(
      `Cannot build a price matrix. Invalid number of prices for symbols: ${JSON.stringify(badSymbols)}. ` +
        `All symbols must have the same number of price entries: ${m}.`
    )
    return { success: false, error }
  }

  const symbols2: $ReadOnlyArray<string> = symbolPrices.values.map((p) => p.symbol)
  if (!equalArrays(symbols.values, symbols2)) {
    const error = new Error(
      `Wrong order: ${JSON.stringify(symbols.values)} must be equal to ${JSON.stringify(symbols2)}`
    )
    return { success: false, error }
  }

  const nXm: Array<$ReadOnlyArray<number>> = new Array(n)

  for (let i = 0; i < n; i++) {
    const priceArray: SymbolPrices = symbolPrices[i]
    nXm[i] = priceArray.prices
  }

  const mXn: Matrix<M, N, number> = transpose(matrix(n, m, nXm))
  return { success: true, value: mXn }
}

// returns Array of invalid Prices or empty Array
function findInvalidPriceArray<N: number>(array: Vector<N, SymbolPrices>): $ReadOnlyArray<SymbolPrices> {
  const expectedLength: N = array.n
  function collectInvalidPrices(z: $ReadOnlyArray<SymbolPrices>, p: SymbolPrices): $ReadOnlyArray<SymbolPrices> {
    if (p.prices.length != expectedLength) {
      return z.concat(p)
    } else {
      return z
    }
  }
  const invalidPrices: $ReadOnlyArray<SymbolPrices> = array.values.reduce(collectInvalidPrices, [])
  return invalidPrices
}
