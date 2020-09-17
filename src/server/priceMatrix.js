// @flow strict
import { Matrix, matrixFrom, transpose } from "./linearAlgebra"

export class Prices {
  constructor(symbol: string, prices: Array<number>) {
    this.symbol = symbol
    this.prices = prices
  }
  symbol: string
  prices: Array<number>
}

export function createPriceMatrix<M: number, N: number>(
  m: M,
  n: N,
  symbols: Array<string>,
  arr: Array<Prices>
): Matrix<number, M, N> {
  const symbolToPricesMap: Map<string, Array<number>> = arr.reduce((map, p) => map.set(p.symbol, p.prices), new Map())

  var nXm: Array<number> = new Array(symbols.length)

  // need to keep the order of symbols in the provided symbols array
  for (let i = 0; i < symbols.length; i++) {
    const prices: Array<number> = symbolToPricesMap.get(symbols[i])
    if (prices != null) {
      nXm[i] = prices
    }
  }

  return transpose(matrixFrom(n, m, nXm)) // mXn
}
