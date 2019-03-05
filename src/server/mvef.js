/// Author: Leonid Shlyapnikov
/// LGPL Licencsed
// @flow strict

import { generateRandomWeightsMatrix } from "./utils"
import { type Matrix, transpose, dim, multiplyMatrices } from "./linearAlgebra"
import {
  calculateReturnRatesFromPriceMatrix,
  mean,
  covariance,
  portfolioStdDev,
  PortfolioStats,
  createPortfolioStats
} from "./portfolioStats"
import { Observable, Subscriber, from } from "rxjs"
import { toArray, flatMap, map } from "rxjs/operators"
import { Prices, createPriceMatrix } from "./priceMatrix"

/**
 * Generates portfolio MVEF for the specified symbols, using
 * historical prices provided by loadHistoricalPrices function.
 *
 * @param {function} loadHistoricalPrices   function(symbol) provider of historical prices,
 *                                          takes a symbol,  returns a promise to an array of
 *                                          historical prices
 * @param {Array} symbols   The stock symbols you are interested in,
 * @param {Number} numberOfRandomWeights   Number of random stock weights to be  used to
 *                                         to generate MVEF.
 * @return {Object}   portfolioExpReturnRates: {Array}, portfolioStdDevs: {Array}.
 */
export function mvef(
  loadHistoricalPrices: string => Observable<number>,
  symbols: Array<string>,
  numberOfRandomWeights: number
): Observable<Array<PortfolioStats>> {
  if (0 === symbols.length) {
    return Observable.throw(new Error("InvalidArgument: symbols array is empty"))
  }

  if (numberOfRandomWeights <= 0) {
    return Observable.throw(new Error("InvalidArgument: numberOfRandomWeights is <= 0"))
  }

  const m: number = numberOfRandomWeights
  const n: number = symbols.length

  return from(symbols).pipe(
    flatMap((s: string) => loadHistoricalPricesAsArray(loadHistoricalPrices, s)),
    toArray(),
    map((arr: Array<Prices>) => {
      const priceMatrix: Matrix<number> = createPriceMatrix(symbols, arr)
      const weightsMatrix: Matrix<number> = generateRandomWeightsMatrix(m, n)
      return mvefFromHistoricalPrices(weightsMatrix, priceMatrix)
    })
  )

  // Q.allSettled(promises)
  //   .then(function(promises) {
  //     var transposedPriceMatrix = new Array(n)
  //     var p
  //     for (var i = 0; i < n; i++) {
  //       p = promises[i]
  //       if (p.state === "fulfilled") {
  //         transposedPriceMatrix[i] = p.value
  //       } else {
  //         deferred.reject(new Error("Could not load symbol: " + symbols[i] + ", i: " + i))
  //       }
  //     }
  //     return transposedPriceMatrix
  //   })
  //   .then(function(transposedPriceMatrix) {
  //     return mvefFromHistoricalPrices(generateRandomWeightsMatrix(m, n), transpose(transposedPriceMatrix))
  //   })
  //   .then(function(result) {
  //     deferred.resolve(result)
  //   })
  //   .done()
}

function loadHistoricalPricesAsArray(fn: string => Observable<number>, symbol: string): Observable<Prices> {
  return fn(symbol).pipe(
    toArray(),
    map((prices: Array<number>) => new Prices(symbol, prices))
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

  const m = dim(weightsMxN)[0]
  //var n = la.dim(weightsMxN)[1]

  // MxN x Nx1 = Nx1
  const portfolioExpReturnRatesMx1 = multiplyMatrices(weightsMxN, expReturnRatesNx1)
  const portfolioExpReturnRateArr = transpose(portfolioExpReturnRatesMx1)[0]

  return weightsMxN.map((weights1xN: Array<number>) =>
    createPortfolioStats(weights1xN, portfolioExpReturnRatesMx1, covarianceNxN)
  )

  // var weights1xN
  // var portfolioStdDevArr = new Array(m)
  // for (let i = 0; i < m; i++) {
  //   const weights1xN: Array<number> = weightsMxN[i]
  //   portfolioStdDevArr[i] = portfolioStdDev([weights1xN], covarianceNxN)
  // }

  // if (portfolioExpReturnRateArr.length !== m) {
  //   throw new Error("InvalidState: portfolioExpReturnRateArr.length !== " + m)
  // }

  // if (portfolioStdDevArr.length !== m) {
  //   throw new Error("InvalidState: portfolioStdDevArr.length !== " + m)
  // }

  // var result = Object.create(portfolioStats.PortfolioStats)
  // result.weights = weightsMxN
  // result.expectedReturnRate = portfolioExpReturnRateArr
  // result.stdDev = portfolioStdDevArr
  // return result
}
