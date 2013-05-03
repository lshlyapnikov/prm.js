/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, exports */

var utils = require("./utils");
//var numeric = require("numeric");
var linearAlgebra = require("linearAlgebra");
var portfolioStats = require("portfolioStats");
var yahooFinanceApi = require("yahooFinanceApi");

function extractPrices(objArr) {
    var result = utils.convertArrayElemetns(objArr, function(obj) {
        return Number(obj["Adj Close"]);
    });
    return result;
}

/**
 * Generates portfolio MVEF for the specified symbols, using
 * historical prices from Yahoo Finance.
 *
 * @param {String} symbol   The stock symbol you are interested in;
 * @param {Date} fromDate   Specifies the start of the interval, inclusive;
 * @param {Date} toDate     Specifies the end of the interval, inclusive;
 * @param {Character} interval   Where: 'd' - Daily, 'w' - Weekly, 'm' - Monthly
 * @param {Number} numberOfRandomWeights   Number of random stock weights to be  used to
 *                                         to generate MVEF.
 * @param {Function} callback    Callback function that would be called when all data is prepared.
 */
function mvef(symbols, fromDate, toDate, interval, numberOfRandomWeights, callback) {
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

    var m = numberOfRandomWeights;
    var n = symbols.length;
    var transposedPriceMatrix = new Array(n);

    var loadCounter = 0;

    function load_(index) {
        yahooFinanceApi.loadStockHistoryAsObject(symbols[index], fromDate, toDate, interval, function(oneStockHistory) {
            transposedPriceMatrix[index] = extractPrices(oneStockHistory);
            loadCounter++;
            if (loadCounter === n) {
                mvefFromHistoricalPrices(
                    utils.generateRandomWeightsMatrix(m, n),
                    linearAlgebra.transpose(transposedPriceMatrix), 
                    callback);
            }
        });
    }

    for (var i = 0; i < n; i++) {
        load_(i);
    }        
}

/**
 * Calculates portofolio MVEF using provided price matrix.
 *
 * @param {Matrix} weightsMxN    M x N matrix of weights, where
 *                               M is the number of random draws,
 *                               N is the number of stocks in portfolio;
 * @param {Matrix} pricesKxN     K x N price matrix, where 
 *                               K is the number of historical prices,
 *                               N is the number of stocks in portfolio;
 * @param {Function} callback    Callback function that would be called when MVEF data calculated.
 */
function mvefFromHistoricalPrices(weightsMxN, pricesKxN, callback) {
    // K x N (actually K-1 x N)
    var returnRatesKxN = portfolioStats.calculateReturnRatesFromPriceMatrix(pricesKxN);
    mvefFromHistoricalReturnRates(weightsMxN, returnRatesKxN, callback);
}

/**
 * Calculates portofolio MVEF using provided price matrix.
 *
 * @param {Matrix} weightsMxN      M x N matrix of weights, where
 *                                 M is the number of random draws,
 *                                 N is the number of stocks in portfolio;
 * @param {Matrix} returnRatsKxN   K x N return rates matrix, where 
 *                                 K is the number of historical intervals,
 *                                 N is the number of stocks in portfolio;
 * @param {Function} callback    Callback function that would be called when MVEF data calculated.
 */
function mvefFromHistoricalReturnRates(weightsMxN, returnRatesKxN, callback) {
    // K x 1
    var expReturnRatesNx1 = portfolioStats.mean(returnRatesKxN);
    // N x N
    var covarianceNxN = portfolioStats.covariance(returnRatesKxN);

    var m = linearAlgebra.dim(weightsMxN)[0];
    //var n = linearAlgebra.dim(weightsMxN)[1];

    // MxN x Nx1 = Nx1
    var portfolioExpReturnRatesMx1 = linearAlgebra.multiplyMatrices(
        weightsMxN, expReturnRatesNx1);

    var portfolioExpReturnRateArr = linearAlgebra.transpose(portfolioExpReturnRatesMx1)[0];

    var i;
    var weights1xN;
    var portfolioStdDevArr = new Array(m);
    for (i = 0; i < m; i++) {
        weights1xN = weightsMxN[i];
        portfolioStdDevArr[i] = portfolioStats.portfolioStdDev([weights1xN], covarianceNxN);
    }

    if (portfolioExpReturnRateArr.length !== m) {
        throw {
            name: "InvalidState",
            message: "portfolioExpReturnRateArr.length !== " + m
        };
    }

    if (portfolioStdDevArr.length !== m) {
        throw {
            name: "InvalidState",
            message: "portfolioStdDevArr.length !== " + m
        };
    }

    var result = {
        portfolioExpReturnRates: portfolioExpReturnRateArr,
        portfolioStdDevs: portfolioStdDevArr
    };
    
    callback(result);
}

exports.mvef = mvef;
exports.mvefFromHistoricalPrices = mvefFromHistoricalPrices;
exports.mvefFromHistoricalReturnRates = mvefFromHistoricalReturnRates;
