// @flow strict
import { type Matrix, transpose } from "./linearAlgebra"

export class Prices {
  constructor(symbol: string, prices: Array<number>) {
    this.symbol = symbol
    this.prices = prices
  }
  symbol: string
  prices: Array<number>
}

export function createPriceMatrix(symbols: Array<string>, arr: Array<Prices>): Matrix<number> {
  const symbolToPricesMap: Map<string, Array<number>> = arr.reduce((map, p) => map.set(p.symbol, p.prices), new Map())

  var nXm: Matrix<number> = new Array(symbols.length)

  // need to keep the order of symbols in the provided symbols array
  for (let i = 0; i < symbols.length; i++) {
    const prices = symbolToPricesMap.get(symbols[i])
    if (prices != null) {
      nXm[i] = prices
    }
  }

  return transpose(nXm) // mXn
}
