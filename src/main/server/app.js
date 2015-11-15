const express = require('express')
const Immutable = require('immutable')
const prmController = require("./prmController")
const yahooFinanceApi = require("./../yahoo/yahooFinanceApi")
//var _ = require("underscore")

const app = express()
const controller = prmController.PrmController(yahooFinanceApi.loadStockHistory)

app.get('/', (req, res) => {
  console.log("query: " + JSON.stringify(req.query))
  var symbols = Immutable.List(req.query.symbols.split(",").map(s => s.trim()))
  var startDate = new Date(req.query.startDate)
  var endDate = new Date(req.query.endDate)

  controller.mvef(symbols, startDate, endDate)

  res.json([symbols, startDate, endDate])
})

var server = app.listen(8080, () => {
  var host = server.address().address
  var port = server.address().port
  console.log('Example app listening at http://%s:%s', host, port)
})
