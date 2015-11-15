const pStats = require("./portfolioStats")
const pTheory = require("./portfolioTheory")

exports.PrmController = (loadHistoricalPrices) => ({
  /**
   *
   * @param {Object} symbols  Immutable.List, symbols   The stock symbols you are interested in
   * @param {Date} startDate  Specifies the start of the interval, inclusive
   * @param {Date} endDate    Specifies the end of the interval, inclusive
   * @param {Number} riskFreeRr Risk Free Return Rate
   * @return {Object}
   */
  porfolioStatistics: function (symbols, startDate, endDate, riskFreeRr) {
    const pricesMxN = symbols.flatMap(symbol =>
        loadHistoricalPrices(symbol, startDate, endDate, "d", ["Adj Close"], (s) => Number(s))
    ).toArray()

    const rrKxN = pStats.calculateReturnRatesFromPriceMatrix(pricesMxN)
    const expectedRrNx1 = pStats.mean(rrKxN)
    const rrCovarianceNxN = pStats.covariance(rrKxN, false)

    // Global Min Variance Efficient Portfolio
    const gmvePortfolio = pTheory.GlobalMinimumVarianceEfficientPortfolio.calculate(expectedRrNx1, rrCovarianceNxN)
    // Tangency Portfolio
    const tangencyPortfolio = pTheory.TangencyPortfolio.calculate(expectedRrNx1, rrCovarianceNxN, riskFreeRr)

    return {gmvePortfolio: gmvePortfolio, tangencyPortfolio: tangencyPortfolio}
  }
})


