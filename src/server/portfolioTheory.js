/// Author: Leonid Shlyapnikov
/// LGPL Licensed
// @flow strict
import numeric from "numeric"
import {
  type Matrix,
  matrix,
  matrixFromArray,
  dim,
  multiplyMatrices,
  transpose,
  copyMatrixInto,
  isInvertableMatrix,
  inverseMatrix
} from "./linearAlgebra"
import { type PortfolioStats, createPortfolioStats } from "./portfolioStats"
import { logger, assert } from "./utils"

const log = logger("portfolioTheory.js")

export class GlobalMinimumVarianceEfficientPortfolio {
  calculate<N: number>(expectedRrNx1: Matrix<number, N, 1>, rrCovarianceNxN: Matrix<number, N, N>): PortfolioStats {
    const weightsN = this.calculateWeights(rrCovarianceNxN)
    return createPortfolioStats(weightsN, expectedRrNx1, rrCovarianceNxN)
  }

  calculateWeights<N: number>(returnRatesCovarianceNxN: Matrix<number, N, N>): Array<number> {
    const n: N = returnRatesCovarianceNxN.m
    const a = n + 1
    const b = n + 1
    const matrixA = this._createMatrixA(returnRatesCovarianceNxN, a)
    const matrixB = this._createMatrixB(b)
    const matrixZ = numeric.solve(matrixA.values, matrixB.values)
    return matrixZ.slice(0, b - 1)
  }

  _createMatrixA<N: number, A: number>(returnRatesCovarianceNxN: Matrix<number, N, N>, a: A): Matrix<number, A, A> {
    const n = returnRatesCovarianceNxN.m
    if (a != n + 1) {
      throw new Error(`IllegalArgument: expected a == n + 1, got a: ${a}, n: ${n}`)
    }
    const twoBySigmaNxN: Matrix<number, N, N> = matrixFromArray(n, n, numeric.mul(2, returnRatesCovarianceNxN.values))
    const matrixA: Matrix<number, A, A> = copyMatrixInto(twoBySigmaNxN, matrix(a, a, 0))
    for (let i = 0; i < a - 1; i++) {
      matrixA.values[a - 1][i] = 1
      matrixA.values[i][a - 1] = 1
    }
    return matrixA
  }

  _createMatrixB<B: number>(b: B): Matrix<number, B, 1> {
    const matrixB = matrix(b, 1, 0)
    matrixB.values[b - 1][0] = 1
    return matrixB
  }
}

export const globalMinimumVarianceEfficientPortfolio = new GlobalMinimumVarianceEfficientPortfolio()

export class TangencyPortfolio {
  calculate<N: number>(
    expectedReturnRatesNx1: Matrix<number, N, 1>,
    returnRatesCovarianceNxN: Matrix<number, N, N>,
    riskFreeReturnRate: number
  ): PortfolioStats {
    const weightsN: Array<number> = this.calculateWeights(
      expectedReturnRatesNx1,
      returnRatesCovarianceNxN,
      riskFreeReturnRate
    )
    return createPortfolioStats(weightsN, expectedReturnRatesNx1, returnRatesCovarianceNxN)
  }

  calculateWeights<N: number>(
    expectedReturnRatesNx1: Matrix<number, N, 1>,
    returnRatesCovarianceNxN: Matrix<number, N, N>,
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
    const muMinusRfNx1 = matrixFromArray(n, 1, numeric.sub(expectedReturnRatesNx1.values, riskFreeReturnRateNx1.values))
    const topNx1 = multiplyMatrices(returnRatesCovarianceInvertedNxN, muMinusRfNx1)
    const one1xN = matrix(1, n, 1)
    const bot1x1 = multiplyMatrices(one1xN, topNx1)
    const resultNx1: Matrix<number, N, 1> = matrixFromArray(n, 1, numeric.div(topNx1.values, bot1x1.values[0][0]))
    const weightsN: Array<number> = transpose(resultNx1).values[0]
    return weightsN
  }
}

export const tangencyPortfolio = new TangencyPortfolio()

/**
 * See econ424/08.2 portfolioTheoryMatrix.pdf, p12, matrix formula 1.18.
 * A and B matrices are different from global minimum efficient portfolio.
 */
export class TargetReturnEfficientPortfolio {
  calculate<N: number>(
    expectedReturnRatesNx1: Matrix<number, N, 1>,
    returnRatesCovarianceNxN: Matrix<number, N, N>,
    targetReturnRate: number
  ): PortfolioStats {
    const weightsN: Array<number> = this.calculateWeights(
      expectedReturnRatesNx1,
      returnRatesCovarianceNxN,
      targetReturnRate
    )
    return createPortfolioStats(weightsN, expectedReturnRatesNx1, returnRatesCovarianceNxN)
  }

  calculateWeights<N: number>(
    expectedReturnRatesNx1: Matrix<number, N, 1>,
    returnRatesCovarianceNxN: Matrix<number, N, N>,
    targetReturnRate: number
  ): Array<number> {
    const n: N = returnRatesCovarianceNxN.m
    const a = n + 2
    const b = n + 2
    const matrixA = this._createMatrixA(expectedReturnRatesNx1, returnRatesCovarianceNxN, a)
    const matrixB = this._createMatrixB(b, targetReturnRate)
    const matrixZ = numeric.solve(matrixA.values, matrixB.values)
    const weightsN: Array<number> = matrixZ.slice(0, b - 2)
    return weightsN
  }

  _createMatrixA<N: number, A: number>(
    expectedReturnRatesNx1: Matrix<number, N, 1>,
    returnRatesCovarianceNxN: Matrix<number, N, N>,
    a: A
  ): Matrix<number, A, A> {
    const n = returnRatesCovarianceNxN.m
    assert(
      () => a == n + 2,
      () => `InvalidArgument: expected a = n + 2, got a: ${a}, n: ${n}`
    )
    const twoBySigmaNxN = numeric.mul(2, returnRatesCovarianceNxN.values)
    var matrixA = matrix(a, a, 0)
    matrixA = copyMatrixInto(twoBySigmaNxN, matrixA)
    for (let i = 0; i < n; i++) {
      const r = expectedReturnRatesNx1.values[i][0]
      matrixA.values[n][i] = r
      matrixA.values[i][n] = r
    }
    for (let i = 0; i < n; i++) {
      matrixA.values[n + 1][i] = 1
      matrixA.values[i][n + 1] = 1
    }
    return matrixA
  }

  _createMatrixB<B: number>(b: B, targetReturnRate: number): Matrix<number, B, 1> {
    const matrixB: Matrix<number, B, 1> = matrix(b, 1, 0)
    matrixB.values[b - 2][0] = targetReturnRate
    matrixB.values[b - 1][0] = 1
    return matrixB
  }
}

export const targetReturnEfficientPortfolio = new TargetReturnEfficientPortfolio()

/**
 * econ424/08.2 portfolioTheoryMatrix.pdf, p.21
 * TODO: why 21? That is the number from the lecture... just a number of iterations?
 */
export class EfficientPortfolioFrontier {
  calculate<N: number>(
    expectedRrNx1: Matrix<number, N, 1>,
    rrCovarianceNxN: Matrix<number, N, N>,
    maxNum: number = 21
  ): Array<PortfolioStats> {
    const arr: Array<number> = expectedRrNx1.values.map((row) => row[0])
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
    const x: Array<number> = globalMinVarianceEpWeigthsN.map((n) => alpha * n)
    const y: Array<number> = maxReturnEpWeightsN.map((n) => (1 - alpha) * n)
    return numeric.add(x, y)
  }
}

export const efficientPortfolioFrontier = new EfficientPortfolioFrontier()

// TODO efficient portfolio frontier with no short sale: 09 portfoliotheorynoshortsalesslides.pdf, page 12
