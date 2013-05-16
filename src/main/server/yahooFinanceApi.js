/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, exports */

var request = require("request");
var csv = require("csv");
var Q = require("q");

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
 *
 * @return {Promise} that contains CSV string.
 */
function loadStockHistoryAsString(symbol, fromDate, toDate, interval) {
    var deferred = Q.defer();

    if (undefined === symbol) {
        deferred.reject(new Error("InvalidArgument: symbols array is either undefined or empty"));
        return deferred.promise;
    }

    if (undefined === fromDate) {
        deferred.reject(new Error("InvalidArgument: fromDate argument is undefined"));
        return deferred.promise;
    }

    if (undefined === toDate) {
        deferred.reject(new Error("InvalidArgument: toDate argument is undefined"));
        return deferred.promise;
    }

    if (undefined === interval) {
        deferred.reject(new Error("InvalidArgument: interval argument is undefined"));
        return deferred.promise;
    }

    var url = createYahooStockHistoryUrl(symbol, fromDate, toDate, interval);
    request.get(url, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            deferred.resolve(body);
        } else {
            var errStr = "Cannot retrive historical prices for symbol: " + symbol +
                ", fromDate: " + fromDate + ", toDate: " + toDate + ", interval: " + interval +
                ", server error: " + error + ", response.statusCode: " + response.statusCode;
            deferred.reject(new Error(errStr));
        }
    });

    return deferred.promise;
}

/**
 * Loads stock historical prices from Yahoo Finance as an Object.
 *
 * @param {String} symbol   The stock symbol you are interested in;
 * @param {Date} fromDate   Specifies the start of the interval, inclusive;
 * @param {Date} toDate     Specifies the end of the interval, inclusive;
 * @param {Character} interval   Where: 'd' - Daily, 'w' - Weekly, 'm' - Monthly;
 * @param {Array} fieldNames   fields that should be extracted from the CSV;
 * @param {Array} fieldConverters   field converters;
 *
 * @return {Q.promise}   Array of values
 */
function loadStockHistory(symbol, fromDate, toDate, interval, fieldNames, fieldConverters) {
    var deferred = Q.defer();

    if (undefined === fieldNames || 0 === fieldNames.length) {
        deferred.reject(new Error("fieldNames array is either undefined or empty"));
        return deferred.promise;
    }

    if (undefined === fieldConverters || 0 === fieldConverters.length) {
        deferred.reject(new Error("fieldConverters array is either undefined or empty"));
        return deferred.promise;
    }

    if (fieldNames.length !== fieldConverters.length) {
        deferred.reject(new Error("fieldNames.length must be equal to fieldConverters.length"));
        return deferred.promise;
    }

    loadStockHistoryAsString(symbol, fromDate, toDate, interval)
        .then(function(csvStr) {
            return extractFields(csvStr, fieldNames, fieldConverters);
        }).then(function(arr) {
            return deferred.resolve(arr);
        }, function(error) {
            deferred.reject(error);
        })
        .done();

    return deferred.promise;
}

function extractFields(csvStr, fieldNames, fieldConverters) {
    var deferred = Q.defer();

    var result = [];
    var fieldIndexes = new Array(fieldNames.length);
    var i, j;
    var strValue, converter, extractedRow;
    
    csv().from(csvStr)
    .on("record", function(row, index) {
        // first column contains field names
        if (0 === index) {
            // populate fieldIndexes array, find index of every specified fieldName
            for (i = 0; i < fieldNames.length; i++) {
                j = row.indexOf(fieldNames[i]);
                if (j < 0) {
                    throw new Error("Unknown fieldName: " + fieldNames[i] +
                                    ", known fieldNames: " + JSON.stringify(row));
                }
                fieldIndexes[i] = j;
            }
        } else {
            extractedRow = new Array(fieldIndexes.length);
            // iterate over all fieldIndexes
            for (i = 0; i < fieldIndexes.length; i++) {
                j = fieldIndexes[i]; // get the index of the field
                strValue = row[j]; // field value as string
                converter = fieldConverters[i]; // get converter for the field
                extractedRow[i] = converter(strValue);
            }
            result.push(extractedRow);
        }
    })
    .on("end", function(count) {
        if ((count - 1) !== result.length) {
            deferred.reject(new Error("expected result.length: " + (count - 1) +
                                      ", but actual result.length: " + result.length));
        } else {
            deferred.resolve(result);
        }
    })
    .on("error", function(error) {
        deferred.reject(error);
    });

    return deferred.promise;
}

exports.loadStockHistoryAsString = loadStockHistoryAsString;
exports.loadStockHistory = loadStockHistory;
