/// Author: Leonid Shlyapnikov
/// LGPL Licensed
// @flow strict
import { generateRandomWeightsMatrix } from "./utils"
import { type Matrix } from "./linearAlgebra"
import { type Vector, vector } from "./vector"
import {
  calculateReturnRatesFromPriceMatrix,
  mean,
  covariance,
  PortfolioStats,
  createPortfolioStats
} from "./portfolioStats"
import { Observable, from } from "rxjs"
import { toArray, flatMap, map } from "rxjs/operators"
import { type PriceArray, priceArray, createPriceMatrix } from "./priceMatrix"

export function mvef<N: number>(
  loadHistoricalPrices: (string) => Observable<number>,
  symbols: Vector<N, string>,
  numberOfRandomWeights: number
): Promise<Array<PortfolioStats>> {
  return _mvef(loadHistoricalPrices, symbols, numberOfRandomWeights).toPromise()
}

function _mvef<N: number>(
  loadHistoricalPrices: (string) => Observable<number>,
  symbols: Vector<N, string>,
  numberOfRandomWeights: number
): Observable<Array<PortfolioStats>> {
  if (0 == symbols.n) {
    return Observable.throw(new Error("InvalidArgument: symbols array is empty"))
  }

  if (numberOfRandomWeights <= 0) {
    return Observable.throw(new Error("InvalidArgument: numberOfRandomWeights is <= 0"))
  }

  const m: number = numberOfRandomWeights
  const n: number = symbols.n

  return from(symbols.values).pipe(
    flatMap((s: string) => loadHistoricalPricesAsArray(loadHistoricalPrices, s)),
    toArray(),
    map((arr: Array<PriceArray>) => {
      const priceMatrix: Matrix<number> = createPriceMatrix(symbols, vector(symbols.n, arr))
      const weightsMatrix: Matrix<number> = generateRandomWeightsMatrix(m, n)
      return mvefFromHistoricalPrices(weightsMatrix, priceMatrix)
    })
  )
}

function loadHistoricalPricesAsArray(fn: (string) => Observable<number>, symbol: string): Observable<PriceArray> {
  return fn(symbol).pipe(
    toArray(),
    map((prices: Array<number>) => priceArray(symbol, prices))
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
export function mvefFromHistoricalPrices(weightsMxN: Matrix<number>, pricesKxN: Matrix<number>): Array<PortfolioStats> {
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
  weightsMxN: Matrix<number>,
  returnRatesKxN: Matrix<number>
): Array<PortfolioStats> {
  // K x 1
  const expReturnRatesNx1 = mean(returnRatesKxN)
  // N x N
  const covarianceNxN = covariance(returnRatesKxN)

  // TODO: this could return Observable<PortfolioStats> instead of Array<PortfolioStats>
  return weightsMxN.map((weightsN: Array<number>) => createPortfolioStats(weightsN, expReturnRatesNx1, covarianceNxN))
}
