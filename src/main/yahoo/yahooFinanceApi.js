/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

const request = require("request")
const Q = require("q")
const _ = require("underscore-contrib")
const utils = require("../server/utils.js")

const log = utils.logger("yahooFinanceApi")

/**
 * @private
 */
function createYahooStockHistoryUrl(symbol, fromDate, toDate, interval) {
  // https://code.google.com/p/yahoo-finance-managed/wiki/csvHistQuotesDownload
  var url = "http://ichart.yahoo.com/table.csv"
  // symbol
  url += "?s=" + symbol
  // fromDate
  url += "&a=" + fromDate.getMonth()
  url += "&b=" + fromDate.getDate()
  url += "&c=" + fromDate.getFullYear()
  // toDate
  url += "&d=" + toDate.getMonth()
  url += "&e=" + toDate.getDate()
  url += "&f=" + toDate.getFullYear()
  // interval: 'd' - Daily, 'w' - Weekly, 'm' - Monthly
  url += "&g=" + interval
  // static part
  url += "&ignore=.csv"

  return url
}

/**
 * Loads stock historical prices from Yahoo Finance as a CSV string.
 *
 * @param {String} symbol   The stock symbol you are interested in
 * @param {Date} fromDate   Specifies the start of the interval, inclusive
 * @param {Date} toDate     Specifies the end of the interval, inclusive
 * @param {char} interval   Where: 'd' - Daily, 'w' - Weekly, 'm' - Monthly
 *
 * @return {promise} a Promise that contains CSV string.
 */
function loadStockHistoryAsString(symbol, fromDate, toDate, interval) {
  var deferred = Q.defer()

  if (_.isUndefined(symbol)) {
    deferred.reject(new Error("InvalidArgument: symbols array is either undefined or empty"))
    return deferred.promise
  }

  if (_.isUndefined(fromDate)) {
    deferred.reject(new Error("InvalidArgument: fromDate argument is undefined"))
    return deferred.promise
  }

  if (_.isUndefined(toDate)) {
    deferred.reject(new Error("InvalidArgument: toDate argument is undefined"))
    return deferred.promise
  }

  if (_.isUndefined(interval)) {
    deferred.reject(new Error("InvalidArgument: interval argument is undefined"))
    return deferred.promise
  }

  var url = createYahooStockHistoryUrl(symbol, fromDate, toDate, interval)
  request.get(url, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      deferred.resolve(body)
    } else {
      var errStr = "Cannot retrieve historical prices for symbol: " + symbol +
        ", fromDate: " + fromDate + ", toDate: " + toDate + ", interval: " + interval +
        ", server error: " + error + ", response.statusCode: " + response.statusCode
      log.error(errStr)
      deferred.reject(new Error(errStr))
    }
  })

  return deferred.promise
}

/**
 * Loads stock historical prices from Yahoo Finance as an Object.
 *
 * @param {String} symbol   The stock symbol you are interested in
 * @param {Date} fromDate   Specifies the start of the interval, inclusive
 * @param {Date} toDate     Specifies the end of the interval, inclusive
 * @param {char} interval   Where: 'd' - Daily, 'w' - Weekly, 'm' - Monthly
 * @param {Array} fieldNames   fields that should be extracted from the CSV
 * @param {Array} fieldConverters   field converters
 *
 * @return {Q.promise}   Array of values
 */
function loadStockHistory(symbol, fromDate, toDate, interval, fieldNames, fieldConverters) {
  var deferred = Q.defer()

  if (undefined === fieldNames || 0 === fieldNames.length) {
    deferred.reject(new Error("fieldNames array is either undefined or empty"))
    return deferred.promise
  }

  if (undefined === fieldConverters || 0 === fieldConverters.length) {
    deferred.reject(new Error("fieldConverters array is either undefined or empty"))
    return deferred.promise
  }

  if (fieldNames.length !== fieldConverters.length) {
    deferred.reject(new Error("fieldNames.length must be equal to fieldConverters.length"))
    return deferred.promise
  }

  loadStockHistoryAsString(symbol, fromDate, toDate, interval)
    .then((csvStr) => {
      if (log.isDebugEnabled) log.debug("csvStr: " + csvStr)
      const result = utils.parseCsvStr(csvStr, fieldNames, fieldConverters)
      result.reverse()
      deferred.resolve(result)
    }).then((arr) => {
      var result = (undefined === arr) ? [] : arr.reverse()
      return deferred.resolve(result)
    }, (error) => {
      deferred.reject(error)
    })
    .done()

  return deferred.promise
}

exports.loadStockHistoryAsString = loadStockHistoryAsString
exports.loadStockHistory = loadStockHistory
