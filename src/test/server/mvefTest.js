// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global describe, it, require, console */

var mvef = require("../../main/server/mvef");
//var yahooFinanceApi = require("../../main/server/yahooFinanceApi");
var assert = require("assert");

describe("mvef @IntegrationTest", function() {
    describe("#mvefYahooFinanceApi()", function() {
        it("[1] should load historical prices from Yahoo Finance and return MVEF numbers", function(done) {
            var numOfRandomWeights = 100;
            mvef.mvefYahooFinanceApi(["NYX", "INTC"],
                                     new Date(2013, 03, 10),
                                     new Date(2013, 03, 12),
                                     "d",
                                     numOfRandomWeights)
                .then(function(result) {
                    console.log("result: " + JSON.stringify(result, null, 4));
                    assert.equal(numOfRandomWeights, result.portfolioExpReturnRates.length);
                    assert.equal(numOfRandomWeights, result.portfolioStdDevs.length);
                })
                .then(function(){done();}, function(error){done(error);});
        });
    });
});

