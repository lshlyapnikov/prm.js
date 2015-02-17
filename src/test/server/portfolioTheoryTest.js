// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint node:true */
/* jshint -W033 */
/* global require, describe, it, console */

var pStats = require("../../main/server/portfolioStats")
var pTheory = require("../../main/server/portfolioTheory")
var la = require("../../main/server/linearAlgebra")
var utils = require("../../main/server/utils")
var testData = require("./testData")
var assert = require("assert")
var numeric = require("numeric")

describe("portfolioTheory", function() {
  // numbers taken from the econ424 lecture
  // 08.2 portfolioTheoryMatrix.pdf, page 31: 1.2 PORTFOLIO ANALYSIS FUNCTIONS IN R
  var rrCovarianceMatrix = [
    [0.0100, 0.0018, 0.0011],
    [0.0018, 0.0109, 0.0026],
    [0.0011, 0.0026, 0.0199]
  ]
  var expectedRr = la.columnMatrix([0.0427, 0.0015, 0.0285])

  var riskFreeRr = 0.005

  var globalMinVariancePortfolio = Object.create(pTheory.GlobalMinimumVariancePortfolio)

  describe("Global Minimum Variance Portfolio", function() {
    it("should calculate global min variance portfolio from return rate covariance matrix", function() {
      var expectedGlobalMinVariancePortfolio = Object.create(pStats.PortfolioStats)
      expectedGlobalMinVariancePortfolio.weights = [0.4411, 0.3656, 0.1933]
      expectedGlobalMinVariancePortfolio.expectedReturnRate = 0.02489184
      expectedGlobalMinVariancePortfolio.stdDev = 0.07267607

      var actualWeights = globalMinVariancePortfolio.calculateWeightsFromReturnRatesCovariance(rrCovarianceMatrix)
      console.log("actualWeights: " + numeric.prettyPrint(actualWeights) + "\n")
      assert.deepEqual(numeric.dim(actualWeights), [3])
      utils.setArrayElementsScale(actualWeights, 4)
      assert.deepEqual(actualWeights, expectedGlobalMinVariancePortfolio.weights)

      var actualWeights1x3 = [actualWeights]
      var actualStdDev = pStats.portfolioStdDev(actualWeights1x3, rrCovarianceMatrix)
      console.log("actualStdDev: " + actualStdDev)
      assert.equal(actualStdDev.toFixed(8), expectedGlobalMinVariancePortfolio.stdDev)

      var portfolioRr = la.multiplyMatrices(actualWeights1x3, expectedRr)
      assert.equal(portfolioRr[0][0].toFixed(4), expectedGlobalMinVariancePortfolio.expectedReturnRate.toFixed(4))
    })
    it("should calculate global min variance portfolio for NYX and INTC using historic prices", function() {
      var expectedPortfolio = Object.create(pStats.PortfolioStats)
      expectedPortfolio.weights = [0.1127, 0.8873]
      expectedPortfolio.expectedReturnRate = 0.0064
      expectedPortfolio.stdDev = 0.0737

      var priceMatrixMxN = la.transpose([testData.NYX, testData.INTC])

      var actualPortfolio = globalMinVariancePortfolio.calculateFromReturnRates(
        pStats.calculateReturnRatesFromPriceMatrix(priceMatrixMxN))

      assert.deepEqual(utils.newArrayWithScale(actualPortfolio.weights, 4), expectedPortfolio.weights)
      assert.equal(actualPortfolio.expectedReturnRate.toFixed(4), expectedPortfolio.expectedReturnRate)
      assert.equal(actualPortfolio.stdDev.toFixed(4), expectedPortfolio.stdDev)
    })
    describe("#createMatrixA", function() {
      function testCreateMatrixA(rrCov) {
        var n = la.dim(rrCov)[0]
        var a = n + 1

        var matrixA = globalMinVariancePortfolio.createMatrixA(rrCov)

        console.log("matrixA: \n" + numeric.prettyPrint(matrixA) + "\n")

        assert.deepEqual(la.dim(matrixA), [a, a])
        var i, j
        for(i = 0; i < n; i++) {
          for(j = 0; j < n; j++) {
            assert.equal(matrixA[i][j], 2 * rrCov[i][j])
          }
        }
        for(i = 0; i < a - 1; i++) {
          assert.equal(matrixA[a - 1][i], 1)
          assert.equal(matrixA[i][a - 1], 1)
        }
        assert.equal(matrixA[a - 1][a - 1], 0)
      }

      it("should create 4x4 A matrix from 3x3 return rate covariance matrix", function() {
        testCreateMatrixA(numeric.random([3, 3]))
      })
      it("should create 5x5 A matrix from 4x4 return rate covariance matrix", function() {
        testCreateMatrixA(numeric.random([4, 4]))
      })
      it("should create 10x10 A matrix from 9x9 return rate covariance matrix", function() {
        testCreateMatrixA(numeric.random([9, 9]))
      })
    })
  })
  describe("Tangency Portfolio", function() {
    it("should calculate tangency portfolio from return rate covariance matrix", function() {
      var expectedTangencyPortfolioWeights = [1.0268, -0.3263, 0.2994]
      var tangencyPortfolio = Object.create(pTheory.TangencyPortfolio)
      var actualWeights = tangencyPortfolio.calculate(expectedRr, rrCovarianceMatrix, riskFreeRr)
      assert.deepEqual(utils.newArrayWithScale(actualWeights, 4), expectedTangencyPortfolioWeights)
    })
  })
  describe("Efficient Portfolio Frontier", function() {
    it("should calculate efficient portfolio frontier", function() {

    })
  })
  describe("Efficient Portfolio with Target Return", function() {
    it("should create expected matrix A", function() {
      var expectedRr3x1 = la.columnMatrix([1, 2, 3])
      var rrCovMatrix3x3 = [
        [10, 11, 12],
        [20, 21, 22],
        [30, 31, 32]
      ]
      var expectedMatrixA = [
        [20, 22, 24, 1, 1],
        [40, 42, 44, 2, 1],
        [60, 62, 64, 3, 1],
        [ 1, 2, 3, 0, 0],
        [ 1, 1, 1, 0, 0]
      ]
      var actualMatrixA = pTheory.EfficientPortfolioWithTargetReturn.createMatrixA(expectedRr3x1, rrCovMatrix3x3)
      assert.deepEqual(actualMatrixA, expectedMatrixA)
    })
    it("should create expected matrix B", function() {
      var actualMatrixB = pTheory.EfficientPortfolioWithTargetReturn.createMatrixB(5, 10)
      assert.deepEqual(actualMatrixB, la.columnMatrix([0, 0, 0, 10, 1]))
    })
    it("should calculate portfolio weight", function() {
      var expectedWeights = [0.82745, -0.09075, 0.26329]

      var actualWeights = pTheory.EfficientPortfolioWithTargetReturn.calculate(
        expectedRr, rrCovarianceMatrix, expectedRr[0][0])

      assert.deepEqual(utils.newArrayWithScale(actualWeights, 5), expectedWeights)
    })
  })
})

