/* global describe, it */

const prmController = require("../../main/server/prmController")
const pStats = require("../../main/server/portfolioStats")
const pTheory = require("../../main/server/portfolioTheory")
const yahooFinanceApi = require("../../main/yahoo/yahooFinanceApi")
var _ = require("underscore")
const la = require("../../main/server/linearAlgebra")
const assert = require("assert")

function verifyPortfolioStatsObjects(o) {
  assert.ok(_.isObject(o))
  assert.ok(_.isArray(o.weights))
  assert.ok(_.isNumber(o.stdDev))
  assert.ok(_.isNumber(o.expectedReturnRate))
}

function verifyPorfolioAnalysisResult(r) {
  console.log(JSON.stringify(r))
  assert.ok(_.isObject(r))
  assert.ok(_.isObject(r.input))
  la.validateMatrix(r.input.rrKxN)
  la.validateMatrix(r.input.expectedRrNx1)
  la.validateMatrix(r.input.rrCovarianceNxN)
  assert.ok(_.isNumber(r.input.riskFreeRr))
  assert.ok(_.isObject(r.output))
  verifyPortfolioStatsObjects(r.output.globalMinVarianceEfficientPortfolio)
  assert.ok(_.isArray(r.output.tangencyPortfolio))
  _(r.output.tangencyPortfolio).each(n => assert.ok(!_.isNaN(n)))
  assert.ok(_.isArray(r.output.efficientPortfolioFrontier))
  assert.equal(r.output.efficientPortfolioFrontier.length, 21)
  _(r.output.efficientPortfolioFrontier).each(p => verifyPortfolioStatsObjects(p))
}

describe("PrmController", () => {
  it("should calculate portfolio statistics", (done) => {
    const controller = prmController.create(yahooFinanceApi.loadStockHistory, pStats, pTheory)
    controller.analyzeUsingPortfolioHistoricalPrices(
      ["IBM", "AA"],
      new Date("1975/03/01"),
      new Date("1975/03/31"),
      1.0).subscribe(analysisResult => {
        verifyPorfolioAnalysisResult(analysisResult)
        done()
      },
        error => done(error)
    )
  })
})
