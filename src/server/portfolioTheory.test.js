// @flow strict
/* global describe, it */

import * as assert from "assert"
import * as numeric from "numeric"

import {
  PortfolioStats,
  portfolioStdDev,
  calculateReturnRatesFromPriceMatrix,
  covariance,
  mean
} from "./portfolioStats"
import { type Matrix, columnMatrix, matrix, multiplyMatrices, transpose, dim } from "./linearAlgebra"
import * as pTheory from "./portfolioTheory"
import * as utils from "./utils"
import * as testData from "./testData"

const log = utils.logger("portfolioTheoryTest")

describe("pTheory", () => {
  // numbers taken from econ424/08.2 portfolioTheoryMatrix.pdf, p. 4, example 2
  // MSFT, NORD, SBUX

  const expectedRr3x1: Matrix<number> = columnMatrix([0.0427, 0.0015, 0.0285])

  const rrCovariance3x3: Matrix<number> = [[0.01, 0.0018, 0.0011], [0.0018, 0.0109, 0.0026], [0.0011, 0.0026, 0.0199]]

  const riskFreeRr: number = 0.005
  const globalMinVariancePortfolio = new PortfolioStats([0.4411, 0.3656, 0.1933], 0.07267607, 0.02489184)

  describe("Global Minimum Variance Portfolio", () => {
    it("should calculate global min variance portfolio from return rate covariance matrix", () => {
      const actualWeights = pTheory.globalMinimumVarianceEfficientPortfolio.calculateWeightsFromReturnRatesCovariance(
        rrCovariance3x3
      )
      log.debug("actualWeights: " + numeric.prettyPrint(actualWeights) + "\n")
      assert.deepEqual(numeric.dim(actualWeights), [3])
      utils.setArrayElementsScale(actualWeights, 4)
      assert.deepEqual(actualWeights, globalMinVariancePortfolio.weights)

      var actualWeights1x3 = [actualWeights]
      var actualStdDev = portfolioStdDev(actualWeights1x3, rrCovariance3x3)
      log.debug("actualStdDev: " + actualStdDev)
      assert.equal(actualStdDev.toFixed(8), globalMinVariancePortfolio.stdDev)

      var portfolioRr = multiplyMatrices(actualWeights1x3, expectedRr3x1)
      assert.equal(portfolioRr[0][0].toFixed(4), globalMinVariancePortfolio.expectedReturnRate.toFixed(4))
    })
    it("should calculate global min variance portfolio for NYX and INTC using historic prices", () => {
      const expectedPortfolio = new PortfolioStats([0.1127, 0.8873], 0.0737, 0.0064)
      const priceMatrixMxN = transpose([testData.NYX, testData.INTC])
      const returnRatesKxN = calculateReturnRatesFromPriceMatrix(priceMatrixMxN)
      const expectedRrNx1 = mean(returnRatesKxN)
      const rrCovarianceNxN = covariance(returnRatesKxN)

      var actualPortfolio = pTheory.globalMinimumVarianceEfficientPortfolio.calculate(expectedRrNx1, rrCovarianceNxN)

      assert.deepEqual(utils.newArrayWithScale(actualPortfolio.weights, 4), expectedPortfolio.weights)
      assert.equal(actualPortfolio.expectedReturnRate.toFixed(4), expectedPortfolio.expectedReturnRate)
      assert.equal(actualPortfolio.stdDev.toFixed(4), expectedPortfolio.stdDev)
    })
    describe("#createMatrixA", () => {
      function testCreateMatrixA(rrCov) {
        var n = dim(rrCov)[0]
        var a = n + 1

        var matrixA = pTheory.globalMinimumVarianceEfficientPortfolio.createMatrixA(rrCov)

        log.debug("matrixA: \n" + numeric.prettyPrint(matrixA) + "\n")

        assert.deepEqual(dim(matrixA), [a, a])
        var i, j
        for (i = 0; i < n; i++) {
          for (j = 0; j < n; j++) {
            assert.equal(matrixA[i][j], 2 * rrCov[i][j])
          }
        }
        for (i = 0; i < a - 1; i++) {
          assert.equal(matrixA[a - 1][i], 1)
          assert.equal(matrixA[i][a - 1], 1)
        }
        assert.equal(matrixA[a - 1][a - 1], 0)
      }

      it("should create 4x4 A matrix from 3x3 return rate covariance matrix", () => {
        testCreateMatrixA(numeric.random([3, 3]))
      })
      it("should create 5x5 A matrix from 4x4 return rate covariance matrix", () => {
        testCreateMatrixA(numeric.random([4, 4]))
      })
      it("should create 10x10 A matrix from 9x9 return rate covariance matrix", () => {
        testCreateMatrixA(numeric.random([9, 9]))
      })
    })
  })
  describe("Tangency Portfolio", () => {
    it("should calculate tangency portfolio from return rate covariance matrix", () => {
      var expectedTangencyPortfolioWeights = [1.0268, -0.3263, 0.2994]
      var actualWeights = pTheory.tangencyPortfolio.calculate(expectedRr3x1, rrCovariance3x3, riskFreeRr)
      assert.deepEqual(utils.newArrayWithScale(actualWeights, 4), expectedTangencyPortfolioWeights)
    })
  })
  describe("Efficient Portfolio with Target Return", () => {
    it("should create expected matrix A", () => {
      const expectedRr3x1 = columnMatrix([1, 2, 3])
      const rrCovMatrix3x3 = [[10, 11, 12], [20, 21, 22], [30, 31, 32]]
      const expectedMatrixA = [
        [20, 22, 24, 1, 1],
        [40, 42, 44, 2, 1],
        [60, 62, 64, 3, 1],
        [1, 2, 3, 0, 0],
        [1, 1, 1, 0, 0]
      ]
      var actualMatrixA = pTheory.targetReturnEfficientPortfolio.createMatrixA(expectedRr3x1, rrCovMatrix3x3)
      assert.deepEqual(actualMatrixA, expectedMatrixA)
    })
    it("should create expected matrix B", () => {
      const actualMatrixB = pTheory.targetReturnEfficientPortfolio.createMatrixB(5, 10)
      assert.deepEqual(actualMatrixB, columnMatrix([0, 0, 0, 10, 1]))
    })
    it("should calculate efficient portfolio with the same expected return as Microsoft", () => {
      // econ424/08.2 portfolioTheoryMatrix.pdf, p. 13, example 6
      const expectedWeights = [0.82745, -0.09075, 0.26329]

      const actualWeights = pTheory.targetReturnEfficientPortfolio.calculate(
        expectedRr3x1,
        rrCovariance3x3,
        expectedRr3x1[0][0]
      )

      assert.deepEqual(utils.newArrayWithScale(actualWeights, 5), expectedWeights)
    })
    it("should calculate efficient portfolio with the same expected return as Starbucks", () => {
      // econ424/08.2 portfolioTheoryMatrix.pdf, p. 14, example 7
      const expectedWeights: Array<number> = [0.5194, 0.2732, 0.2075]

      const actualWeights = pTheory.targetReturnEfficientPortfolio.calculate(
        expectedRr3x1,
        rrCovariance3x3,
        expectedRr3x1[2][0]
      )

      assert.deepEqual(utils.newArrayWithScale(actualWeights, 4), expectedWeights)
    })
  })
  describe("Efficient Portfolio Frontier", () => {
    it("should calculate frontier for the lecture example", () => {
      const actualFrontier = pTheory.efficientPortfolioFrontier.calculate(expectedRr3x1, rrCovariance3x3)
      assert.equal(21, actualFrontier.length)
      log.debug(numeric.prettyPrint(actualFrontier))
      assert.deepEqual(utils.newArrayWithScale(actualFrontier[0].weights, 4), globalMinVariancePortfolio.weights)
    })
    it("should calculate frontier for NYX and INTC", () => {
      const priceMatrixMxN = transpose([testData.NYX, testData.INTC])
      const returnRatesKxN = calculateReturnRatesFromPriceMatrix(priceMatrixMxN)
      const expectedRrNx1 = mean(returnRatesKxN)
      const rrCovarianceNxN = covariance(returnRatesKxN)
      const frontier = pTheory.efficientPortfolioFrontier.calculate(expectedRrNx1, rrCovarianceNxN)
      log.debug(numeric.prettyPrint(frontier))
      assert.deepEqual(utils.newArrayWithScale(frontier[0].weights, 4), [0.1127, 0.8873])
    })
  })
})
