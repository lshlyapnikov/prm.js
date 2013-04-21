// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, describe, it */

var portfolioStats = require("../../main/server/portfolioStats");
var utils = require("../../main/server/utils");
var assert = require("assert");
var numeric = require("numeric");

describe("portfolioStats", function() {
    describe("#meanValue()", function() {
        it("[1] should calculate mean", function() {
            var expectedMean = 2870;
            var actualMean = portfolioStats.meanValue([123, 456, 789, 10112]);
            assert.equal(actualMean, expectedMean);
        });
    });
    describe("#meanValue()", function() {
        it("[2] should calculate mean", function() {
            // R:
            // >  a = c(-123.456, -234.567, -345.789, 456.789, 567.890, 678.901, 789.0123, 890.123, 901.234);
            // > mean(a)
            // [1] 397.793
            var expectedMean = [397.793];
            var actualMean = portfolioStats.meanValue([-123.456, -234.567, -345.789, 456.789, 567.890, 678.901, 789.0123, 890.123, 901.234]);
            assert.equal(actualMean.toFixed(3), expectedMean);
        });
    });
    describe("#meanValue()", function() {
        it("[3] should throw up when array is undefined", function() {
            var caught;
            try {
                portfolioStats.meanValue(undefined);
            } catch(e) {
                caught = e;
            }
            assert.equal(true, caught !== undefined);
            assert.equal("InvalidArgument", caught.name);
        });
    });
    describe("#meanValue() [4]", function() {
        it("should throw up when array is empty", function() {
            var caught;
            try {
                portfolioStats.meanValue([]);
            } catch(e) {
                caught = e;
            }
            assert.equal(true, caught !== undefined);
            assert.equal("InvalidArgument", caught.name);
        });
    });
    describe("#mean() [1]", function() {
        it("should calculate vector of mean values", function() {
            var expectedMean = [[2.5], [25], [250]];
            var actualMean = portfolioStats.mean([
                [1, 10, 100],
                [2, 20, 200],
                [3, 30, 300],
                [4, 40, 400]]);
            assert.deepEqual(expectedMean, actualMean);
        });
    });
    describe("#variance()", function() {
        it("should calculate sample variance", function() {
            // R:
            // >  a = c(-123.456, -234.567, -345.789, 456.789, 567.890, 678.901, 789.0123, 890.123, 901.234);
            // > var(a)
            // [1] 248102.9
            var expected = 248102.9;
            var actual = portfolioStats.variance([-123.456, -234.567, -345.789, 456.789, 567.890, 678.901, 789.0123, 890.123, 901.234]);
            assert.equal(expected, actual.toFixed(1));
        });
    });
    describe("#covariance()", function() {
        it("[1] should calculate sample covariance", function() {
            // R:
            // > m = rbind(c(1,2,3), c(40,50,60), c(7,8,9), c(10, 11, 12), c(13, 14,15));
            // > m
            //      [,1] [,2] [,3]
            // [1,]    1    2    3
            // [2,]   40   50   60
            // [3,]    7    8    9
            // [4,]   10   11   12
            // [5,]   13   14   15
            // > var(m)
            //        [,1]   [,2]   [,3]
            // [1,] 227.70 285.75 343.80
            // [2,] 285.75 360.00 434.25
            // [3,] 343.80 434.25 524.70

            // GIVEN
            var m = [
                [1,2,3],
                [40,50,60],
                [7,8,9], 
                [10, 11, 12], 
                [13, 14,15]];
            var expected = [
                [227.70, 285.75, 343.80],
                [285.75, 360.00, 434.25],
                [343.80, 434.25, 524.70]];

            // WHEN
            var actual = portfolioStats.covariance(m);

            // THEN
            var rowNum = numeric.dim(actual)[0];
            var colNum = numeric.dim(actual)[1];
            for (var i = 0; i < rowNum; i++) {
                for (var j = 0; j < colNum; j++) {
                    actual[i][j] = actual[i][j].toFixed(2);
                }
            }
            //console.log("actual: " + JSON.stringify(actual, null, 4));

            assert.deepEqual(expected, actual);
        });
    });

    describe("#covariance()", function() {
        it("[2] should calculate sample covariance", function() {
            /*
            R:
            > m = matrix(data = rexp(50, rate = 10), nrow = 10, ncol = 5)
            > m
                        [,1]       [,2]       [,3]       [,4]        [,5]
             [1,] 0.05176742 0.19649658 0.08032437 0.02009803 0.303612848
             [2,] 0.15598153 0.03217524 0.05623585 0.16309296 0.008880331
             [3,] 0.03739765 0.24896220 0.05287603 0.11171264 0.141389348
             [4,] 0.09215301 0.08065653 0.01932586 0.18225324 0.117325248
             [5,] 0.05081828 0.04087132 0.04067674 0.34652004 0.037860078
             [6,] 0.05710076 0.17920232 0.15726811 0.13579958 0.262676459
             [7,] 0.07683365 0.03858374 0.04612419 0.06733188 0.045760640
             [8,] 0.12567096 0.04273011 0.33551670 0.08045967 0.195531782
             [9,] 0.29584858 0.22294231 0.13388306 0.01525325 0.170752117
            [10,] 0.03883857 0.24567795 0.08235735 0.37050856 0.623400103
            > var(m)
                          [,1]          [,2]          [,3]          [,4]         [,5]
            [1,]  0.0063291394 -0.0002684659  0.0019511242 -0.0044080703 -0.003824659
            [2,] -0.0002684659  0.0087617333 -0.0005644795 -0.0008499264  0.011248949
            [3,]  0.0019511242 -0.0005644795  0.0086286935 -0.0035181307  0.003089374
            [4,] -0.0044080703 -0.0008499264 -0.0035181307  0.0152021828  0.006795891
            [5,] -0.0038246587  0.0112489494  0.0030893736  0.0067958912  0.032313534
            */


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
                [0.03883857, 0.24567795, 0.08235735, 0.37050856, 0.623400103]];
            var expected = [
                [0.0063291394, -0.0002684659, 0.0019511242, -0.0044080703, -0.003824659],
                [-0.0002684659, 0.0087617333, -0.0005644795, -0.0008499264, 0.011248949],
                [0.0019511242, -0.0005644795, 0.0086286935, -0.0035181307,  0.003089374],
                [-0.0044080703, -0.0008499264, -0.0035181307, 0.0152021828,  0.006795891],
                [-0.0038246587,  0.0112489494,  0.0030893736,  0.0067958912,  0.032313534]];


            // WHEN
            var actual = portfolioStats.covariance(m);

            // THEN
            var rowNum = numeric.dim(actual)[0];
            var colNum = numeric.dim(actual)[1];
            var i, j;
            for (i = 0; i < rowNum; i++) {
                for (j = 0; j < colNum; j++) {
                    expected[i][j] = expected[i][j].toFixed(4);
                }
            }
            for (i = 0; i < rowNum; i++) {
                for (j = 0; j < colNum; j++) {
                    actual[i][j] = actual[i][j].toFixed(4);
                }
            }
            assert.equal(JSON.stringify(expected, null, 4), JSON.stringify(actual, null, 4));
        });
    });
    describe("#calculateReturnRatesFromPrices()", function() {
        it("[1] should calculate return rates from provided prices", function() {
            // GIVEN
            var prices = [100.12, 123.34, 134.67, 167.89];
            var expected = [0.231921694, 0.091859899, 0.246677062];

            // WHEN
            var actual = portfolioStats.calculateReturnRatesFromPrices(prices);

            // THEN
            utils.updateArrayElements(expected, function(num) {
                return num.toFixed(4);
            });
            utils.updateArrayElements(actual, function(num) {
                return num.toFixed(4);
            });
            assert.deepEqual(expected, actual);
        });
    });
    describe("#calculateReturnRatesFromPrices()", function() {
        it("[2] should return empty array", function() {
            // GIVEN
            var prices = [100.12];
            var expected = [];

            // WHEN
            var actual = portfolioStats.calculateReturnRatesFromPrices(prices);

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
                [300.123, 3.123]];
            var expected = [
                [0.998771511, 0.89047195],
                [0.499692689, 0.471031559]];
            // WHEN
            var actual = portfolioStats.calculateReturnRatesFromPriceMatrix(priceMatrix);

            // THEN
            utils.updateMatrixElements(expected, function(num) {
                return num.toFixed(4);
            });
            utils.updateMatrixElements(actual, function(num) {
                return num.toFixed(4);
            });
            assert.deepEqual(expected, actual);
        });
    });
    describe("#calculateReturnRatesFromPriceMatrix()", function() {
        it("[2] should throw up if not enough data points to calculate return rate", function() {
            // GIVEN
            var priceMatrix = [[100.123, 1.123]]; // not enough data points to calculate return rates.
            var actual;
            // WHEN
            try {
                portfolioStats.calculateReturnRatesFromPriceMatrix(priceMatrix);
            } catch (e) {
                actual = e;
            }
            // THEN
            assert.notEqual(actual, undefined);
            assert.equal("InvalidArgument", actual.name);
        });
    });
});

