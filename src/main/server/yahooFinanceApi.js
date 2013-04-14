/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, exports, console */

var request = require("request");
var csv = require('csv-stream');

/**
 * @private
 */
function createYahooStockHistoryUrl(symbol, fromDate, toDate, interval) {
    // https://code.google.com/p/yahoo-finance-managed/wiki/csvHistQuotesDownload
    var url = "http://ichart.yahoo.com/table.csv";
    // symbol
    url += "?s=" + symbol;
    // fromDate
    url += "&a=" + fromDate.getMonth();
    url += "&b=" + fromDate.getDate();
    url += "&c=" + fromDate.getFullYear();
    // toDate
    url += "&d=" + toDate.getMonth();
    url += "&e=" + toDate.getDate();
    url += "&f=" + toDate.getFullYear();
    // interval: 'd' - Daily, 'w' - Weekly, 'm' - Monthly
    url += "&g=" + interval;
    // static part
    url += "&ignore=.csv";

    return url;
}

/**
 * Loads stock historical prices from Yahoo Finance as a CSV string.
 *
 * @param {String} symbol   The stock symbol you are interested in;
 * @param {Date} fromDate   Specifies the start of the interval, inclusive;
 * @param {Date} toDate     Specifies the end of the interval, inclusive;
 * @param {Character} interval   Where: 'd' - Daily, 'w' - Weekly, 'm' - Monthly
 * @param {function} requestCallback   function(error, httpResponseObj, httpResponseBodyStr).
 */
function loadStockHistoryAsString(symbol, fromDate, toDate, interval, requestCallback) {
    var url = createYahooStockHistoryUrl(symbol, fromDate, toDate, interval);
    request.get(url, requestCallback);
}

/**
 * Loads stock historical prices from Yahoo Finance as an Object.
 *
 * @param {String} symbol   The stock symbol you are interested in;
 * @param {Date} fromDate   Specifies the start of the interval, inclusive;
 * @param {Date} toDate     Specifies the end of the interval, inclusive;
 * @param {Character} interval   Where: 'd' - Daily, 'w' - Weekly, 'm' - Monthly;
 * @param {function} objectLoadedCallback   function(object).
 */
function loadStockHistoryAsObject(symbol, fromDate, toDate, interval, objectLoadedCallback) {
    var url = createYahooStockHistoryUrl(symbol, fromDate, toDate, interval);
    var csvStream = csv.createStream();
    var result = [];
    request.get(url).pipe(csvStream)
        .on("error", function(err) {
            console.error("Cannot load stock historical prices, error: " + err);
        })
        .on("data", function(object) {
            result.push(object);
        })
        .on("end", function() {
            objectLoadedCallback(result);
        });
}

exports.loadStockHistoryAsString = loadStockHistoryAsString;
exports.loadStockHistoryAsObject = loadStockHistoryAsObject;
