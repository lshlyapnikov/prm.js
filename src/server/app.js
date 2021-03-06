const express = require("express")
const Immutable = require("immutable")
const prmController = require("./prmController")
const yahooFinanceApi = require("./../yahoo/yahooFinanceApi")
const pStats = require("./portfolioStats")
const pTheory = require("./portfolioTheory")
const util = require("./util")
const log = util.logger("app.js")

const controller = prmController.create(yahooFinanceApi.loadStockHistory, pStats, pTheory)

const port = Number(process.argv[2].trim())
const staticFolder = process.argv[3].trim()

const app = express()
app.use(express.static(staticFolder))

app.get("/analyze", (req, res) => {
  log.info("query: " + JSON.stringify(req.query))
  const symbols = Immutable.List(req.query.symbols.split(",").map((s) => s.trim()))
  const startDate = util.parseDate(req.query.startDate)
  const endDate = util.parseDate(req.query.endDate)
  const riskFreeRr = Number(req.query.riskFreeRr)

  // TODO: handle exceptions
  const result = controller.analyzeUsingPortfolioHistoricalPrices(symbols, startDate, endDate, riskFreeRr)
  res.json({
    input: { symbols: symbols, startDate: startDate, endDate: endDate, riskFreeRr: riskFreeRr },
    output: result
  })
})

app.get("/analyze2", (req, res) => {
  const input = req.query.input
  const rrKxN = input.rrKxN
  const expectedRrNx1 = input.expectedRrNx1
  const rrCovarianceNxN = input.rrCovarianceNxN
  const riskFreeRr = input.riskFreeRr

  // TODO: handle exceptions
  const result = controller.analyzeUsingPortfolioStatistics(rrKxN, expectedRrNx1, rrCovarianceNxN, riskFreeRr)
  res.json({
    input: input,
    output: result
  })
})

const server = app.listen(port, () => {
  log.info("PRM.js is listening at %s", JSON.stringify(server.address()))
  log.info("Static folder: %s", staticFolder)
})
