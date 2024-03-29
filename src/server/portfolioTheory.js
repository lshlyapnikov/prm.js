/// Author: Leonid Shlyapnikov
/// LGPL Licensed
// @flow strict
const numeric = require("numeric")

import {
  type Matrix,
  type ReadOnlyMatrix,
  matrix,
  dim,
  multiplyMatrices,
  subtractMatrices,
  transpose,
  copyMatrixInto,
  isInvertableMatrix,
  inverseMatrix
} from "./linearAlgebra"
import { type PortfolioStats, createPortfolioStats } from "./portfolioStats"
import { logger } from "./utils"

const log = logger("portfolioTheory.js")

export class GlobalMinimumVarianceEfficientPortfolio {
  calculate(expectedRrNx1: ReadOnlyMatrix<number>, rrCovarianceNxN: ReadOnlyMatrix<number>): PortfolioStats {
    const weightsN = this.calculateWeights(rrCovarianceNxN)
    return createPortfolioStats(weightsN, expectedRrNx1, rrCovarianceNxN)
  }

  calculateWeights(returnRatesCovarianceNxN: ReadOnlyMatrix<number>): Array<number> {
    const n = dim(returnRatesCovarianceNxN)[0]
    const b = n + 1
    const matrixA = this._createMatrixA(returnRatesCovarianceNxN)
    const matrixB = this._createMatrixB(b)
    // $FlowIgnore[incompatible-call]
    const matrixZ = numeric.solve(matrixA, matrixB)
    return matrixZ.slice(0, b - 1)
  }

  _createMatrixA(returnRatesCovarianceNxN: ReadOnlyMatrix<number>): Matrix<number> {
    const n = dim(returnRatesCovarianceNxN)[0]
    const a = n + 1
    // $FlowIgnore[incompatible-call]
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

export const globalMinimumVarianceEfficientPortfolio: GlobalMinimumVarianceEfficientPortfolio =
  new GlobalMinimumVarianceEfficientPortfolio()

export class TangencyPortfolio {
  calculate(
    expectedReturnRatesNx1: ReadOnlyMatrix<number>,
    returnRatesCovarianceNxN: ReadOnlyMatrix<number>,
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
    expectedReturnRatesNx1: ReadOnlyMatrix<number>,
    returnRatesCovarianceNxN: ReadOnlyMatrix<number>,
    riskFreeReturnRate: number
  ): Array<number> {
    log.debug(`returnRatesCovarianceNxN: ${JSON.stringify(returnRatesCovarianceNxN)}`)
    if (!isInvertableMatrix(returnRatesCovarianceNxN)) {
      throw new Error(
        "Cannot calculate Tangency Portfolio. " +
          "Return rate covariance matrix (returnRatesCovarianceNxN) is NOT invertible. " +
          "Use numeric methods to calculate optimal portfolio."
      )
    }
    const n = dim(returnRatesCovarianceNxN)[0]
    const returnRatesCovarianceInvertedNxN = inverseMatrix(returnRatesCovarianceNxN)
    const riskFreeReturnRateNx1 = matrix(n, 1, riskFreeReturnRate)
    const muMinusRfNx1 = subtractMatrices(expectedReturnRatesNx1, riskFreeReturnRateNx1)
    const topNx1 = multiplyMatrices(returnRatesCovarianceInvertedNxN, muMinusRfNx1)
    const one1xN = matrix(1, n, 1)
    const bot1x1 = multiplyMatrices(one1xN, topNx1)
    const resultNx1 = numeric.div(topNx1, bot1x1[0][0])
    const weightsN: Array<number> = transpose(resultNx1)[0]
    return weightsN
  }
}

export const tangencyPortfolio: TangencyPortfolio = new TangencyPortfolio()

/**
 * See econ424/08.2 portfolioTheoryMatrix.pdf, p12, matrix formula 1.18.
 * A and B matrices are different from global minimum efficient portfolio.
 */
export class TargetReturnEfficientPortfolio {
  calculate(
    expectedReturnRatesNx1: ReadOnlyMatrix<number>,
    returnRatesCovarianceNxN: ReadOnlyMatrix<number>,
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
    expectedReturnRatesNx1: ReadOnlyMatrix<number>,
    returnRatesCovarianceNxN: ReadOnlyMatrix<number>,
    targetReturnRate: number
  ): Array<number> {
    const n = dim(returnRatesCovarianceNxN)[0]
    const b = n + 2
    const matrixA = this._createMatrixA(expectedReturnRatesNx1, returnRatesCovarianceNxN)
    const matrixB = this._createMatrixB(b, targetReturnRate)
    // $FlowIgnore[incompatible-call]
    const matrixZ = numeric.solve(matrixA, matrixB)
    const weightsN: Array<number> = matrixZ.slice(0, b - 2)
    return weightsN
  }

  _createMatrixA(
    expectedReturnRatesNx1: ReadOnlyMatrix<number>,
    returnRatesCovarianceNxN: ReadOnlyMatrix<number>
  ): Matrix<number> {
    const n = dim(returnRatesCovarianceNxN)[0]
    const a = n + 2
    // $FlowIgnore[incompatible-call]
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

export const targetReturnEfficientPortfolio: TargetReturnEfficientPortfolio = new TargetReturnEfficientPortfolio()

/**
 * econ424/08.2 portfolioTheoryMatrix.pdf, p.21
 * TODO: why 21? That is the number from the lecture... just a number of iterations?
 */
export class EfficientPortfolioFrontier {
  calculate(
    expectedRrNx1: ReadOnlyMatrix<number>,
    rrCovarianceNxN: ReadOnlyMatrix<number>,
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
    globalMinVarianceEpWeigthsN: $ReadOnlyArray<number>,
    maxReturnEpWeightsN: $ReadOnlyArray<number>,
    alpha: number
  ): Array<number> {
    const x = globalMinVarianceEpWeigthsN.map((n) => alpha * n)
    const y = maxReturnEpWeightsN.map((n) => (1 - alpha) * n)
    return numeric.add(x, y)
  }
}

export const efficientPortfolioFrontier: EfficientPortfolioFrontier = new EfficientPortfolioFrontier()
