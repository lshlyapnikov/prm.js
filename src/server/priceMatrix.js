// @flow strict
import { type Matrix, transpose } from "./linearAlgebra"
import { type Vector } from "./vector"

export class Prices {
  constructor(symbol: string, prices: Array<number>) {
    this.symbol = symbol
    this.prices = prices
  }
  symbol: string
  prices: Array<number>
}

export function createPriceMatrix<N: number>(symbols: Vector<N, string>, arr: Array<Prices>): Matrix<number> {
  const symbolToPricesMap: Map<string, Array<number>> = arr.reduce((map, p) => map.set(p.symbol, p.prices), new Map())

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
