/// Author: Leonid Shlyapnikov
/// LGPL Licensed
// @flow strict
import { generateRandomWeightsMatrix } from "./utils"
import { type Matrix, type ReadOnlyMatrix } from "./linearAlgebra"
import { type Vector } from "./vector"
import {
  calculateReturnRatesFromPriceMatrix,
  mean,
  covariance,
  PortfolioStats,
  createPortfolioStats
} from "./portfolioStats"
import { Observable, from, throwError, of } from "rxjs"
import { toArray, flatMap, map } from "rxjs/operators"
import { type SymbolPrices, maxPriceArrayLength, symbolPrices, createPriceMatrix } from "./priceMatrix"

export function mvef<M: number, N: number>(
  loadHistoricalPrices: (string) => Observable<number>,
  symbols: Vector<N, string>,
  numberOfRandomWeights: M,
  allowShortSales: boolean
): Promise<Array<PortfolioStats>> {
  return _mvef(loadHistoricalPrices, symbols, numberOfRandomWeights, allowShortSales).toPromise()
}

function _mvef<M: number, N: number>(
  loadHistoricalPrices: (string) => Observable<number>,
  symbols: Vector<N, string>,
  numberOfRandomWeights: M,
  allowShortSales: boolean
): Observable<Array<PortfolioStats>> {
  if (0 == symbols.n) {
    return throwError(new Error("InvalidArgument: symbols array is empty"))
  }

  if (numberOfRandomWeights <= 0) {
    return throwError(new Error("InvalidArgument: numberOfRandomWeights is <= 0"))
  }

  const m: number = numberOfRandomWeights
  const n: number = symbols.n

  return from(symbols.values).pipe(
    flatMap((s: string) => loadHistoricalPricesAsArray(loadHistoricalPrices, s)),
    toArray(),
    flatMap((symbolPrices: Array<SymbolPrices>) => {
      const k: number = maxPriceArrayLength(symbolPrices)
      const priceMatrixKxN = createPriceMatrix(symbols, symbolPrices, k)
      if (priceMatrixKxN.success) {
        const weightsMatrixMxN: Matrix<number> = generateRandomWeightsMatrix(m, n, 0, allowShortSales)
        const kXn: ReadOnlyMatrix<number> = priceMatrixKxN.value.values
        const result: Array<PortfolioStats> = mvefFromHistoricalPrices(weightsMatrixMxN, kXn)
        return of(result)
      } else {
        return throwError(priceMatrixKxN.error)
      }
    })
  )
}

function loadHistoricalPricesAsArray(fn: (string) => Observable<number>, symbol: string): Observable<SymbolPrices> {
  return fn(symbol).pipe(
    toArray(),
    map((prices: Array<number>) => symbolPrices(symbol, prices))
  )
}

/**
 * Calculates portfolio MVEF using provided price matrix.
 *
 * @param {Array} weightsMxN     M x N matrix of weights, where
 *                               M is the number of random draws,
 *                               N is the number of stocks in portfolio
 * @param {Array} pricesKxN      K x N price matrix, where
 *                               K is the number of historical prices,
 *                               N is the number of stocks in portfolio
 * @return {Object}   portfolioExpReturnRates: {Array}, portfolioStdDevs: {Array}.
 */
export function mvefFromHistoricalPrices(
  weightsMxN: ReadOnlyMatrix<number>,
  pricesKxN: ReadOnlyMatrix<number>
): Array<PortfolioStats> {
  // K x N (actually K-1 x N)
  const returnRatesKxN: Matrix<number> = calculateReturnRatesFromPriceMatrix(pricesKxN)
  return mvefFromHistoricalReturnRates(weightsMxN, returnRatesKxN)
}

/**
 * Calculates portfolio MVEF using provided price matrix.
 *
 * @param {Array} weightsMxN       M x N matrix of weights, where
 *                                 M is the number of random draws,
 *                                 N is the number of stocks in portfolio
 * @param {Array} returnRatesKxN   K x N return rates matrix, where
 *                                 K is the number of historical intervals,
 *                                 N is the number of stocks in portfolio
 * @return {Object}   portfolioExpReturnRates: {Array}, portfolioStdDevs: {Array}.
 */
export function mvefFromHistoricalReturnRates(
  weightsMxN: ReadOnlyMatrix<number>,
  returnRatesKxN: ReadOnlyMatrix<number>
): Array<PortfolioStats> {
  // K x 1
  const expReturnRatesNx1 = mean(returnRatesKxN)
  // N x N
  const covarianceNxN = covariance(returnRatesKxN)

  // TODO: this could return Observable<PortfolioStats> instead of Array<PortfolioStats>
  return weightsMxN.map((weightsN: $ReadOnlyArray<number>) =>
    createPortfolioStats(weightsN, expReturnRatesNx1, covarianceNxN)
  )
}
