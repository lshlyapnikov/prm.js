/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, exports */

var utils = require("./utils");
var numeric = require("numeric");
var portfolioStats = require("portfolioStats");
var yahooFinanceApi = require("yahooFinanceApi");

function extractPrices(objArr) {
    var result = utils.convertArrayElemetns(objArr, function(obj) {
        return Number(obj["Adj Close"]);
    });
    return result;
}

/**
 * Loads stock historical prices from Yahoo Finance as a CSV string.
 *
 * @param {String} symbol   The stock symbol you are interested in;
 * @param {Date} fromDate   Specifies the start of the interval, inclusive;
 * @param {Date} toDate     Specifies the end of the interval, inclusive;
 * @param {Character} interval   Where: 'd' - Daily, 'w' - Weekly, 'm' - Monthly
 * @param {Function} callback    Callback function that would be called when all data is prepared.
 */
function mvef(symbols, fromDate, toDate, interval, callback) {
    if (undefined === symbols || 0 === symbols.length) {
        throw {
            name: "InvalidArgument",
            message: "symbols array is either undefined or empty"
        };
    }

    if (undefined === fromDate) {
        throw {
            name: "InvalidArgument",
            message: "fromDate argument is undefined"
        };
    }

    if (undefined === toDate) {
        throw {
            name: "InvalidArgument",
            message: "toDate argument is undefined"
        };
    }

    if (undefined === interval) {
        throw {
            name: "InvalidArgument",
            message: "interval argument is undefined"
        };
    }

    var n = symbols.length;
    var transposedPriceMatrix = new Array(n);

    var loadCounter = 0;

    function load_(index) {
        yahooFinanceApi.loadStockHistoryAsObject(symbols[index], fromDate, toDate, interval, function(oneStockHistory) {
            transposedPriceMatrix[index] = extractPrices(oneStockHistory);
            loadCounter++;
            if (loadCounter === n) {
                mvefFromHistoricalPrices(numeric.transpose(transposedPriceMatrix), callback);
            }
        });
    }

    for (var i = 0; i < n; i++) {
        load_(i);
    }        
}

/**
 * Calculates portofolio returns.
 *
 * @param {Matrix} priceMatrix    M x N matrix, where 
 *                                M is the number of historical intervals.
 *                                N is the number of stocks in portfolio,
 * @param {Function} callback     Callback function that would be called when all data is prepared.
 */
function mvefFromHistoricalPrices(priceMatrix, callback) {
    // M x N (actually M-1 x N)
    var returnRatesMxN = portfolioStats.calculateReturnRatesFromPriceMatrix(priceMatrix);
    // N x 1
    var expReturnRatesNx1 = portfolioStats.mean(returnRatesMxN);
    // N x N
    var covarianceNxN = portfolioStats.covariance(returnRatesMxN);

    var dimensions = numeric.dim(returnRatesMxN);
    var m = dimensions[0];
    var n = dimensions[1];

    var weightsMatrixMxN = utils.generateRandomWeightsMatrix(m, n);
    var transposedWeightsMatrixNxM = numeric.transpose(weightsMatrixMxN);

    // MxN x Nx1 = Nx1
    var porftolioExpdReturnRates = numeric.dot(transposedWeightsMatrixNxM, expReturnRatesMx1);

    // need 1xN x NxM = 1xM

    var standardDeviations = numeric.dot(transposedWeightsMatrix,
                                         covarianceMatrix,
                                         weightsMatrix);

    return {
        portfolioReturns: expectedReturns,
        portfolioStdDevs: standardDeviations
    };
}

exports.mvefFromHistoricalPrices = mvefFromHistoricalPrices;
exports.mvef = mvef;
