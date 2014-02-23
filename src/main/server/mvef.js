/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, exports */

var utils = require("./utils");
var linearAlgebra = require("./linearAlgebra");
var portfolioStats = require("./portfolioStats");
var yahooFinanceApi = require("./../yahoo/yahooFinanceApi");
var Q = require("q");

// function extractPrices(objArr) {
//     var result = utils.convertArrayElemetns(objArr, function(obj) {
//         return Number(obj["Adj Close"]);
//     });
//     return result;
// }

/**
 * Generates portfolio MVEF for the specified symbols, using
 * Yahoo Finance API as a historical prices provider.
 *
 * @param {function} loadHistoricalPrices   function(symbol) provider of historical prices,
 *                                          takes a symbol,  returns a promise to
 *                                          an array of historical prices;
 * @param {Array} symbols   The stock symbols you are interested in,
 *                          1st parameter in loadStockHistoryAsObject();
 * @param {Date} fromDate   Specifies the start of the interval, inclusive,
 *                          2nd parameter in loadStockHistoryAsObject();
 * @param {Date} toDate     Specifies the end of the interval, inclusive,
 *                          3rd parameter in loadStockHistoryAsObject();
 * @param {Character} interval   Where: 'd' - Daily, 'w' - Weekly, 'm' - Monthly,
 *                               4th parameter in loadStockHistoryAsObject();
 * @param {Number} numberOfRandomWeights   Number of random stock weights to be  used to
 *                                         to generate MVEF.
 * @return {Object}   portfolioExpReturnRates: {Array}, portfolioStdDevs: {Array}.
 */
function mvefYahooFinanceApi(symbols, fromDate, toDate, interval, numberOfRandomWeights) {
  function loadHistoricalPricesFromYahoo(symbol) {
    return yahooFinanceApi.loadStockHistory(symbol, fromDate, toDate, interval,
      ["Adj Close"], [utils.strToNumber]);
  }

  return mvef(loadHistoricalPricesFromYahoo, symbols, numberOfRandomWeights);
}

/**
 * Generates portfolio MVEF for the specified symbols, using
 * historical prices provided by loadHistoricalPrices function.
 *
 * @param {function} loadHistoricalPrices   function(symbol) provider of historical prices,
 *                                          takes a symbol,  returns a promise to an array of
 *                                          historical prices;
 * @param {Array} symbols   The stock symbols you are interested in,
 * @param {Number} numberOfRandomWeights   Number of random stock weights to be  used to
 *                                         to generate MVEF.
 * @return {Object}   portfolioExpReturnRates: {Array}, portfolioStdDevs: {Array}.
 */
function mvef(loadHistoricalPrices, symbols, numberOfRandomWeights) {
  var deferred = Q.defer();

  if("function" !== typeof loadHistoricalPrices) {
    deferred.reject(new Error("InvalidArgument: loadHistoricalPrices must be a function"));
    return deferred.promise;
  }

  if(undefined === symbols || 0 === symbols.length) {
    deferred.reject(new Error("InvalidArgument: symbols array is either undefined or empty"));
    return deferred.promise;
  }

  if(undefined === numberOfRandomWeights) {
    deferred.reject(new Error("InvalidArgument: numberOfRandomWeights is undefined"));
    return deferred.promise;
  }

  var m = numberOfRandomWeights;
  var n = symbols.length;

  var promises = new Array(n);

  for(var i = 0; i < n; i++) {
    promises[i] = loadHistoricalPrices(symbols[i]);
  }

  Q.allSettled(promises)
    .then(function(promises) {
      var transposedPriceMatrix = new Array(n);
      var p;
      for(var i = 0; i < n; i++) {
        p = promises[i];
        if(p.state === 'fulfilled') {
          transposedPriceMatrix[i] = p.value;
        } else {
          deferred.reject(new Error("Could not load symbol: " + symbols[i] +
            ", i: " + i));
        }
      }
      return transposedPriceMatrix;
    })
    .then(function(transposedPriceMatrix) {
      var result = mvefFromHistoricalPrices(
        utils.generateRandomWeightsMatrix(m, n),
        linearAlgebra.transpose(transposedPriceMatrix));

      return result;
    })
    .then(function(result) {
      deferred.resolve(result);
    })
    .done();

  return deferred.promise;
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
 * @return {Object}   portfolioExpReturnRates: {Array}, portfolioStdDevs: {Array}.
 */
function mvefFromHistoricalPrices(weightsMxN, pricesKxN) {
  // K x N (actually K-1 x N)
  var returnRatesKxN = portfolioStats.calculateReturnRatesFromPriceMatrix(pricesKxN);
  var result = mvefFromHistoricalReturnRates(weightsMxN, returnRatesKxN);
  return result;
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
 * @return {Object}   portfolioExpReturnRates: {Array}, portfolioStdDevs: {Array}.
 */
function mvefFromHistoricalReturnRates(weightsMxN, returnRatesKxN) {
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
  for(i = 0; i < m; i++) {
    weights1xN = weightsMxN[i];
    portfolioStdDevArr[i] = portfolioStats.portfolioStdDev([weights1xN], covarianceNxN);
  }

  if(portfolioExpReturnRateArr.length !== m) {
    throw new Error("InvalidState: portfolioExpReturnRateArr.length !== " + m);
  }

  if(portfolioStdDevArr.length !== m) {
    throw new Error("InvalidState: portfolioStdDevArr.length !== " + m);
  }

  var result = {
    portfolioExpReturnRates: portfolioExpReturnRateArr,
    portfolioStdDevs: portfolioStdDevArr,
    portfolioWeightsMxN: weightsMxN
  };

  return result;
}

exports.mvefYahooFinanceApi = mvefYahooFinanceApi;
exports.mvef = mvef;
exports.mvefFromHistoricalPrices = mvefFromHistoricalPrices;
exports.mvefFromHistoricalReturnRates = mvefFromHistoricalReturnRates;
