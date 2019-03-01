/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

// TODO make sure it typechecks with flow

const utils = require("./utils")
const linearAlgebra = require("./linearAlgebra")
const portfolioStats = require("./portfolioStats")
const Q = require("q")

/**
 * Generates portfolio MVEF for the specified symbols, using
 * historical prices provided by loadHistoricalPrices function.
 *
 * @param {function} loadHistoricalPrices   function(symbol) provider of historical prices,
 *                                          takes a symbol,  returns a promise to an array of
 *                                          historical prices
 * @param {Array} symbols   The stock symbols you are interested in,
 * @param {Number} numberOfRandomWeights   Number of random stock weights to be  used to
 *                                         to generate MVEF.
 * @return {Object}   portfolioExpReturnRates: {Array}, portfolioStdDevs: {Array}.
 */
function mvef(loadHistoricalPrices, symbols, numberOfRandomWeights) {
  var deferred = Q.defer()

  if ("function" !== typeof loadHistoricalPrices) {
    deferred.reject(new Error("InvalidArgument: loadHistoricalPrices must be a function"))
    return deferred.promise
  }

  if (undefined === symbols || 0 === symbols.length) {
    deferred.reject(new Error("InvalidArgument: symbols array is either undefined or empty"))
    return deferred.promise
  }

  if (undefined === numberOfRandomWeights) {
    deferred.reject(new Error("InvalidArgument: numberOfRandomWeights is undefined"))
    return deferred.promise
  }

  var m = numberOfRandomWeights
  var n = symbols.length

  var promises = new Array(n)

  for (var i = 0; i < n; i++) {
    promises[i] = loadHistoricalPrices(symbols[i])
  }

  Q.allSettled(promises)
    .then(function(promises) {
      var transposedPriceMatrix = new Array(n)
      var p
      for (var i = 0; i < n; i++) {
        p = promises[i]
        if (p.state === "fulfilled") {
          transposedPriceMatrix[i] = p.value
        } else {
          deferred.reject(new Error("Could not load symbol: " + symbols[i] + ", i: " + i))
        }
      }
      return transposedPriceMatrix
    })
    .then(function(transposedPriceMatrix) {
      return mvefFromHistoricalPrices(
        utils.generateRandomWeightsMatrix(m, n),
        linearAlgebra.transpose(transposedPriceMatrix)
      )
    })
    .then(function(result) {
      deferred.resolve(result)
    })
    .done()

  return deferred.promise
}

/**
 * Calculates portfolio MVEF using provided price matrix.
 *
 * @param {Array} weightsMxN     M x N matrix of weights, where
 *                               M is the number of random draws,
 *                               N is the number of stocks in portfolio
 * @param {Array} pricesKxN      K x N price matrix, where
 *                               K is the number of historical prices,
 *                               N is the number of stocks in portfolio
 * @return {Object}   portfolioExpReturnRates: {Array}, portfolioStdDevs: {Array}.
 */
function mvefFromHistoricalPrices(weightsMxN, pricesKxN) {
  // K x N (actually K-1 x N)
  var returnRatesKxN = portfolioStats.calculateReturnRatesFromPriceMatrix(pricesKxN)
  return mvefFromHistoricalReturnRates(weightsMxN, returnRatesKxN)
}

/**
 * Calculates portfolio MVEF using provided price matrix.
 *
 * @param {Array} weightsMxN       M x N matrix of weights, where
 *                                 M is the number of random draws,
 *                                 N is the number of stocks in portfolio
 * @param {Array} returnRatesKxN   K x N return rates matrix, where
 *                                 K is the number of historical intervals,
 *                                 N is the number of stocks in portfolio
 * @return {Object}   portfolioExpReturnRates: {Array}, portfolioStdDevs: {Array}.
 */
function mvefFromHistoricalReturnRates(weightsMxN, returnRatesKxN) {
  // K x 1
  var expReturnRatesNx1 = portfolioStats.mean(returnRatesKxN)
  // N x N
  var covarianceNxN = portfolioStats.covariance(returnRatesKxN)

  var m = linearAlgebra.dim(weightsMxN)[0]
  //var n = la.dim(weightsMxN)[1]

  // MxN x Nx1 = Nx1
  var portfolioExpReturnRatesMx1 = linearAlgebra.multiplyMatrices(weightsMxN, expReturnRatesNx1)

  var portfolioExpReturnRateArr = linearAlgebra.transpose(portfolioExpReturnRatesMx1)[0]

  var i
  var weights1xN
  var portfolioStdDevArr = new Array(m)
  for (i = 0; i < m; i++) {
    weights1xN = weightsMxN[i]
    portfolioStdDevArr[i] = portfolioStats.portfolioStdDev([weights1xN], covarianceNxN)
  }

  if (portfolioExpReturnRateArr.length !== m) {
    throw new Error("InvalidState: portfolioExpReturnRateArr.length !== " + m)
  }

  if (portfolioStdDevArr.length !== m) {
    throw new Error("InvalidState: portfolioStdDevArr.length !== " + m)
  }

  var result = Object.create(portfolioStats.PortfolioStats)
  result.weights = weightsMxN
  result.expectedReturnRate = portfolioExpReturnRateArr
  result.stdDev = portfolioStdDevArr
  return result
}

exports.mvef = mvef
exports.mvefFromHistoricalPrices = mvefFromHistoricalPrices
exports.mvefFromHistoricalReturnRates = mvefFromHistoricalReturnRates
