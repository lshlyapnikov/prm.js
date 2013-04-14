// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, describe, it */

var yahooFinanceApi = require("../../main/server/yahooFinanceApi");
var assert = require("assert");

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
                "d",
                function (error, response, actualCsv) {
                    assert.equal(expectedCsv, actualCsv);
                    done();
                });
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
                "d",
                function (error, response, actualCsv) {
                    assert.equal(expectedCsv, actualCsv);
                    done();
                });
        });
    });
    describe("#loadStockHistoryAsObject() [3 days]", function() {
        it("should load historical prices as an Object", function(done) {
            var expectedObject = [
                {Date: "2013-04-12", Open: "37.86", High: "38.05", Low: "37.76", Close: "38.05", Volume: "783400",  "Adj Close": "38.05"},
                {Date: "2013-04-11", Open: "37.97", High: "38.18", Low: "37.81", Close: "37.99", Volume: "931200",  "Adj Close": "37.99"},
                {Date: "2013-04-10", Open: "37.57", High: "37.99", Low: "37.46", Close: "37.93", Volume: "1043600", "Adj Close": "37.93"}
            ];
            yahooFinanceApi.loadStockHistoryAsObject(
                "NYX", 
                new Date(2013, 03, 10), 
                new Date(2013, 03, 12), 
                "d",
                function(actualObject) {
                    //assert.deepEqual(expectedObject, actualObject);
                    assert.equal(JSON.stringify(expectedObject), JSON.stringify(actualObject));
                    done();                
                });
        });
    });
});
