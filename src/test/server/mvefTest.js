// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global describe, it, require, console */

var mvef = require("../../main/server/mvef");
//var yahooFinanceApi = require("../../main/server/yahooFinanceApi");
var assert = require("assert");
var Q = require("q");

describe("mvef @IntegrationTest", function() {
    describe.skip("#mvefYahooFinanceApi()", function() {
        it("[1] should load historical prices from Yahoo Finance and return MVEF numbers", function(done) {
            var numOfRandomWeights = 100;
            mvef.mvefYahooFinanceApi(["NYX", "INTC"],
                                     new Date(2013, 03, 10),
                                     new Date(2013, 03, 12),
                                     "d",
                                     numOfRandomWeights)
                .then(function(result) {
                    //console.log("result: " + JSON.stringify(result, null, 4));
                    assert.equal(numOfRandomWeights, result.portfolioExpReturnRates.length);
                    assert.equal(numOfRandomWeights, result.portfolioStdDevs.length);
                })
                .then(function(){done();}, function(error){done(error);});
        });
    });
    describe("#mvef()", function() {
        it("[1] should load historical prices using the specified provider and return MVEF numbers", function(done) {
            // GIVEN
            var INTC = [21.48, 22.66, 24.83, 25.48, 26.42, 25.62, 27.95, 27.68, 26.45, 25.80, 23.68, 24.32, 23.75, 20.65, 19.48, 21.40, 21.24, 21.57, 22.01, 19.19, 20.42, 20.24, 19.83, 19.95, 18.76, 17.96, 16.53, 19.13, 18.06, 19.89, 21.06, 20.55, 18.93, 17.75, 18.66, 17.56, 17.35, 17.77, 18.45, 17.35, 14.92, 14.17, 14.10, 13.43, 11.39, 11.41, 12.97, 12.21, 14.06, 16.43, 20.06, 19.34, 18.72, 20.20, 19.28, 18.35, 17.30, 18.17, 22.96, 22.46, 23.07, 22.17, 22.08, 20.16, 20.26, 18.93, 18.26, 16.24, 16.86, 17.70, 17.10, 18.07, 17.94, 17.29, 16.45, 15.04, 15.88, 15.06, 16.61, 16.18, 17.13, 17.59, 20.65, 22.08, 19.38, 20.33, 21.21, 22.32, 21.40, 22.17, 19.27, 19.04, 19.66, 18.33, 19.10, 18.28, 18.15, 16.35, 17.35];
            var NYX = [23.80, 24.65, 24.76, 25.19, 25.29, 23.74, 25.14, 29.30, 28.77, 25.67, 25.22, 27.30, 25.40, 22.21, 25.77, 31.60, 32.37, 34.09, 37.50, 32.93, 34.35, 29.53, 27.83, 25.11, 28.16, 26.26, 25.24, 26.36, 25.14, 25.81, 29.37, 26.65, 23.49, 20.85, 22.53, 22.25, 22.75, 25.43, 24.68, 23.47, 23.73, 25.86, 19.97, 15.43, 14.30, 18.63, 23.19, 19.94, 25.27, 32.81, 33.72, 39.24, 42.08, 52.83, 54.63, 51.00, 54.06, 64.70, 72.25, 71.09, 76.85, 64.99, 59.51, 63.01, 60.23, 67.74, 68.76, 76.44, 69.22, 81.52, 79.25, 81.61, 60.38, 60.95, 48.35, 50.71, 55.83, 48.76, 54.14, 64.62, 52.43, 46.35, 40.77, 45.25, 39.38, 32.49, 30.96, 32.94, 31.73, 28.01, 26.50, 14.43, 15.29, 15.47, 17.10, 18.14, 13.86, 11.90, 12.15];
            var prices = {"INTC": INTC, "NYX": NYX};

            function mockHistoricalPricesProvider(symbol) {
                var deferred = Q.defer();
                var result = prices[symbol];
                console.log("symbol: ", symbol);
                deferred.resolve(result);
                return deferred.promise;
            }            

            var numOfRandomWeights = 1000;

            // WHEN
            mvef.mvef(mockHistoricalPricesProvider, ["NYX", "INTC"], numOfRandomWeights)
                .then(function(result) {
                    // THEN
                    console.log("result: " + JSON.stringify(result, null, 4));
                    assert.equal(numOfRandomWeights, result.portfolioExpReturnRates.length);
                    assert.equal(numOfRandomWeights, result.portfolioStdDevs.length);
                    var pR = result.portfolioExpReturnRates;
                    var pStd = result.portfolioStdDevs;

                    var i;
                    var minStd = Number.MAX_VALUE;
                    var minStdIndx = -1;
                    for(i = 0; i < numOfRandomWeights; i++) {
                        if (pStd[i] < minStd) {
                            minStdIndx = i;
                            minStd = pStd[i];
                        }
                    }
                    
                    console.log("min Std, %: ", minStd * 100);
                    console.log("return rate, %: ", pR[minStdIndx] * 100);
                    console.log("weights: ", JSON.stringify(result.portfolioWeightsMxN[minStdIndx]));
                    var actualMinRisk = (minStd * 100).toFixed(2);
                    var expectedMinRisk =  (7.333752).toFixed(2);
                    
                    assert.equal(actualMinRisk, expectedMinRisk);
                })
                .then(function(){done();}, function(error){done(error);});
        });
    });
});


