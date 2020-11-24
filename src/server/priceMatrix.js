// @flow strict
import { type Matrix, matrix, transpose } from "./matrix.js"
import { type Vector } from "./vector"
import { type Result, success, failure, equalArrays } from "./utils"

export type SymbolPrices = {|
  +symbol: string,
  +prices: $ReadOnlyArray<number>
|}

export function symbolPrices(symbol: string, prices: $ReadOnlyArray<number>): SymbolPrices {
  return { symbol, prices }
}

export function createPriceMatrix<M: number, N: number>(
  symbols: Vector<N, string>,
  symbolPrices: $ReadOnlyArray<SymbolPrices>,
  m: M
): Result<Matrix<M, N, number>> {
  if (m <= 0) {
    return { success: false, error: new Error(`Cannot build a price matrix. m: ${m}.`) }
  }

  const n: N = symbols.n
  if (n <= 0) {
    return { success: false, error: new Error(`Cannot build a price matrix. n: ${n}.`) }
  }

  const orderOfSymbolsIsTheSame: Result<{}> = checkOrderOfSymbols(symbols, symbolPrices)
  if (!orderOfSymbolsIsTheSame.success) {
    return failure(orderOfSymbolsIsTheSame.error)
  }

  const allPriceArraysAreValid: Result<{}> = checkPriceArrays(m, symbolPrices)
  if (!allPriceArraysAreValid.success) {
    return failure(allPriceArraysAreValid.error)
  }

  const nXm: Array<$ReadOnlyArray<number>> = new Array(n)

  for (let i = 0; i < n; i++) {
    const priceArray: SymbolPrices = symbolPrices[i]
    nXm[i] = priceArray.prices
  }

  const mXn: Matrix<M, N, number> = transpose(matrix(n, m, nXm))
  return success(mXn)
}

function checkPriceArrays<M: number>(expectedLength: M, priceArrays: $ReadOnlyArray<SymbolPrices>): Result<{}> {
  function collectInvalidPrices(z: $ReadOnlyArray<SymbolPrices>, p: SymbolPrices): $ReadOnlyArray<SymbolPrices> {
    if (p.prices.length != expectedLength) {
      return z.concat(p)
    } else {
      return z
    }
  }

  const invalidPriceArrays: $ReadOnlyArray<SymbolPrices> = priceArrays.reduce(collectInvalidPrices, [])
  if (invalidPriceArrays.length > 0) {
    const badSymbols: $ReadOnlyArray<string> = invalidPriceArrays.map((p) => p.symbol)
    const error = new Error(
      `Cannot build a price matrix. Invalid number of prices for symbols: ${JSON.stringify(badSymbols)}. ` +
        `All symbols must have the same number of price entries: ${expectedLength}.`
    )
    return failure(error)
  } else {
    return success({})
  }
}

function checkOrderOfSymbols<N: number>(
  symbols: Vector<N, string>,
  symbolPrices: $ReadOnlyArray<SymbolPrices>
): Result<{}> {
  const symbols2: $ReadOnlyArray<string> = symbolPrices.map((p) => p.symbol)
  if (equalArrays(symbols.values, symbols2)) {
    return { success: true, value: {} }
  } else {
    const error = new Error(
      `The order of symbols has changed from: ${JSON.stringify(symbols.values)} to: ${JSON.stringify(symbols2)}.`
    )
    return { success: false, error }
  }
}

export function maxPriceArrayLength(arr: $ReadOnlyArray<SymbolPrices>): number {
  const result: number = arr.reduce((z, ps) => Math.max(z, ps.prices.length), 0)
  return result
}
