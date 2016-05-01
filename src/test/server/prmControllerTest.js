/* global describe, it */

const prmController = require("../../main/server/prmController")
const pStats = require("../../main/server/portfolioStats")
const pTheory = require("../../main/server/portfolioTheory")
const yahooFinanceApi = require("../../main/yahoo/yahooFinanceApi")
//const la = require("../../main/server/linearAlgebra")
//const utils = require("../../main/server/utils")
//const testData = require("./testData")
//const assert = require("assert")
//const numeric = require("numeric")
//
//const log = utils.logger("portfolioTheoryTest")

describe("PrmController", () => {
  it("should calculate portfolio statistics", () => {
    const controller = prmController.create(yahooFinanceApi.loadStockHistory, pStats, pTheory)
    controller.analyzeUsingPortfolioHistoricalPrices(["IBM", "AA"])
  })
})

