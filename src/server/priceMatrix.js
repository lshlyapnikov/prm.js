// @flow strict
import { type Matrix, matrixFromArray, transpose } from "./linearAlgebra"
import { type Vector } from "./vector"
import { type Result, equalArrays } from "./utils"

export type SymbolPrices = {|
  +symbol: string,
  +prices: Array<number>
|}

export function symbolPrices(symbol: string, prices: Array<number>): SymbolPrices {
  return { symbol, prices }
}

export function maxPriceArrayLength(arr: Array<SymbolPrices>): number {
  const result: number = arr.reduce((z, ps) => Math.max(z, ps.prices.length), 0)
  return result
}

export function createPriceMatrix<M: number, N: number>(
  symbols: Vector<string, N>,
  symbolPrices: Array<SymbolPrices>,
  m: M
): Result<Matrix<number, M, N>> {
  if (m <= 0) {
    const badSymbols: Array<string> = symbols.values
    const error = new Error(
      `Cannot build a price matrix. m: ${m}. No prices loaded for all provided symbols: ${JSON.stringify(badSymbols)}.`
    )
    return { success: false, error }
  }

  const invalidPrices: Array<SymbolPrices> = findInvalidPriceArray(symbolPrices, m)

  if (invalidPrices.length > 0) {
    const badSymbols: Array<string> = invalidPrices.map((p) => p.symbol)
    const error = new Error(
      `Cannot build a price matrix. Invalid number of prices for symbols: ${JSON.stringify(badSymbols)}. ` +
        `All symbols must have the same number of price entries: ${m}.`
    )
    return { success: false, error }
  }

  const symbols2: Array<string> = symbolPrices.map((p) => p.symbol)
  if (!equalArrays(symbols.values, symbols2)) {
    const error = new Error(
      `Wrong order: ${JSON.stringify(symbols.values)} must be equal to ${JSON.stringify(symbols2)}`
    )
    return { success: false, error }
  }

  const n = symbols.n
  const nXm: Array<Array<number>> = new Array(n)

  for (let i = 0; i < n; i++) {
    const priceArray: SymbolPrices = symbolPrices[i]
    nXm[i] = priceArray.prices
  }

  const mXn: Matrix<number, M, N> = transpose(matrixFromArray(n, m, nXm))
  return { success: true, value: mXn }
}

// returns Array of invalid Prices or empty Array
function findInvalidPriceArray(array: Array<SymbolPrices>, expectedLength: number): Array<SymbolPrices> {
  function collectInvalidPrices(z: Array<SymbolPrices>, p: SymbolPrices): Array<SymbolPrices> {
    if (p.prices.length != expectedLength) {
      return z.concat(p)
    } else {
      return z
    }
  }

  const invalidPrices: Array<SymbolPrices> = array.reduce(collectInvalidPrices, [])

  return invalidPrices
}
