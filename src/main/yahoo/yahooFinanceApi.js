/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

const request = require("request")
const Rx = require('rx');
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
 * @return {observable} a Rx.Observable that publishes CSV string.
 */
function loadStockHistoryAsString(symbol, fromDate, toDate, interval) {
  if (_.isUndefined(symbol)) {
    return Rx.Observable.throw(new Error("InvalidArgument: symbols array is either undefined or empty"))
  }

  if (_.isUndefined(fromDate)) {
    return Rx.Observable.throw(new Error("InvalidArgument: fromDate argument is undefined"))
  }

  if (_.isUndefined(toDate)) {
    return Rx.Observable.throw(new Error("InvalidArgument: toDate argument is undefined"))
  }

  if (_.isUndefined(interval)) {
    return Rx.Observable.throw(new Error("InvalidArgument: interval argument is undefined"))
  }

  return Rx.Observable.create((observer) => {
    const url = createYahooStockHistoryUrl(symbol, fromDate, toDate, interval)
    request.get(url, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        observer.onNext(body)
        observer.onCompleted()
      } else {
        var errStr = "Cannot retrieve historical prices for symbol: " + symbol +
          ", fromDate: " + fromDate + ", toDate: " + toDate + ", interval: " + interval +
          ", server error: " + error + ", response.statusCode: " + response.statusCode
        log.error(errStr)
        observer.onError(new Error(errStr))
      }
    })
  })
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
  if (_.isUndefined(fieldNames) || 0 === fieldNames.length) {
    return Rx.Observable.throw(new Error("fieldNames array is either undefined or empty"))
  }

  if (_.isUndefined(fieldConverters) || 0 === fieldConverters.length) {
    return Rx.Observable.throw(new Error("fieldConverters array is either undefined or empty"))
  }

  if (fieldNames.length !== fieldConverters.length) {
    return Rx.Observable.throw(new Error("fieldNames.length must be equal to fieldConverters.length"))
  }

  return loadStockHistoryAsString(symbol, fromDate, toDate, interval).map((csvStr) => {
    if (log.isDebugEnabled) log.debug("csvStr: " + csvStr)
    return utils.parseCsvStr(csvStr, fieldNames, fieldConverters)
  }).map((arr) => {
    return _.isUndefined(arr) ? [] : arr.reverse()
  })
}

exports.loadStockHistoryAsString = loadStockHistoryAsString
exports.loadStockHistory = loadStockHistory
