/// Author: Leonid Shlyapnikov
/// LGPL Licencsed
// @flow strict
import { type Matrix, matrix, dim, multiplyMatrices, transpose, copyMatrixInto } from "./linearAlgebra"
import { type PortfolioStats, createPortfolioStats } from "./portfolioStats"
const numeric = require("numeric")

export class GlobalMinimumVarianceEfficientPortfolio {
  calculate(expectedRrNx1: Matrix<number>, rrCovarianceNxN: Matrix<number>): PortfolioStats {
    const weightsN = this.calculateWeights(rrCovarianceNxN)
    return createPortfolioStats(weightsN, expectedRrNx1, rrCovarianceNxN)
  }

  calculateWeights(returnRatesCovarianceNxN: Matrix<number>): Array<number> {
    const n = dim(returnRatesCovarianceNxN)[0]
    const b = n + 1
    const matrixA = this._createMatrixA(returnRatesCovarianceNxN)
    const matrixB = this._createMatrixB(b)
    const matrixZ = numeric.solve(matrixA, matrixB)
    return matrixZ.slice(0, b - 1)
  }

  _createMatrixA(returnRatesCovarianceNxN: Matrix<number>): Matrix<number> {
    const n = dim(returnRatesCovarianceNxN)[0]
    const a = n + 1
    const twoBySigmaNxN = numeric.mul(2, returnRatesCovarianceNxN)
    const matrixA = copyMatrixInto(twoBySigmaNxN, matrix(a, a, 0))
    for (let i = 0; i < a - 1; i++) {
      matrixA[a - 1][i] = 1
      matrixA[i][a - 1] = 1
    }
    return matrixA
  }

  _createMatrixB(b: number): Matrix<number> {
    const matrixB = matrix(b, 1, 0)
    matrixB[b - 1][0] = 1
    return matrixB
  }
}

export const globalMinimumVarianceEfficientPortfolio = new GlobalMinimumVarianceEfficientPortfolio()

export class TangencyPortfolio {
  calculate(
    expectedReturnRatesNx1: Matrix<number>,
    returnRatesCovarianceNxN: Matrix<number>,
    riskFreeReturnRate: number
  ): PortfolioStats {
    const weightsN: Array<number> = this.calculateWeights(
      expectedReturnRatesNx1,
      returnRatesCovarianceNxN,
      riskFreeReturnRate
    )
    return createPortfolioStats(weightsN, expectedReturnRatesNx1, returnRatesCovarianceNxN)
  }

  calculateWeights(
    expectedReturnRatesNx1: Matrix<number>,
    returnRatesCovarianceNxN: Matrix<number>,
    riskFreeReturnRate: number
  ): Array<number> {
    const n = dim(returnRatesCovarianceNxN)[0]
    const returnRatesCovarianceInvertedNxN = numeric.inv(returnRatesCovarianceNxN)
    const riskFreeReturnRateNx1 = matrix(n, 1, riskFreeReturnRate)
    const muMinusRfNx1 = numeric.sub(expectedReturnRatesNx1, riskFreeReturnRateNx1)
    const topNx1 = multiplyMatrices(returnRatesCovarianceInvertedNxN, muMinusRfNx1)
    const one1xN = matrix(1, n, 1)
    const bot1x1 = multiplyMatrices(one1xN, topNx1)
    const resultNx1 = numeric.div(topNx1, bot1x1[0][0])
    const weightsN: Array<number> = transpose(resultNx1)[0]
    return weightsN
  }
}

export const tangencyPortfolio = new TangencyPortfolio()

/**
 * See econ424/08.2 portfolioTheoryMatrix.pdf, p12, matrix formula 1.18.
 * A and B matrices are different from global minimum efficient portfolio.
 */
export class TargetReturnEfficientPortfolio {
  calculate(
    expectedReturnRatesNx1: Matrix<number>,
    returnRatesCovarianceNxN: Matrix<number>,
    targetReturnRate: number
  ): PortfolioStats {
    const weightsN: Array<number> = this.calculateWeights(
      expectedReturnRatesNx1,
      returnRatesCovarianceNxN,
      targetReturnRate
    )
    return createPortfolioStats(weightsN, expectedReturnRatesNx1, returnRatesCovarianceNxN)
  }

  calculateWeights(
    expectedReturnRatesNx1: Matrix<number>,
    returnRatesCovarianceNxN: Matrix<number>,
    targetReturnRate: number
  ): Array<number> {
    const n = dim(returnRatesCovarianceNxN)[0]
    const b = n + 2
    const matrixA = this._createMatrixA(expectedReturnRatesNx1, returnRatesCovarianceNxN)
    const matrixB = this._createMatrixB(b, targetReturnRate)
    const matrixZ = numeric.solve(matrixA, matrixB)
    const weightsN: Array<number> = matrixZ.slice(0, b - 2)
    return weightsN
  }

  _createMatrixA(expectedReturnRatesNx1: Matrix<number>, returnRatesCovarianceNxN: Matrix<number>): Matrix<number> {
    const n = dim(returnRatesCovarianceNxN)[0]
    const a = n + 2
    const twoBySigmaNxN = numeric.mul(2, returnRatesCovarianceNxN)
    var matrixA = matrix(a, a, 0)
    matrixA = copyMatrixInto(twoBySigmaNxN, matrixA)
    for (let i = 0; i < n; i++) {
      var r = expectedReturnRatesNx1[i][0]
      matrixA[n][i] = r
      matrixA[i][n] = r
    }
    for (let i = 0; i < n; i++) {
      matrixA[n + 1][i] = 1
      matrixA[i][n + 1] = 1
    }
    return matrixA
  }

  _createMatrixB(b: number, targetReturnRate: number): Matrix<number> {
    const matrixB = matrix(b, 1, 0)
    matrixB[b - 2][0] = targetReturnRate
    matrixB[b - 1][0] = 1
    return matrixB
  }
}

export const targetReturnEfficientPortfolio = new TargetReturnEfficientPortfolio()

/**
 * econ424/08.2 portfolioTheoryMatrix.pdf, p.21
 * TODO: why 21? That is the number from the lecture... just a number of iterations?
 */
export class EfficientPortfolioFrontier {
  calculate(
    expectedRrNx1: Matrix<number>,
    rrCovarianceNxN: Matrix<number>,
    maxNum: number = 21
  ): Array<PortfolioStats> {
    const arr: Array<number> = expectedRrNx1.map((row) => row[0])
    const maxExpectedRr: number = Math.max(...arr)

    const globalMinVarianceEp = createPortfolioStats(
      globalMinimumVarianceEfficientPortfolio.calculateWeights(rrCovarianceNxN),
      expectedRrNx1,
      rrCovarianceNxN
    )

    const maxReturnEp: PortfolioStats = targetReturnEfficientPortfolio.calculate(
      expectedRrNx1,
      rrCovarianceNxN,
      maxExpectedRr
    )

    const result: Array<PortfolioStats> = new Array(maxNum)

    for (let i = 0, alpha = 1; i < maxNum; i++, alpha -= 0.1) {
      result[i] = createPortfolioStats(
        this._calculateEfficientPortfolioWeights(globalMinVarianceEp.weights, maxReturnEp.weights, alpha),
        expectedRrNx1,
        rrCovarianceNxN
      )
    }

    return result
  }

  _calculateEfficientPortfolioWeights(
    globalMinVarianceEpWeigthsN: Array<number>,
    maxReturnEpWeightsN: Array<number>,
    alpha: number
  ) {
    const x = globalMinVarianceEpWeigthsN.map((n) => alpha * n)
    const y = maxReturnEpWeightsN.map((n) => (1 - alpha) * n)
    return numeric.add(x, y)
  }
}

export const efficientPortfolioFrontier = new EfficientPortfolioFrontier()

// TODO efficient portfolio frontier with no short sale: 09 portfoliotheorynoshortsalesslides.pdf, page 12
