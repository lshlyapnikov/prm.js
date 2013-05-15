// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global describe, it, require, console */

var mvef = require("../../main/server/mvef");
var yahooFinanceApi = require("../../main/server/yahooFinanceApi");

describe("mvef @IntegrationTest", function() {
    describe("#mvef() should load historical prices and return MVEF numbers", function() {
        it("[1] should calculate mvef", function(done) {
            var numOfRandomWeights = 100;
            mvef.mvef(yahooFinanceApi.loadStockHistory,
                      ["NYX", "INTC"],
                      new Date(2013, 03, 10),
                      new Date(2013, 03, 12),
                      "d", numOfRandomWeights)
                .then(function(result) {
                    console.log("result: " + JSON.stringify(result));
                })
                .then(function(){done();}, function(error){done(error);});
        });
    });
});

