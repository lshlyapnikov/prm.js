// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, describe, it */

var yahooFinanceApi = require("../../main/server/yahooFinanceApi");
var utils = require("../../main/server/utils");
var async = require("../../main/server/async");
var assert = require("assert");

describe("yahooFinanceApi @IntegrationTest", function () {
  describe("#loadStockHistoryAsString()", function () {
    it("should load expected CSV string  [3 days]", function (done) {
      yahooFinanceApi.loadStockHistoryAsString(
        "IBM",
        new Date(1975, 2, 3),
        new Date(1975, 2, 5),
        "d")
        .then(function (actualCsv) {
          assert.equal(expectedCsv, actualCsv);
        })
        .then(function () {
          done();
        }, function (error) {
          done(error);
        });
    });
    var expectedCsv = "Date,Open,High,Low,Close,Volume,Adj Close\n" +
      "1975-03-05,214.50,220.25,214.25,215.38,1867200,4.89\n" +
      "1975-03-04,220.00,224.75,214.25,214.50,2065600,4.87\n" +
      "1975-03-03,216.00,220.00,216.00,220.00,1267200,5.00\n";
    it("should load expected CSV string [1 day]", function (done) {
      var expectedCsv = "Date,Open,High,Low,Close,Volume,Adj Close\n" +
        "1975-03-05,214.50,220.25,214.25,215.38,1867200,4.89\n";
      yahooFinanceApi.loadStockHistoryAsString(
        "IBM",
        new Date(1975, 2, 5),
        new Date(1975, 2, 5),
        "d")
        .then(function (actualCsv) {
          assert.equal(expectedCsv, actualCsv);
        })
        .then(function () {
          done();
        }, function (error) {
          done(error);
        });
    });
    it("should return error due to unknown symbol", function (done) {
      yahooFinanceApi.loadStockHistoryAsString(
        "UnknownSymbol",
        new Date(2013, 3, 1),
        new Date(2013, 3, 1),
        "d")
        .then(function () {
          done(new Error("Expecting an error due to unknown symbol"));
        }, function (error) {
          async.assert(utils.defined(error), done);
          done();
        });
    });
  });
  describe("#loadStockHistory()", function () {
    it("[1] should load historical prices as array of arrays  [3 days]", function (done) {
      var expectedObject = [
        ["1975-03-05", "214.50", "220.25", "214.25", "215.38", "1867200", "4.89"],
        ["1975-03-04", "220.00", "224.75", "214.25", "214.50", "2065600", "4.87"],
        ["1975-03-03", "216.00", "220.00", "216.00", "220.00", "1267200", "5.00"]
      ];
      yahooFinanceApi.loadStockHistory(
        "IBM",
        new Date(1975, 2, 3),
        new Date(1975, 2, 5),
        "d",
        ["Date", "Open", "High", "Low", "Close", "Volume", "Adj Close"],
        [utils.noop, utils.noop, utils.noop, utils.noop, utils.noop, utils.noop, utils.noop]
      ).then(function (actualObject) {
          assert.equal(JSON.stringify(expectedObject), JSON.stringify(actualObject));
        }).then(function () {
          done();
        }, function (error) {
          done(error);
        });
    });
    it("[2] should load 'Adj Close' prices as Numbers [3 days]", function (done) {
      var expectedObject = [
        [4.89],
        [4.87],
        [5.0]
      ];
      yahooFinanceApi.loadStockHistory(
        "IBM",
        new Date(1975, 2, 3),
        new Date(1975, 2, 5),
        "d",
        ["Adj Close"],
        [utils.strToNumber]
      ).then(function (actualObject) {
          assert.equal(JSON.stringify(expectedObject), JSON.stringify(actualObject));
        }).then(function () {
          done();
        }, function (error) {
          done(error);
        });
    });
    it("[3] should load 'Volume' and 'Adj Close' prices as Numbers [3 days]", function (done) {
      var expectedObject = [
        [1867200, 4.89],
        [2065600, 4.87],
        [1267200, 5.00]
      ];
      yahooFinanceApi.loadStockHistory(
        "IBM",
        new Date(1975, 2, 3),
        new Date(1975, 2, 5),
        "d",
        ["Volume", "Adj Close"],
        [utils.strToNumber, utils.strToNumber]
      ).then(function (actualObject) {
          assert.equal(JSON.stringify(expectedObject), JSON.stringify(actualObject));
        }).then(function () {
          done();
        }, function (error) {
          done(error);
        });
    });
    it("[4] should return error due to unknown symbol [3 days]", function (done) {
      yahooFinanceApi.loadStockHistory(
        "UnknownSymbol",
        new Date(2013, 3, 10),
        new Date(2013, 3, 12),
        "d",
        ["Adj Close"],
        [function (str) {
          return Number(str);
        }])
        .then(function () {
          done(new Error("Expecting an eror due to unknown symbol"));
        }, function (error) {
          async.assert(error, done);
          done();
        });
    });
    it("[5] should return error due to unknown fieldName", function (done) {
      var UNKNOWN_FIELD_NAME = "UnknownFieldName";
      yahooFinanceApi.loadStockHistory(
        "IBM",
        new Date(1975, 2, 3),
        new Date(1975, 2, 5),
        "d",
        [UNKNOWN_FIELD_NAME],
        [utils.strToNumber]
      ).then(function () {
          done(new Error("Expecting an error due to uknown field name"));
        }, function (error) {
          async.assert(error, done);
          async.assert(error.message.indexOf("Unknown fieldName") >= 0, done);
          async.assert(error.message.indexOf(UNKNOWN_FIELD_NAME) >= 0, done);
          done();
        });
    });
    it("[6] should return error: 2 fields, but only 1 converter", function (done) {
      yahooFinanceApi.loadStockHistory(
        "IBM",
        new Date(1975, 2, 3),
        new Date(1975, 2, 5),
        "d",
        ["Volume", "Adj Close"],
        [utils.strToNumber]
      ).then(function () {
          done(new Error("Expecting an error: 2 fields -- 2 converters, passed only 1"));
        }, function (error) {
          async.assert(error, done);
          async.assert(error.message.indexOf("fieldNames.length") >= 0, done);
          async.assert(error.message.indexOf("fieldConverters.length") >= 0, done);
          done();
        });
    });
  });
});
