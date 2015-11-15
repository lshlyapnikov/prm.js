/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

const la = require("./linearAlgebra")
const pStats = require("./portfolioStats")
const numeric = require("numeric")
const _ = require("underscore")

exports.GlobalMinimumVarianceEfficientPortfolio = {
  /**
   * Calculates Global Minimum Variance Portfolio.
   *
   * @param {Array.<Array.<number>>} expectedRrNx1    N x 1 expected/mean return rates matrix, where
   * @param {Array.<Array.<number>>} rrCovarianceNxN
   */
  calculate: function (expectedRrNx1, rrCovarianceNxN) {
    const weightsN = this.calculateWeightsFromReturnRatesCovariance(rrCovarianceNxN)
    return pStats.createPortfolioStats(weightsN, expectedRrNx1, rrCovarianceNxN)
  },

  /**
   * @param returnRatesCovarianceNxN
   * @returns {Array.<number>} an array of N elements. Every element is a stock weight in the portfolio.
   */
  calculateWeightsFromReturnRatesCovariance: function (returnRatesCovarianceNxN) {
    var n = la.dim(returnRatesCovarianceNxN)[0]
    var b = n + 1
    var matrixA = this.createMatrixA(returnRatesCovarianceNxN)
    var matrixB = this.createMatrixB(b)
    var matrixZ = numeric.solve(matrixA, matrixB)
    return matrixZ.slice(0, b - 1)
  },

  createMatrixA: function (returnRatesCovarianceNxN) {
    var n = la.dim(returnRatesCovarianceNxN)[0]
    var a = n + 1
    var twoBySigmaNxN = numeric.mul(2, returnRatesCovarianceNxN)
    var matrixA = la.matrix(a, a, 0)
    matrixA = la.copyMatrixInto(twoBySigmaNxN, matrixA)
    var i
    for (i = 0; i < a - 1; i++) {
      matrixA[a - 1][i] = 1
      matrixA[i][a - 1] = 1
    }
    return matrixA
  },

  createMatrixB: function (b) {
    var matrixB = la.matrix(b, 1, 0)
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
  calculate: function (expectedReturnRatesNx1, returnRatesCovarianceNxN, riskFreeReturnRate) {
    var n = la.dim(returnRatesCovarianceNxN)[0]
    var returnRatesCovarianceInvertedNxN = numeric.inv(returnRatesCovarianceNxN)
    var riskFreeReturnRateNx1 = la.matrix(n, 1, riskFreeReturnRate)
    var muMinusRfNx1 = numeric.sub(expectedReturnRatesNx1, riskFreeReturnRateNx1)
    var topNx1 = la.multiplyMatrices(returnRatesCovarianceInvertedNxN, muMinusRfNx1)
    var one1xN = la.matrix(1, n, 1)
    var bot1x1 = la.multiplyMatrices(one1xN, topNx1)
    var resultNx1 = numeric.div(topNx1, bot1x1[0][0])
    return la.transpose(resultNx1)[0]
  }
}

/**
 * See econ424/08.2 portfolioTheoryMatrix.pdf, p12, matrix formula 1.18.
 * A and B matrices are different from global minimum efficient portfolio.
 */
exports.TargetReturnEfficientPortfolio = {

  calculate: function (expectedReturnRatesNx1, returnRatesCovarianceNxN, targetReturnRate) {
    var n = la.dim(returnRatesCovarianceNxN)[0]
    var b = n + 2
    var matrixA = this.createMatrixA(expectedReturnRatesNx1, returnRatesCovarianceNxN)
    var matrixB = this.createMatrixB(b, targetReturnRate)
    var matrixZ = numeric.solve(matrixA, matrixB)
    return matrixZ.slice(0, b - 2)
  },

  createMatrixA: function (expectedReturnRatesNx1, returnRatesCovarianceNxN) {
    var n = la.dim(returnRatesCovarianceNxN)[0]
    var a = n + 2
    var twoBySigmaNxN = numeric.mul(2, returnRatesCovarianceNxN)
    var matrixA = la.matrix(a, a, 0)
    matrixA = la.copyMatrixInto(twoBySigmaNxN, matrixA)
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
  },

  createMatrixB: function (b, targetReturnRate) {
    var matrixB = la.matrix(b, 1, 0)
    matrixB[b - 2][0] = targetReturnRate
    matrixB[b - 1][0] = 1
    return matrixB
  }
}

/**
 * econ424/08.2 portfolioTheoryMatrix.pdf, p.21
 */
exports.EfficientPortfolioFrontier = {
  calculate: function (expectedRrNx1, rrCovarianceNxN) {
    var maxExpectedRr = _.max(expectedRrNx1, function (row) {
      return row[0]
    })

    var globalMinVarianceEp = pStats.createPortfolioStats(
      exports.GlobalMinimumVarianceEfficientPortfolio.calculateWeightsFromReturnRatesCovariance(rrCovarianceNxN),
      expectedRrNx1,
      rrCovarianceNxN)

    var maxReturnEp = pStats.createPortfolioStats(
      exports.TargetReturnEfficientPortfolio.calculate(expectedRrNx1, rrCovarianceNxN, maxExpectedRr),
      expectedRrNx1,
      rrCovarianceNxN)

    var maxNum = 21 // TODO: why 21?
    var result = new Array(maxNum)

    for (var i = 0, alpha = 1; i < maxNum; i++, alpha -= 0.1) {
      result[i] = pStats.createPortfolioStats(
        this._calculateEfficientPortfolioWeights(globalMinVarianceEp.weights, maxReturnEp.weights, alpha),
        expectedRrNx1,
        rrCovarianceNxN)
    }

    return result
  },

  _calculateEfficientPortfolioWeights: function (globalMinVarianceEpWeigthsN, maxReturnEpWeightsN, alpha) {
    var x = _.map(globalMinVarianceEpWeigthsN, (n) => alpha * n)
    var y = _.map(maxReturnEpWeightsN, (n) => (1 - alpha) * n)
    return numeric.add(x, y)
  }
}

// TODO efficient portfolio frontier with no short sale: 09 portfoliotheorynoshortsalesslides.pdf, page 12
