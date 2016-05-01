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
    const pricesMxN = symbols.flatMap(symbol =>
        loadHistoricalPrices(symbol, startDate, endDate, "d", ["Adj Close"], (s) => Number(s))
    ).toArray()

    const rrKxN = pStats.calculateReturnRatesFromPriceMatrix(pricesMxN)
    const expectedRrNx1 = pStats.mean(rrKxN)
    const rrCovarianceNxN = pStats.covariance(rrKxN, false)
    this.analyzeUsingPortfolioStatistics(rrKxN, expectedRrNx1, rrCovarianceNxN, riskFreeRr)
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


