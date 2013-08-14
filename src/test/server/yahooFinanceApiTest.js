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
describe("yahooFinanceApi @IntegrationTest", function() {
    describe("#loadStockHistoryAsString()", function() {
        it("should load expected CSV string  [3 days]", function(done) {
            var expectedCsv = "Date,Open,High,Low,Close,Volume,Adj Close\n" +
                "2013-04-12,37.86,38.05,37.76,38.05,783400,37.77\n" + 
                "2013-04-11,37.97,38.18,37.81,37.99,931200,37.71\n" +
                "2013-04-10,37.57,37.99,37.46,37.93,1043600,37.65\n";
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
        it("should load expected CSV string [1 day]", function(done) {
            var expectedCsv = "Date,Open,High,Low,Close,Volume,Adj Close\n" + 
                "2013-04-01,38.65,38.75,38.20,38.32,820600,38.04\n";
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
    describe("#loadStockHistory()", function() {
        it("[1] should load historical prices as array of arrays  [3 days]", function(done) {
            var expectedObject = [
                ["2013-04-12", "37.86", "38.05", "37.76", "38.05", "783400", "37.77"],
                ["2013-04-11", "37.97", "38.18", "37.81", "37.99", "931200", "37.71"],
                ["2013-04-10", "37.57", "37.99", "37.46", "37.93", "1043600", "37.65"]
            ];
            yahooFinanceApi.loadStockHistory(
                "NYX",
                new Date(2013, 03, 10),
                new Date(2013, 03, 12),
                "d",
                ["Date", "Open", "High", "Low", "Close", "Volume", "Adj Close"],
                [utils.noop, utils.noop, utils.noop, utils.noop, utils.noop, utils.noop, utils.noop]
            ).then(function(actualObject) {
                //console.log("actualObject: " + JSON.stringify(actualObject));
                assert.equal(JSON.stringify(expectedObject), JSON.stringify(actualObject));
            }) .then(function() {
                done();
            }, function(error) {
                done(error);
            });
        });
        it("[2] should load 'Adj Close' prices as Numbers [3 days]", function(done) {
            var expectedObject = [
                [37.77],
                [37.71],
                [37.65]
            ];
            yahooFinanceApi.loadStockHistory(
                "NYX",
                new Date(2013, 03, 10),
                new Date(2013, 03, 12),
                "d",
                ["Adj Close"],
                [utils.strToNumber]
            ).then(function(actualObject) {
                assert.equal(JSON.stringify(expectedObject), JSON.stringify(actualObject));
            }) .then(function() {
                done();
            }, function(error) {
                done(error);
            });
        });
        it("[3] should load 'Volume' and 'Adj Close' prices as Numbers [3 days]", function(done) {
            var expectedObject = [
                [783400, 37.77],
                [931200, 37.71],
                [1043600, 37.65]
            ];
            yahooFinanceApi.loadStockHistory(
                "NYX",
                new Date(2013, 03, 10),
                new Date(2013, 03, 12),
                "d",
                ["Volume", "Adj Close"],
                [utils.strToNumber, utils.strToNumber]
            ).then(function(actualObject) {
                assert.equal(JSON.stringify(expectedObject), JSON.stringify(actualObject));
            }) .then(function() {
                done();
            }, function(error) {
                done(error);
            });
        });
        it("[4] should return error due to unknown symbol [3 days]", function(done) {
            yahooFinanceApi.loadStockHistory(
                "UnknownSymbol",
                new Date(2013, 03, 10),
                new Date(2013, 03, 12),
                "d",
                ["Adj Close"],
                [function (str) { return Number(str); }])
                .then(function() {
                    done(new Error("Expecting an eror due to unknown symbol"));
                }, function(error) {
                    console.log("expected error: ", error);
                    assert.ok(error, "Expecting an error due to unknown symbol");
                    done();
                });
        });
        it("[5] should return error due to unknown fieldName", function(done) {
            var UNKNOWN_FIELD_NAME = "UnknownFieldName";
            yahooFinanceApi.loadStockHistory(
                "NYX",
                new Date(2013, 03, 10),
                new Date(2013, 03, 12),
                "d",
                [UNKNOWN_FIELD_NAME],
                [utils.strToNumber]
            ).then(function() {
                done(new Error("Expecting an error due to uknown field name"));
            }, function(error) {
                console.log("expected error:", error);
                assert.ok(error, "Expecting an error due to uknown field name");
                done();
            });
        });
        it("[6] should return error: 2 fields, but only 1 converter", function(done) {
            yahooFinanceApi.loadStockHistory(
                "NYX",
                new Date(2013, 03, 10),
                new Date(2013, 03, 12),
                "d",
                ["Volume", "Adj Close"],
                [utils.strToNumber]
            ).then(function() {
                done(new Error("Expecting an error: 2 fields -- 2 converters, passed only 1"));
            }, function(error) {
                console.log("expected error:", error);
                assert.ok(error, "Expecting an error: 2 fields -- 2 converters, passed only 1");
                done();
            });
        });
    });
});
