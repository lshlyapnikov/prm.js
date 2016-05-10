/* global describe, it */

const prmController = require("../../main/server/prmController")
const pStats = require("../../main/server/portfolioStats")
const pTheory = require("../../main/server/portfolioTheory")
const yahooFinanceApi = require("../../main/yahoo/yahooFinanceApi")
//const Immutable = require('immutable')
//const la = require("../../main/server/linearAlgebra")
//const utils = require("../../main/server/utils")
//const testData = require("./testData")
//const assert = require("assert")
//const numeric = require("numeric")
//
//const log = utils.logger("portfolioTheoryTest")

describe("PrmController", () => {
  it("should calculate portfolio statistics", (done) => {
    const controller = prmController.create(yahooFinanceApi.loadStockHistory, pStats, pTheory)
    controller.analyzeUsingPortfolioHistoricalPrices(
      ["IBM", "AA"],
      new Date(1975, 2, 3),
      new Date(1975, 2, 5),
      1.0).subscribe(mXn => {
        console.log(JSON.stringify(mXn))
        done()
      },
        error => done(error)
    )
  })
})

