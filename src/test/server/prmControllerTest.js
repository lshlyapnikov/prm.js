/* global describe, it */

const prmController = require("../../main/server/prmController")
const pStats = require("../../main/server/portfolioStats")
const pTheory = require("../../main/server/portfolioTheory")
const yahooFinanceApi = require("../../main/yahoo/yahooFinanceApi")
//const la = require("../../main/server/linearAlgebra")
//const assert = require("assert")
var _ = require("underscore")
//const Immutable = require('immutable')
const la = require("../../main/server/linearAlgebra")
//const utils = require("../../main/server/utils")
//const testData = require("./testData")
const assert = require("assert")
//const numeric = require("numeric")

function assertPortfolioStatsObjects(o) {
  assert.ok(_.isObject(o))
  assert.ok(_.isArray(o.weights))
  assert.ok(_.isNumber(o.stdDev))
  assert.ok(_.isNumber(o.expectedReturnRate))
}

describe("PrmController", () => {
  it("should calculate portfolio statistics", (done) => {
    const controller = prmController.create(yahooFinanceApi.loadStockHistory, pStats, pTheory)
    controller.analyzeUsingPortfolioHistoricalPrices(
      ["IBM", "AA"],
      new Date(1975, 2, 3),
      new Date(1975, 2, 21),
      1.0).subscribe(portfolio => {
        console.log(JSON.stringify(portfolio))
        assert.ok(_.isObject(portfolio))
        assert.ok(_.isObject(portfolio.input))
        la.validateMatrix(portfolio.input.rrKxN)
        la.validateMatrix(portfolio.input.expectedRrNx1)
        la.validateMatrix(portfolio.input.rrCovarianceNxN)
        assert.ok(_.isNumber(portfolio.input.riskFreeRr))
        assert.ok(_.isObject(portfolio.output))
        assertPortfolioStatsObjects(portfolio.output.globalMinVarianceEfficientPortfolio)
        assert.ok(_.isArray(portfolio.output.tangencyPortfolio))
        _(portfolio.output.tangencyPortfolio).each(n => assert.ok(!_.isNaN(n)))
        assert.ok(_.isArray(portfolio.output.efficientPortfolioFrontier))
        assert.equal(portfolio.output.efficientPortfolioFrontier.length, 21)
        _(portfolio.output.efficientPortfolioFrontier).each(p => assertPortfolioStatsObjects(p))

        done()
      },
        error => done(error)
    )
  })
})

