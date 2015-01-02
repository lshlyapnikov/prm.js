/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint node:true */

var linearAlgebra = require("./linearAlgebra");
var pStats = require("./portfolioStats");
var numeric = require("numeric");

exports.GlobalMinVariancePortfolio = {
  /**
   * Calculates Global Minimum Variance Portfolio.
   *
   * @param {Array} returnRatesKxN   K x N return rates matrix, where
   *                                 K is the number of historical intervals,
   *                                 N is the number of stocks in portfolio;
   */
  calculateFromReturnRates: function(returnRatesKxN) {
    var returnRatesCovarianceNxN = pStats.covariance(returnRatesKxN);
    var weightsN = this.calculateWeightsFromReturnRatesCovariance(returnRatesCovarianceNxN);
    var weights1xN = [weightsN];
    var meanRrNx1 = pStats.mean(returnRatesKxN);
    var rr1x1 = linearAlgebra.multiplyMatrices(weights1xN, meanRrNx1);

    var portfolio = Object.create(pStats.PortfolioStats);
    portfolio.weights = weightsN;
    portfolio.stdDev = pStats.portfolioStdDev(weights1xN, returnRatesCovarianceNxN);
    portfolio.expectedReturnRate = rr1x1[0][0];

    return portfolio;
  },

  /**
   * @param returnRatesCovarianceNxN
   * @returns {Array} an array of N elements. Every element is a stock weight in the portfolio.
   */
  calculateWeightsFromReturnRatesCovariance: function(returnRatesCovarianceNxN) {
    var b = linearAlgebra.dim(returnRatesCovarianceNxN)[0] + 1;
    var aMatrix = this.createAMatrix(returnRatesCovarianceNxN);
    var bMatrix = this.createBMatrix(b);
    var zMatrix = numeric.solve(aMatrix, bMatrix);
    return zMatrix.slice(0, b - 1);
  },

  createAMatrix: function(returnRatesCovarianceNxN) {
    var n = linearAlgebra.dim(returnRatesCovarianceNxN)[0];
    var a = n + 1;
    var twoBySigmaNxN = numeric.mul(2, returnRatesCovarianceNxN);
    var aMatrix = linearAlgebra.matrix(a, a, 0);
    aMatrix = linearAlgebra.copyMatrixInto(twoBySigmaNxN, aMatrix);
    var i;
    for(i = 0; i < a - 1; i++) {
      aMatrix[a - 1][i] = 1;
      aMatrix[i][a - 1] = 1;
    }
    aMatrix[a - 1][a - 1] = 0;
    return aMatrix;
  },

  createBMatrix: function(b) {
    var bMatrix = linearAlgebra.matrix(b, 1, 0);
    bMatrix[b - 1][0] = 1;
    return bMatrix;
  }
};

exports.TangencyPortfolio = {
  /**
   * @param expectedReturnRatesNx1
   * @param returnRatesCovarianceNxN
   * @param riskFreeReturnRate
   * @returns {Array} an array of N elements. Every element is a stock weight in the portfolio.
   */
  calculate: function(expectedReturnRatesNx1, returnRatesCovarianceNxN, riskFreeReturnRate) {
    var n = linearAlgebra.dim(returnRatesCovarianceNxN)[0];
    var returnRatesCovarianceInvertedNxN = numeric.inv(returnRatesCovarianceNxN);
    var riskFreeReturnRateNx1 = linearAlgebra.matrix(n, 1, riskFreeReturnRate);
    var muMinusRfNx1 = numeric.sub(expectedReturnRatesNx1, riskFreeReturnRateNx1);
    var topNx1 = linearAlgebra.multiplyMatrices(returnRatesCovarianceInvertedNxN, muMinusRfNx1);
    var one1xN = linearAlgebra.matrix(1, n, 1);
    var bot1x1 = linearAlgebra.multiplyMatrices(one1xN, topNx1);
    var resultNx1 = numeric.div(topNx1, bot1x1[0][0]);
    return linearAlgebra.transpose(resultNx1)[0];
  }
};

//exports.efficientPortfolios = function(){
//
//};
