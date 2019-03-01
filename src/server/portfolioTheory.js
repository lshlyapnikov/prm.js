/// Author: Leonid Shlyapnikov
/// LGPL Licencsed
// @flow strict
import { type Matrix, matrix, dim, multiplyMatrices, transpose, copyMatrixInto } from "./linearAlgebra"
import { type PortfolioStats, createPortfolioStats } from "./portfolioStats"
const numeric = require("numeric")

export class GlobalMinimumVarianceEfficientPortfolio {
  /**
   * Calculates Global Minimum Variance Portfolio.
   *
   * @param {Array.<Array.<number>>} expectedRrNx1    N x 1 expected/mean return rates matrix, where
   * @param {Array.<Array.<number>>} rrCovarianceNxN
   */
  calculate(expectedRrNx1: Matrix<number>, rrCovarianceNxN: Matrix<number>): PortfolioStats {
    const weightsN = this.calculateWeightsFromReturnRatesCovariance(rrCovarianceNxN)
    return createPortfolioStats(weightsN, expectedRrNx1, rrCovarianceNxN)
  }

  /**
   * @param returnRatesCovarianceNxN
   * @returns {Array.<number>} an array of N elements. Every element is a stock weight in the portfolio.
   */
  calculateWeightsFromReturnRatesCovariance(returnRatesCovarianceNxN: Matrix<number>): Array<number> {
    var n = dim(returnRatesCovarianceNxN)[0]
    var b = n + 1
    var matrixA = this.createMatrixA(returnRatesCovarianceNxN)
    var matrixB = this.createMatrixB(b)
    var matrixZ = numeric.solve(matrixA, matrixB)
    return matrixZ.slice(0, b - 1)
  }

  createMatrixA(returnRatesCovarianceNxN: Matrix<number>): Matrix<number> {
    var n = dim(returnRatesCovarianceNxN)[0]
    var a = n + 1
    var twoBySigmaNxN = numeric.mul(2, returnRatesCovarianceNxN)
    var matrixA = matrix(a, a, 0)
    matrixA = copyMatrixInto(twoBySigmaNxN, matrixA)
    var i
    for (i = 0; i < a - 1; i++) {
      matrixA[a - 1][i] = 1
      matrixA[i][a - 1] = 1
    }
    return matrixA
  }

  createMatrixB(b: number): Matrix<number> {
    var matrixB = matrix(b, 1, 0)
    matrixB[b - 1][0] = 1
    return matrixB
  }
}

export const globalMinimumVarianceEfficientPortfolio = new GlobalMinimumVarianceEfficientPortfolio()

export class TangencyPortfolio {
  /**
   * @param expectedReturnRatesNx1
   * @param returnRatesCovarianceNxN
   * @param riskFreeReturnRate
   * @returns {Array} an array of N elements. Every element is a stock weight in the portfolio.
   */
  calculate(expectedReturnRatesNx1: Matrix<number>, returnRatesCovarianceNxN: Matrix<number>,
    riskFreeReturnRate: number): Array<number> {
    const n = dim(returnRatesCovarianceNxN)[0]
    const returnRatesCovarianceInvertedNxN = numeric.inv(returnRatesCovarianceNxN)
    const riskFreeReturnRateNx1 = matrix(n, 1, riskFreeReturnRate)
    const muMinusRfNx1 = numeric.sub(expectedReturnRatesNx1, riskFreeReturnRateNx1)
    const topNx1 = multiplyMatrices(returnRatesCovarianceInvertedNxN, muMinusRfNx1)
    const one1xN = matrix(1, n, 1)
    const bot1x1 = multiplyMatrices(one1xN, topNx1)
    const resultNx1 = numeric.div(topNx1, bot1x1[0][0])
    return transpose(resultNx1)[0]
  }
}

export const tangencyPortfolio = new TangencyPortfolio()

/**
 * See econ424/08.2 portfolioTheoryMatrix.pdf, p12, matrix formula 1.18.
 * A and B matrices are different from global minimum efficient portfolio.
 */
export class TargetReturnEfficientPortfolio {

  calculate(expectedReturnRatesNx1: Matrix<number>, returnRatesCovarianceNxN: Matrix<number>,
    targetReturnRate: number): Array<number> {
    const n = dim(returnRatesCovarianceNxN)[0]
    const b = n + 2
    const matrixA = this.createMatrixA(expectedReturnRatesNx1, returnRatesCovarianceNxN)
    const matrixB = this.createMatrixB(b, targetReturnRate)
    const matrixZ = numeric.solve(matrixA, matrixB)
    return matrixZ.slice(0, b - 2)
  }

  createMatrixA(expectedReturnRatesNx1: Matrix<number>, returnRatesCovarianceNxN: Matrix<number>): Matrix<number> {
    var n = dim(returnRatesCovarianceNxN)[0]
    var a = n + 2
    var twoBySigmaNxN = numeric.mul(2, returnRatesCovarianceNxN)
    var matrixA = matrix(a, a, 0)
    matrixA = copyMatrixInto(twoBySigmaNxN, matrixA)
    var i
    for (i = 0; i < n; i++) {
      var r = expectedReturnRatesNx1[i][0]
      matrixA[n][i] = r
      matrixA[i][n] = r
    }
    for (i = 0; i < n; i++) {
      matrixA[n + 1][i] = 1
      matrixA[i][n + 1] = 1
    }
    return matrixA
  }

  createMatrixB(b: number, targetReturnRate: number) {
    const matrixB = matrix(b, 1, 0)
    matrixB[b - 2][0] = targetReturnRate
    matrixB[b - 1][0] = 1
    return matrixB
  }
}

export const targetReturnEfficientPortfolio = new TargetReturnEfficientPortfolio()

/**
 * econ424/08.2 portfolioTheoryMatrix.pdf, p.21
 */
export class EfficientPortfolioFrontier {
  calculate(expectedRrNx1: Matrix<number>, rrCovarianceNxN: Matrix<number>): Array<PortfolioStats> {
    const arr: Array<number> = expectedRrNx1.map(row => row[0])
    const maxExpectedRr: number = Math.max(...arr)

    const globalMinVarianceEp = createPortfolioStats(
      globalMinimumVarianceEfficientPortfolio.calculateWeightsFromReturnRatesCovariance(rrCovarianceNxN),
      expectedRrNx1,
      rrCovarianceNxN)

    const maxReturnEp = createPortfolioStats(
      targetReturnEfficientPortfolio.calculate(expectedRrNx1, rrCovarianceNxN, maxExpectedRr),
      expectedRrNx1,
      rrCovarianceNxN)

    const maxNum = 21 // TODO: why 21? That is the number from the lecture... just a number of iterations?
    const result: Array<PortfolioStats> = new Array(maxNum)

    for (let i = 0, alpha = 1; i < maxNum; i++, alpha -= 0.1) {
      result[i] = createPortfolioStats(
        this._calculateEfficientPortfolioWeights(globalMinVarianceEp.weights, maxReturnEp.weights, alpha),
        expectedRrNx1,
        rrCovarianceNxN)
    }

    return result
  }

  _calculateEfficientPortfolioWeights(globalMinVarianceEpWeigthsN: Array<number>, maxReturnEpWeightsN: Array<number>,
    alpha: number) {
    const x = globalMinVarianceEpWeigthsN.map(n => alpha * n)
    const y = maxReturnEpWeightsN.map(n => (1 - alpha) * n)
    return numeric.add(x, y)
  }
}

export const efficientPortfolioFrontier = new EfficientPortfolioFrontier()

// TODO efficient portfolio frontier with no short sale: 09 portfoliotheorynoshortsalesslides.pdf, page 12
