// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* jshint -W033 */
/* jshint -W119 */

var Rx = require('rx')
var linearAlgebra = require("./linearAlgebra");
var portfolioStats = require("./portfolioStats");
var yahooFinanceApi = require("./../yahoo/yahooFinanceApi");


exports.AppController = {

  /**
   * Loads stock prices from Yahoo Finance
   *
   * @param {Array} symbols   The stock symbols you are interested in, 1st parameter in loadStockHistoryAsObject();
   * @param {Date} fromDate   Specifies the start of the interval, inclusive, 2nd parameter in loadStockHistoryAsObject();
   * @param {Date} toDate     Specifies the end of the interval, inclusive, 3rd parameter in loadStockHistoryAsObject();
   * @param {String} interval   Where: 'd' - Daily, 'w' - Weekly, 'm' - Monthly, 4th parameter in loadStockHistoryAsObject();
   * @return {Object}         RxObservable[Array], one element contains historical prices for the specified interval.
   */
  loadHistoricalPricesFromYahoo: function (symbols, fromDate, toDate, interval) {
    return yahooFinanceApi.loadStockHistory(symbol, fromDate, toDate, interval,
      ["Adj Close"], [utils.strToNumber])
  }
}