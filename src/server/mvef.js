/// Author: Leonid Shlyapnikov
/// LGPL Licensed
// @flow strict
import { generateRandomWeightsMatrix } from "./utils"
import { type Matrix } from "./linearAlgebra"
import {
  calculateReturnRatesFromPriceMatrix,
  mean,
  covariance,
  PortfolioStats,
  createPortfolioStats
} from "./portfolioStats"
import { Observable, from, of } from "rxjs"
import { toArray, flatMap, map } from "rxjs/operators"
import { type SymbolPrices, symbolPrices, createPriceMatrix, maxPriceArrayLength } from "./priceMatrix"
import { type Vector } from "./vector"

export function mvef<N: number, M: number>(
  loadHistoricalPrices: (string) => Observable<number>,
  symbols: Vector<string, N>,
  numberOfRandomWeights: M
): Promise<Array<PortfolioStats>> {
  return _mvef(loadHistoricalPrices, symbols, numberOfRandomWeights).toPromise()
}

function _mvef<N: number, M: number>(
  loadHistoricalPrices: (string) => Observable<number>,
  symbols: Vector<string, N>,
  numberOfRandomWeights: M
): Observable<Array<PortfolioStats>> {
  if (0 == symbols.n) {
    return Observable.throw(new Error("InvalidArgument: symbols array is empty"))
  }

  if (numberOfRandomWeights <= 0) {
    return Observable.throw(new Error("InvalidArgument: numberOfRandomWeights is <= 0"))
  }

  const m: M = numberOfRandomWeights
  const n: N = symbols.n

  return from(symbols.values).pipe(
    flatMap((s: string) => loadHistoricalPricesAsArray(loadHistoricalPrices, s)),
    toArray(),
    flatMap((arr: Array<SymbolPrices>) => {
      const priceMatrix = createPriceMatrix(symbols, arr, maxPriceArrayLength(arr))
      if (priceMatrix.success) {
        const weightsMatrix: Matrix<number, M, N> = generateRandomWeightsMatrix(m, n)
        return of(mvefFromHistoricalPrices(weightsMatrix, priceMatrix.value))
      } else {
        return Observable.throw(priceMatrix.error)
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
export function mvefFromHistoricalPrices<M: number, N: number, K: number>(
  weightsMxN: Matrix<number, M, N>,
  pricesKxN: Matrix<number, K, N>
): Array<PortfolioStats> {
  // K x N (actually K-1 x N)
  const returnRatesKxN = calculateReturnRatesFromPriceMatrix(pricesKxN, pricesKxN.m - 1)
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
export function mvefFromHistoricalReturnRates<M: number, N: number, K: number>(
  weightsMxN: Matrix<number, M, N>,
  returnRatesKxN: Matrix<number, K, N>
): Array<PortfolioStats> {
  // K x 1
  const expReturnRatesNx1 = mean(returnRatesKxN)
  // N x N
  const covarianceNxN = covariance(returnRatesKxN)

  return weightsMxN.values.map((weightsN: Array<number>) =>
    createPortfolioStats(weightsN, expReturnRatesNx1, covarianceNxN)
  )
}
