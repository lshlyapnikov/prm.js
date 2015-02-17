/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint node:true */
/* jshint -W033 */

var linearAlgebra = require("./linearAlgebra")
var pStats = require("./portfolioStats")
var numeric = require("numeric")

exports.GlobalMinimumVariancePortfolio = {
  /**
   * Calculates Global Minimum Variance Portfolio.
   *
   * @param {Array.<Array.<number>>} returnRatesKxN   K x N return rates matrix, where
   *                                 K is the number of historical intervals,
   *                                 N is the number of stocks in portfolio
   */
  calculateFromReturnRates: function(returnRatesKxN) {
    var returnRatesCovarianceNxN = pStats.covariance(returnRatesKxN)
    var weightsN = this.calculateWeightsFromReturnRatesCovariance(returnRatesCovarianceNxN)
    var weights1xN = [weightsN]
    var meanRrNx1 = pStats.mean(returnRatesKxN)
    var rr1x1 = linearAlgebra.multiplyMatrices(weights1xN, meanRrNx1)

    var portfolio = Object.create(pStats.PortfolioStats)
    portfolio.weights = weightsN
    portfolio.stdDev = pStats.portfolioStdDev(weights1xN, returnRatesCovarianceNxN)
    portfolio.expectedReturnRate = rr1x1[0][0]

    return portfolio
  },

  /**
   * @param returnRatesCovarianceNxN
   * @returns {Array.<number>} an array of N elements. Every element is a stock weight in the portfolio.
   */
  calculateWeightsFromReturnRatesCovariance: function(returnRatesCovarianceNxN) {
    var b = linearAlgebra.dim(returnRatesCovarianceNxN)[0] + 1
    var matrixA = this.createMatrixA(returnRatesCovarianceNxN)
    var matrixB = this.createMatrixB(b)
    var matrixZ = numeric.solve(matrixA, matrixB)
    return matrixZ.slice(0, b - 1)
  },

  createMatrixA: function(returnRatesCovarianceNxN) {
    var n = linearAlgebra.dim(returnRatesCovarianceNxN)[0]
    var a = n + 1
    var twoBySigmaNxN = numeric.mul(2, returnRatesCovarianceNxN)
    var matrixA = linearAlgebra.matrix(a, a, 0)
    matrixA = linearAlgebra.copyMatrixInto(twoBySigmaNxN, matrixA)
    var i
    for(i = 0; i < a - 1; i++) {
      matrixA[a - 1][i] = 1
      matrixA[i][a - 1] = 1
    }
    return matrixA
  },

  createMatrixB: function(b) {
    var matrixB = linearAlgebra.matrix(b, 1, 0)
    matrixB[b - 1][0] = 1
    return matrixB
  }
}

exports.TangencyPortfolio = {
  /**
   * @param expectedReturnRatesNx1
   * @param returnRatesCovarianceNxN
   * @param riskFreeReturnRate
   * @returns {Array} an array of N elements. Every element is a stock weight in the portfolio.
   */
  calculate: function(expectedReturnRatesNx1, returnRatesCovarianceNxN, riskFreeReturnRate) {
    var n = linearAlgebra.dim(returnRatesCovarianceNxN)[0]
    var returnRatesCovarianceInvertedNxN = numeric.inv(returnRatesCovarianceNxN)
    var riskFreeReturnRateNx1 = linearAlgebra.matrix(n, 1, riskFreeReturnRate)
    var muMinusRfNx1 = numeric.sub(expectedReturnRatesNx1, riskFreeReturnRateNx1)
    var topNx1 = linearAlgebra.multiplyMatrices(returnRatesCovarianceInvertedNxN, muMinusRfNx1)
    var one1xN = linearAlgebra.matrix(1, n, 1)
    var bot1x1 = linearAlgebra.multiplyMatrices(one1xN, topNx1)
    var resultNx1 = numeric.div(topNx1, bot1x1[0][0])
    return linearAlgebra.transpose(resultNx1)[0]
  }
}

/**
 * econ424/08.2 portfolioTheoryMatrix.pdf, p.21
 * @type {{calculate: calculate}}
 */
exports.EfficientPortfolioFrontier = {
  calculate: function(expectedReturnRatesNx1, returnRatesCovarianceNxN) {


  },
}

/**
 * See econ424/08.2 portfolioTheoryMatrix.pdf, p12, matrix formula 1.18.
 * A and B matrices are different from global minimum efficient portfolio.
 *
 * @type {{calculate: calculate, createMatrixA: createMatrixA, createMatrixB: createMatrixB}}
 */
exports.EfficientPortfolioWithTargetReturn = {

  calculate: function(expectedReturnRatesNx1, returnRatesCovarianceNxN, targetReturnRate) {
    var b = linearAlgebra.dim(returnRatesCovarianceNxN)[0] + 2
    var matrixA = this.createMatrixA(expectedReturnRatesNx1, returnRatesCovarianceNxN)
    var matrixB = this.createMatrixB(b, targetReturnRate)
    var matrixZ = numeric.solve(matrixA, matrixB)
    return matrixZ.slice(0, b - 2)
  },

  createMatrixA: function(expectedReturnRatesNx1, returnRatesCovarianceNxN) {
    var n = linearAlgebra.dim(returnRatesCovarianceNxN)[0]
    var a = n + 2
    var twoBySigmaNxN = numeric.mul(2, returnRatesCovarianceNxN)
    var matrixA = linearAlgebra.matrix(a, a, 0)
    matrixA = linearAlgebra.copyMatrixInto(twoBySigmaNxN, matrixA)
    var i
    for(i = 0; i < n; i++) {
      var r = expectedReturnRatesNx1[i][0]
      matrixA[n][i] = r
      matrixA[i][n] = r
    }
    for(i = 0; i < n; i++) {
      matrixA[n + 1][i] = 1
      matrixA[i][n + 1] = 1
    }
    return matrixA
  },

  createMatrixB: function(bColumns, targetReturnRate) {
    var matrixB = linearAlgebra.matrix(bColumns, 1, 0)
    matrixB[bColumns - 2][0] = targetReturnRate
    matrixB[bColumns - 1][0] = 1
    return matrixB
  }

}

// efficient portfolio frontier with no short sale
// 09 portfoliotheorynoshortsalesslides.pdf, page 12
