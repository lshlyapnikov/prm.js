/// Author: Leonid Shlyapnikov
/// LGPL Licensed
// @flow strict
import {
  type Matrix,
  type ReadOnlyMatrix,
  matrix,
  multiplyMatrices,
  dim,
  validateMatrix,
  transpose
} from "./linearAlgebra"

export class PortfolioStats {
  constructor(weights: $ReadOnlyArray<number>, stdDev: number, expectedReturnRate: number) {
    this.weights = weights
    this.stdDev = stdDev
    this.expectedReturnRate = expectedReturnRate
  }
  weights: $ReadOnlyArray<number>
  stdDev: number
  expectedReturnRate: number
}

export function createPortfolioStats(
  weightsN: $ReadOnlyArray<number>,
  meanRrNx1: ReadOnlyMatrix<number>,
  rrCovarianceNxN: ReadOnlyMatrix<number>
): PortfolioStats {
  const weights1xN: ReadOnlyMatrix<number> = [weightsN]
  const expectedRr1x1: Matrix<number> = multiplyMatrices(weights1xN, meanRrNx1)
  const stdDev: number = portfolioStdDev(weights1xN, rrCovarianceNxN)

  return new PortfolioStats(weightsN, stdDev, expectedRr1x1[0][0])
}

export function meanValue(arr: Array<number>): number {
  if (0 === arr.length) {
    throw new Error("InvalidArgument: Array arr is empty")
  }
  const sum: number = arr.reduce((acc, a) => acc + a, 0)
  return sum / arr.length
}

/**
 * Calculates a vector of expected values (mean values).
 *
 * @param {Array} valuesMxN   M x N matrix with data sets in columns. Each dataset contains M elemetns, N datasets total.
 * @returns {Array}   Returns a vector of N elements (N x 1 matrix). Each element is an expected value for the
 *                    corresponding column in the matrix argument.
 */
export function mean(valuesMxN: Matrix<number>): Matrix<number> {
  if (0 === matrix.length) {
    throw new Error("InvalidArgument: matrix is empty")
  }

  var [m, n] = dim(valuesMxN)

  if (undefined === m || undefined === n) {
    throw new Error("InvalidArgument: argument valuesMxN has to be a matrix (2-dimensional array)")
  }

  const mu: Matrix<number> = matrix(n, 1, 0)

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      mu[j][0] += valuesMxN[i][j]
    }
  }

  for (let j = 0; j < n; j++) {
    mu[j][0] = mu[j][0] / m
  }

  return mu
}

/**
 * Calculates variance of a population or a sample.
 *
 * @param {Array} arr   Population or sample.
 * @param {bool} isPopulation   Optional parameter. If true, isPopulation variance returned, else sample variance.
 */
export function variance(arr: Array<number>, isPopulation: ?boolean): number {
  const mu: number = meanValue(arr)
  const length: number = arr.length
  const sum: number = arr.reduce((acc: number, a: number) => acc + Math.pow(a - mu, 2), 0)
  if (true === isPopulation) {
    return sum / length
  } else {
    return sum / (length - 1)
  }
}

export function covariance(valuesMxN: Matrix<number>, isPopulation: ?boolean): Matrix<number> {
  validateMatrix(valuesMxN)

  const [rowNum, colNum] = dim(valuesMxN)

  // create an empty result matrix (colNum x colNum)
  const result: Matrix<number> = matrix(colNum, colNum, 0)

  // calculate medians (Mx1 matrix)
  const muMx1: Matrix<number> = mean(valuesMxN)

  // calculate the covariance matrix

  const divisor: number = true === isPopulation ? rowNum : rowNum - 1

  // calculate the diagonal elements and the half that is below the diagonal
  for (let j = 0; j < colNum; j++) {
    for (let k = 0; k <= j; k++) {
      for (let i = 0; i < rowNum; i++) {
        result[j][k] += (valuesMxN[i][j] - muMx1[j][0]) * (valuesMxN[i][k] - muMx1[k][0])
      }
      result[j][k] = result[j][k] / divisor
    }
  }

  // copy the half from under the diagonal to the part that is above the diagonal
  for (let j = 0; j < colNum; j++) {
    for (let k = 0; k < j; k++) {
      result[k][j] = result[j][k]
    }
  }

  validateMatrix(result)

  // that's it, now we have a covariance matrix
  return result
}

/**
 * Calculates return rates for every period.
 *
 * @param {Array} prices
 * @returns {Array} return ratess for every price interval.
 */
export function calculateReturnRatesFromPrices(prices: Array<number>): Array<number> {
  if (0 === prices.length) {
    throw new Error("InvalidArgument: Array prices is empty")
  }

  var result: Array<number> = new Array(prices.length - 1)
  for (let i = 0; i < prices.length - 1; i++) {
    result[i] = prices[i + 1] / prices[i] - 1
  }

  return result
}

/**
 * Calculates return rates M x N matrix. Where M is the number of historical intervals
 * and N is the number of stocks in portfolio.
 *
 * @param {Array} priceMatrix   M x N matrix of prices. Stock prices in columns. N columns -- N stocks.
 * @returns {Array}  M-1 x N matrix of return rates.
 */
export function calculateReturnRatesFromPriceMatrix(priceMatrix: ReadOnlyMatrix<number>): Matrix<number> {
  const [m, n] = dim(priceMatrix)
  const result = matrix(m - 1, n)
  for (let i = 0; i < m - 1; i++) {
    for (let j = 0; j < n; j++) {
      result[i][j] = priceMatrix[i + 1][j] / priceMatrix[i][j] - 1
    }
  }
  return result
}

/**
 * Calculates portfolio's Return Rate Standard Deviation.
 *
 * @param {Array} weights1xN   vector of stock weights in the portfolio
 * @param {Array} covarianceNxN   portfolio covariance matrix.
 *
 * @return {Number}   Portfolio's Standard Deviation.
 */
export function portfolioStdDev(weights1xN: ReadOnlyMatrix<number>, covarianceNxN: ReadOnlyMatrix<number>): number {
  const transposedWeightsNx1 = transpose(weights1xN)
  const tmp1xN = multiplyMatrices(weights1xN, covarianceNxN)
  const tmp1x1 = multiplyMatrices(tmp1xN, transposedWeightsNx1)
  const result: number = Math.sqrt(tmp1x1[0][0])
  return result
}

export function loadPriceMatrix(
  loadHistoricalPricesFn: (string) => Array<number>,
  symbols: Array<string>
): Matrix<number> {
  if (0 === symbols.length) {
    throw new Error("InvalidArgument: symbols array is empty")
  }
  const n = symbols.length
  const transposedPriceMatrix: Matrix<number> = new Array(n)
  for (let i = 0; i < n; i++) {
    transposedPriceMatrix[i] = loadHistoricalPricesFn(symbols[i])
  }

  return transpose(transposedPriceMatrix)
}
