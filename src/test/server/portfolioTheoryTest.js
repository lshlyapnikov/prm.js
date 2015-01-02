// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, describe, it, console */

var pStats = require("../../main/server/portfolioStats");
var pTheory = require("../../main/server/portfolioTheory");
var la = require("../../main/server/linearAlgebra");
var utils = require("../../main/server/utils");
var testData = require("./testData");
var assert = require("assert");
var numeric = require("numeric");

describe("portfolioTheory", function() {
  // numbers taken from the econ424 lecture
  // 08.2 portfolioTheoryMatrix.pdf, page 31: 1.2 PORTFOLIO ANALYSIS FUNCTIONS IN R
  var rrCovarianceMatrix = [
    [0.0100, 0.0018, 0.0011],
    [0.0018, 0.0109, 0.0026],
    [0.0011, 0.0026, 0.0199]
  ];
  var expectedRr = la.columnMatrix([0.0427, 0.0015, 0.0285]);

  var riskFreeRr = 0.005;

  var globalMinVariancePortfolio = Object.create(pTheory.GlobalMinVariancePortfolio);

  describe("Global Minimum Variance Portfolio", function() {
    it("should calculate global min variance portfolio from return rate covariance matrix", function() {
      var expectedGlobalMinVariancePortfolio = Object.create(pStats.PortfolioStats);
      expectedGlobalMinVariancePortfolio.expectedReturnRate = 0.02489184;
      expectedGlobalMinVariancePortfolio.weights = [0.4411, 0.3656, 0.1933];
      expectedGlobalMinVariancePortfolio.stdDev = 0.07267607;

      var actualWeights = globalMinVariancePortfolio.calculateWeightsFromReturnRatesCovariance(rrCovarianceMatrix);
      console.log("actualWeights: " + numeric.prettyPrint(actualWeights) + "\n");
      assert.deepEqual(numeric.dim(actualWeights), [3]);
      utils.setArrayElementsScale(actualWeights, 4);
      assert.deepEqual(actualWeights, expectedGlobalMinVariancePortfolio.weights);

      var actualWeights1x3 = [actualWeights];
      var actualStdDev = pStats.portfolioStdDev(actualWeights1x3, rrCovarianceMatrix);
      console.log("actualStdDev: " + actualStdDev);
      assert.equal(actualStdDev.toFixed(8), expectedGlobalMinVariancePortfolio.stdDev);
    });
    it("should calculate global min variance portfolio for NYX and INTC using historic prices", function() {
      var expectedPortfolio = Object.create(pStats.PortfolioStats);
      expectedPortfolio.weights = [0.1127, 0.8873];
      expectedPortfolio.expectedReturnRate = 0.0064;
      expectedPortfolio.stdDev = 0.0737;

      var priceMatrixMxN = la.transpose([testData.NYX, testData.INTC]);

      var actualPortfolio = globalMinVariancePortfolio.calculateFromReturnRates(
        pStats.calculateReturnRatesFromPriceMatrix(priceMatrixMxN));

      assert.deepEqual(utils.newArrayWithScale(actualPortfolio.weights, 4), expectedPortfolio.weights);
      assert.equal(actualPortfolio.expectedReturnRate.toFixed(4), expectedPortfolio.expectedReturnRate);
      assert.equal(actualPortfolio.stdDev.toFixed(4), expectedPortfolio.stdDev);
    });
  });
  describe("#createAMatrix", function() {
    function testCreateAMatrix(rrCov) {
      var n = la.dim(rrCov)[0];
      var a = n + 1;

      var aMatrix = globalMinVariancePortfolio.createAMatrix(rrCov);

      console.log("aMatrix: \n" + numeric.prettyPrint(aMatrix) + "\n");

      assert.deepEqual(la.dim(aMatrix), [a, a]);
      var i, j;
      for(i = 0; i < n; i++) {
        for(j = 0; j < n; j++) {
          assert.equal(aMatrix[i][j], 2 * rrCov[i][j]);
        }
      }
      for(i = 0; i < a - 1; i++) {
        assert.equal(aMatrix[a - 1][i], 1);
        assert.equal(aMatrix[i][a - 1], 1);
      }
      assert.equal(aMatrix[a - 1][a - 1], 0);
    }

    it("should create 4x4 A matrix from 3x3 return rate covariance matrix", function() {
      testCreateAMatrix(numeric.random([3, 3]));
    });
    it("should create 5x5 A matrix from 4x4 return rate covariance matrix", function() {
      testCreateAMatrix(numeric.random([4, 4]));
    });
    it("should create 10x10 A matrix from 9x9 return rate covariance matrix", function() {
      testCreateAMatrix(numeric.random([9, 9]));
    });
  });
  describe("Tangency Portfolio", function() {
    it("should calcualte tangency portfolio from return rate covariance matrix", function() {
      var expectedTangencyPorftolioWeights = [1.0268, -0.3263, 0.2994];
      var tangencyPortfolio = Object.create(pTheory.TangencyPortfolio);
      var actualWeights = tangencyPortfolio.calculate(expectedRr, rrCovarianceMatrix, riskFreeRr);
      assert.deepEqual(utils.newArrayWithScale(actualWeights, 4), expectedTangencyPorftolioWeights);
    });
  });
});