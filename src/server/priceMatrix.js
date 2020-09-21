// @flow strict
import { type Matrix, transpose } from "./linearAlgebra"
import { type Vector } from "./vector"

export type PriceArray = {|
  symbol: string,
  values: Array<number>
|}

export function priceArray(symbol: string, values: Array<number>): PriceArray {
  return { symbol, values }
}

export function createPriceMatrix<N: number>(
  symbols: Vector<N, string>,
  symbolPrices: Vector<N, PriceArray>
): Matrix<number> {
  const symbolToPricesMap: Map<string, Array<number>> = symbolPrices.values.reduce(
    (map, p) => map.set(p.symbol, p.values),
    new Map()
  )

  var nXm: Matrix<number> = new Array(symbols.n)

  // need to keep the order of symbols in the provided symbols array
  for (let i = 0; i < symbols.n; i++) {
    const prices = symbolToPricesMap.get(symbols.values[i])
    if (prices != null) {
      nXm[i] = prices
    }
  }

  return transpose(nXm) // mXn
}
