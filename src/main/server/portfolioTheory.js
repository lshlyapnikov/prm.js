/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, exports */

var linearAlgebra = require("./linearAlgebra");
var pStats = require("./portfolioStats");
var numeric = require("numeric");


exports.GlobalMinVariancePortfolio = function() {
  return {
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
};

exports.TangencyPortfolio = function() {

};

//exports.efficientPortfolios = function(){
//
//};
