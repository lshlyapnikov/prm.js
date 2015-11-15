const express = require('express')
const Immutable = require('immutable')
const prmController = require("./prmController")
const yahooFinanceApi = require("./../yahoo/yahooFinanceApi")
//var _ = require("underscore")

const app = express()
const controller = prmController.PrmController(yahooFinanceApi.loadStockHistory)

const port = Number(process.argv[2].trim())
const staticFolder = process.argv[3].trim()

app.use(express.static(staticFolder))

app.get('/query', (req, res) => {
  console.log("query: " + JSON.stringify(req.query))
  const symbols = Immutable.List(req.query.symbols.split(",").map(s => s.trim()))
  const startDate = new Date(req.query.startDate)
  const endDate = new Date(req.query.endDate)
  const riskFreeRr = 0.01

  controller.porfolioStatistics(symbols, startDate, endDate, riskFreeRr)

  res.json([symbols, startDate, endDate])
})

var server = app.listen(port, () => {
  console.log("PRM.js is listening at %s", JSON.stringify(server.address()))
  console.log("Static folder: %s", staticFolder)
})
