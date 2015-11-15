const pStats = require("./portfolioStats")
const pTheory = require("./portfolioTheory")

exports.PrmController = (loadHistoricalPrices) => ({
  /**
   *
   * @param {Object} symbols  Immutable.List, symbols   The stock symbols you are interested in
   * @param {Date} startDate  Specifies the start of the interval, inclusive
   * @param {Date} endDate    Specifies the end of the interval, inclusive
   * @return {Object}
   */
  mvef: function (symbols, startDate, endDate) {
    const pricesMxN = symbols.flatMap(symbol =>
        loadHistoricalPrices(symbol, startDate, endDate, "d", ["Adj Close"], (s) => Number(s))
    ).toArray()

    const rrKxN = pStats.calculateReturnRatesFromPriceMatrix(pricesMxN)
    const rrCovarianceNxN = pStats.covariance(rrKxN, false)

    // Global Min Variance Efficient Portfolio
    const gmvepStats = pStats.createPortfolioStats(
      pTheory.GlobalMinimumVarianceEfficientPortfolio.calculateWeightsFromReturnRatesCovariance(rrCovarianceNxN),
      pStats.mean(rrKxN),
      rrCovarianceNxN)

    return {gmvep: gmvepStats}
  }
})


