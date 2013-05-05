// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, describe, it, console */

var yahooFinanceApi = require("../../main/server/yahooFinanceApi");
var utils = require("../../main/server/utils");
var assert = require("assert");

// turned it off to avoid spaming yahoo finance
// should be turned into some kind of integration test
describe("yahooFinanceApi", function() {
    describe("#loadStockHistoryAsString() [3 days]", function() {
        it("should load expected CSV string", function(done) {
            var expectedCsv = "Date,Open,High,Low,Close,Volume,Adj Close\n" +
                "2013-04-12,37.86,38.05,37.76,38.05,783400,38.05\n" + 
                "2013-04-11,37.97,38.18,37.81,37.99,931200,37.99\n" +
                "2013-04-10,37.57,37.99,37.46,37.93,1043600,37.93\n";
            yahooFinanceApi.loadStockHistoryAsString(
                "NYX", 
                new Date(2013, 03, 10), 
                new Date(2013, 03, 12), 
                "d")
                .then(function(actualCsv) {
                    assert.equal(expectedCsv, actualCsv);
                })
                .then(function(){done();}, function(error){done(error);});
        });
    });
    describe("#loadStockHistoryAsString() [1 day]", function() {
        it("should load expected CSV string", function(done) {
            var expectedCsv = "Date,Open,High,Low,Close,Volume,Adj Close\n" + 
                "2013-04-01,38.65,38.75,38.20,38.32,820600,38.32\n";
            yahooFinanceApi.loadStockHistoryAsString(
                "NYX", 
                new Date(2013, 03, 1), 
                new Date(2013, 03, 1), 
                "d")
                .then(function(actualCsv) {
                    assert.equal(expectedCsv, actualCsv);
                })
                .then(function(){done();}, function(error){done(error);});
        });
    });
    describe("#loadStockHistoryAsString() [1 day]", function() {
        it("should return error due to unknown symbol", function(done) {
            yahooFinanceApi.loadStockHistoryAsString(
                "UnknownSymbol", 
                new Date(2013, 03, 1), 
                new Date(2013, 03, 1), 
                "d")
                .then(function() {
                    done(new Error("Expecting an eror due to unknown symbol"));
                }, function(error) {
                    assert.ok(error, "Expecting an error due to unknown symbol");
                    done();
                });
        });
    });
    describe("#loadStockHistory() [3 days]", function() {
        it("should load historical prices as array of arrays", function(done) {
            var expectedObject = [
                ["2013-04-12", "37.86", "38.05", "37.76", "38.05", "783400", "38.05"],
                ["2013-04-11", "37.97", "38.18", "37.81", "37.99", "931200", "37.99"],
                ["2013-04-10", "37.57", "37.99", "37.46", "37.93", "1043600", "37.93"]
            ];
            yahooFinanceApi.loadStockHistory(
                "NYX",
                new Date(2013, 03, 10),
                new Date(2013, 03, 12),
                "d",
                ["Date", "Open", "High", "Low", "Close", "Volume", "Adj Close"],
                [utils.noop, utils.noop, utils.noop, utils.noop, utils.noop, utils.noop, utils.noop]
            ).then(function(actualObject) {
                //assert.deepEqual(expectedObject, actualObject);
                console.log("actualObject: " + JSON.stringify(actualObject));
                assert.equal(JSON.stringify(expectedObject), JSON.stringify(actualObject));
            }) .then(function() {
                done();
            }, function(error) {
                done(error);
            });
        });
    });
    describe("#loadStockHistory() [3 days]", function() {
        it("should return error due to unknown symbol ", function(done) {
            yahooFinanceApi.loadStockHistory(
                "UnknownSymbol",
                new Date(2013, 03, 10),
                new Date(2013, 03, 12),
                "d",
                ["Adj Close"],
                [function (str) { return Number(str); }])
                .then(function(actualObject) {
                    console.log("actualObject: ", JSON.stringify(actualObject));
                    done(new Error("Expecting an eror due to unknown symbol"));
                }, function(error) {
                    console.log("error: ", error);
                    assert.ok(error, "Expecting an error due to unknown symbol");
                    done();
                });
        });
    });
});
