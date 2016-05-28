const Rx = require("rx")
const _ = require("underscore")
const la = require("./linearAlgebra")

function wrapper(s, r) {
  return {symbol: s, result: r}
}

function convertArrayOfWrappedResultsToPriceMatrix(symbols, arr) {
  var symbolToPricesMap = []
  _(arr).each(a => symbolToPricesMap[a.symbol] = a.result)
  var nXmX1 = []
  _(symbols).each(s => nXmX1.push(symbolToPricesMap[s]))
  const n = nXmX1.length
  const m = nXmX1[0].length
  const pricesMxN = la.matrix(m, n, 0)
  var c = 0
  var r = 0
  for (c = 0; c < n; c++) {
    for (r = 0; r < m; r++) {
      pricesMxN[r][c] = nXmX1[c][r][0]
    }
  }
  return pricesMxN
}

/**
 * @param {Function}  loadHistoricalPrices   Returns Stock Historical Prices, see ./../yahoo/yahooFinanceApi.js
 * @param {Object}    pStats                 Portfolio State Object, see ./portfolioStats.js
 * @param {Object}    pTheory                Portfolio Theory Object, see ./portfolioTheory.js
 * @constructor
 */
exports.create = (loadHistoricalPrices, pStats, pTheory) => ({
  /**
   * Returns portfolio analysis.
   *
   * @param {Object} symbols  Immutable.List, symbols   The stock symbols you are interested in
   * @param {Date} startDate  Specifies the start of the interval, inclusive
   * @param {Date} endDate    Specifies the end of the interval, inclusive
   * @param {Number} riskFreeRr Risk Free Return Rate
   * @returns {{globalMinVarianceEfficientPortfolio: *, tangencyPortfolio: *, efficientPortfolioFrontier: *}}
   */
  analyzeUsingPortfolioHistoricalPrices: function (symbols, startDate, endDate, riskFreeRr) {
    // Rx.Observable.from(["a", "b"]).flatMap(x => f(x).toArray()).toArray().subscribe(a => console.log(a))
    // [ [ 10, 20, 30, 40 ], [ 10, 20, 30, 40 ] ]
    return Rx.Observable.from(symbols).flatMap(symbol =>
        loadHistoricalPrices(symbol, startDate, endDate, "d", ["Adj Close"], [(s) => Number(s)]).map(r => wrapper(symbol, r))
    ).toArray().map(arr => {
        const pricesMxN = convertArrayOfWrappedResultsToPriceMatrix(symbols, arr)
        const rrKxN = pStats.calculateReturnRatesFromPriceMatrix(pricesMxN)
        const expectedRrNx1 = pStats.mean(rrKxN)
        const rrCovarianceNxN = pStats.covariance(rrKxN, false)
        return this.analyzeUsingPortfolioStatistics(rrKxN, expectedRrNx1, rrCovarianceNxN, riskFreeRr)
      }
    )
  },

  /**
   * * Returns portfolio analysis.
   *
   * @param {Array.<Array.<Number>>} rrKxN             Return Rates Matrix
   * @param {Array.<Array.<Number>>} expectedRrNx1     Expected Return Rates Matrix
   * @param {Array.<Array.<Number>>} rrCovarianceNxN   Return Rates Covariance Matrix
   * @param {Number}                 riskFreeRr        Risk Free Return Rate
   * @returns {{globalMinVarianceEfficientPortfolio: *, tangencyPortfolio: *, efficientPortfolioFrontier: *}}
   */
  analyzeUsingPortfolioStatistics: function (rrKxN, expectedRrNx1, rrCovarianceNxN, riskFreeRr) {
    const globalMinVarianceEfficientPortfolio =
      pTheory.GlobalMinimumVarianceEfficientPortfolio.calculate(expectedRrNx1, rrCovarianceNxN)
    const tangencyPortfolio = pTheory.TangencyPortfolio.calculate(expectedRrNx1, rrCovarianceNxN, riskFreeRr)
    const efficientPortfolioFrontier = pTheory.EfficientPortfolioFrontier.calculate(expectedRrNx1, rrCovarianceNxN)

    return {
      input: {
        rrKxN: rrKxN, expectedRrNx1: expectedRrNx1, rrCovarianceNxN: rrCovarianceNxN, riskFreeRr: riskFreeRr
      },
      output: {
        globalMinVarianceEfficientPortfolio: globalMinVarianceEfficientPortfolio,
        tangencyPortfolio: tangencyPortfolio,
        efficientPortfolioFrontier: efficientPortfolioFrontier
      }
    }
  }
})
