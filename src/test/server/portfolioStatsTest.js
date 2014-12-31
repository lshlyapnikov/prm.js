// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, describe, it, console */

var pStats = require("../../main/server/portfolioStats");
var utils = require("../../main/server/utils");
var la = require("../../main/server/linearAlgebra");
var matrixAssert = require("./matrixAssert");
var testData = require("./testData");
var assert = require("assert");
var numeric = require("numeric");

var priceMatrixMxN = la.transpose([testData.NYX, testData.INTC]);

function mockHistoricalPricesProvider(symbol) {
  var prices = {NYX: testData.NYX, INTC: testData.INTC};
  return prices[symbol];
}

describe("portfolioStats", function() {
  describe("#meanValue()", function() {
    it("[1] should calculate mean", function() {
      var expectedMean = 2870;
      var actualMean = pStats.meanValue([123, 456, 789, 10112]);
      assert.equal(actualMean, expectedMean);
    });
    it("[2] should calculate mean", function() {
      var actualMean = pStats.meanValue([-123.456, -234.567, -345.789, 456.789, 567.890, 678.901, 789.0123, 890.123, 901.234]);
      assert.equal(397.79303, actualMean.toFixed(5));
    });
    it("[3] should throw up when array is undefined", function() {
      var caught;
      try {
        pStats.meanValue(undefined);
      } catch(e) {
        caught = e;
      }
      assert.equal(true, caught !== undefined);
      assert.equal("Error", caught.name);
    });
    it("[4] should throw up when array is empty", function() {
      var caught;
      try {
        pStats.meanValue([]);
      } catch(e) {
        caught = e;
      }
      assert.equal(true, caught !== undefined);
      assert.equal("Error", caught.name);
    });
    it("[5] should calcualte mean value", function() {
      var actual = pStats.meanValue(testData.NYX);
      assert.equal(actual.toFixed(5), 36.75465);
    });
  });
  describe("#mean()", function() {
    it("should calculate vector of mean values", function() {
      var expectedMean = [
        [2.5],
        [25],
        [250]
      ];
      var actualMean = pStats.mean([
        [1, 10, 100],
        [2, 20, 200],
        [3, 30, 300],
        [4, 40, 400]
      ]);
      assert.deepEqual(expectedMean, actualMean);
    });
    it("should calculate vector mean values using test data", function() {
      var expectedMeanReturnRatesMatrix = [
        [0.01674256058568205],
        [0.00504504938397936]
      ];
      var returnRatesMatrix = pStats.calculateReturnRatesFromPriceMatrix(priceMatrixMxN);
      var meanReturnRatesMatrix = pStats.mean(returnRatesMatrix);
      matrixAssert.equal(meanReturnRatesMatrix, expectedMeanReturnRatesMatrix, 5);
    });
  });
  describe("#variance()", function() {
    var arr = [-123.456, -234.567, -345.789, 456.789, 567.890, 678.901, 789.0123, 890.123, 901.234];
    it("[1] should calculate sample variance", function() {
      var actual = pStats.variance(arr);
      assert.equal(248102.91444, actual.toFixed(5));
    });
    it("[2] should calculate sample variance", function() {
      var actual = pStats.variance([1, 2, 3], false);
      assert.equal(1, actual);
    });
    it("[3] should calculate population variance", function() {
      var actual = pStats.variance(arr, true);
      assert(220535.92394, actual.toFixed(5));
    });
    it("[4] should calculate population variance", function() {
      var actual = pStats.variance([1, 2, 3], true);
      assert.equal(0.6666667, actual.toFixed(7));
    });
  });
  describe("#covariance()", function() {
    it("[1] should calculate sample covariance", function() {
      // GIVEN
      var m = [
        [1, 2, 3],
        [40, 50, 60],
        [7, 8, 9],
        [10, 11, 12],
        [13, 14, 15]
      ];
      var expected = [
        [227.70, 285.75, 343.80],
        [285.75, 360.00, 434.25],
        [343.80, 434.25, 524.70]
      ];

      // WHEN
      var actual = pStats.covariance(m);

      // THEN
      var rowNum = numeric.dim(actual)[0];
      var colNum = numeric.dim(actual)[1];
      for(var i = 0; i < rowNum; i++) {
        for(var j = 0; j < colNum; j++) {
          actual[i][j] = actual[i][j].toFixed(2);
        }
      }
      assert.deepEqual(expected, actual);
    });
    it("[2] should calculate sample covariance", function() {
      // GIVEN
      var m = [
        [0.05176742, 0.19649658, 0.08032437, 0.02009803, 0.303612848],
        [0.15598153, 0.03217524, 0.05623585, 0.16309296, 0.008880331],
        [0.03739765, 0.24896220, 0.05287603, 0.11171264, 0.141389348],
        [0.09215301, 0.08065653, 0.01932586, 0.18225324, 0.117325248],
        [0.05081828, 0.04087132, 0.04067674, 0.34652004, 0.037860078],
        [0.05710076, 0.17920232, 0.15726811, 0.13579958, 0.262676459],
        [0.07683365, 0.03858374, 0.04612419, 0.06733188, 0.045760640],
        [0.12567096, 0.04273011, 0.33551670, 0.08045967, 0.195531782],
        [0.29584858, 0.22294231, 0.13388306, 0.01525325, 0.170752117],
        [0.03883857, 0.24567795, 0.08235735, 0.37050856, 0.623400103]
      ];
      var expected = [
        [0.0063291394, -0.0002684659, 0.0019511242, -0.0044080703, -0.003824659],
        [-0.0002684659, 0.0087617333, -0.0005644795, -0.0008499264, 0.011248949],
        [0.0019511242, -0.0005644795, 0.0086286935, -0.0035181307, 0.003089374],
        [-0.0044080703, -0.0008499264, -0.0035181307, 0.0152021828, 0.006795891],
        [-0.0038246587, 0.0112489494, 0.0030893736, 0.0067958912, 0.032313534]
      ];

      // WHEN
      var actual = pStats.covariance(m);

      // THEN

      matrixAssert.equal(actual, expected, 5);
    });
    it("[3] should calculate sample covariance using testData", function() {
      // GIVEN
      var mXn = la.transpose([testData.INTC, testData.NYX]);
      var expected = [
        [11.4424425066996, -0.5151149866007],
        [-0.5151149866007, 343.7836414553700]
      ];
      // WHEN
      var actual = pStats.covariance(mXn);
      // THEN
      assert.deepEqual(la.dim(actual), [2, 2]);
      assert.equal(actual[0].length, 2);
      matrixAssert.equal(expected, actual, 5);
    });
  });
  describe("#calculateReturnRatesFromPrices()", function() {
    it("[1] should calculate return rates from provided prices", function() {
      // GIVEN
      var prices = [100.12, 123.34, 134.67, 167.89];
      var expected = [0.231921694, 0.091859899, 0.246677062];

      // WHEN
      var actual = pStats.calculateReturnRatesFromPrices(prices);

      // THEN

      utils.setArrayElementsScale(expected, 5);
      utils.setArrayElementsScale(actual, 5);
      assert.deepEqual(expected, actual);
    });
    it("[2] should return empty array", function() {
      // GIVEN
      var prices = [100.12];
      var expected = [];
      // WHEN
      var actual = pStats.calculateReturnRatesFromPrices(prices);
      // THEN
      assert.deepEqual(expected, actual);
    });
  });
  describe("#calculateReturnRatesFromPriceMatrix()", function() {
    it("[1] should calculate return rates from price matrix", function() {
      // GIVEN
      var priceMatrix = [
        [100.123, 1.123],
        [200.123, 2.123],
        [300.123, 3.123]
      ];
      var expected = [
        [0.998771511, 0.89047195],
        [0.499692689, 0.471031559]
      ];
      // WHEN
      var actual = pStats.calculateReturnRatesFromPriceMatrix(priceMatrix);

      // THEN
      matrixAssert.equal(expected, actual, 5);
      assert.equal(actual.length, priceMatrix.length - 1);
    });
    it("[2] should throw up if not enough data points to calculate return rate", function() {
      // GIVEN
      var priceMatrix = [
        [100.123, 1.123]
      ]; // not enough data points to calculate return rates.
      var actual;
      // WHEN
      try {
        pStats.calculateReturnRatesFromPriceMatrix(priceMatrix);
      } catch(e) {
        actual = e;
      }
      // THEN
      assert.notEqual(actual, undefined);
      assert.equal("Error", actual.name);
    });
  });
  describe("#portfolioStdDev()", function() {
    it("[1] should calculate portfolio Std Dev", function() {
      // GIVEN
      var weights1xN = [
        [1 / 3, 1 / 3, 1 / 3]
      ];
      var covarianceNxN = [
        [0.0100, 0.0018, 0.0011],
        [0.0018, 0.0109, 0.0026],
        [0.0011, 0.0026, 0.0199]
      ];
      var expected = 0.07586538;
      // WHEN
      var actual = pStats.portfolioStdDev(weights1xN, covarianceNxN);
      // THEN
      assert.equal(expected.toFixed(5), actual.toFixed(5));
    });
    it("[2] should calculate portfolio Std Dev", function() {
      // GIVEN
      var weights1xN = [
        [0.2, 0.4, 0.4]
      ];
      var covarianceNxN = [
        [0.036224, 0.032980, 0.047716],
        [0.032980, 0.150345, 0.021842],
        [0.047716, 0.021842, 0.814886]
      ];
      var expected = 0.4193;
      // WHEN
      var actual = pStats.portfolioStdDev(weights1xN, covarianceNxN);
      // THEN
      assert.equal(expected.toFixed(4), actual.toFixed(4));
    });
  });
  describe("#loadPriceMatrix", function() {
    it("should return price matrix", function() {
      var actual = pStats.loadPriceMatrix(mockHistoricalPricesProvider, ["NYX", "INTC"]);
      assert.deepEqual(actual, priceMatrixMxN);
    });
  });
});

