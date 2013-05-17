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
var testData = require("./testData");

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
            var prices = testData.historicalPrices_INTC_NYX;

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
                    //console.log("result: " + JSON.stringify(result, null, 4));
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


