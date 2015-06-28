// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* jshint -W033 */
/* jshint -W119 */

var express = require('express');
var app = express();
//var _ = require("underscore")

app.get('/', (req, res) => {
  console.log("query: " + JSON.stringify(req.query))
  var symbols = req.query.symbols.split(",").map(s => s.trim())
  var startDate = new Date(req.query.startDate)
  var endDate = new Date(req.query.endDate)

  res.json([symbols, startDate, endDate])
})

var server = app.listen(8080, () => {
  var host = server.address().address
  var port = server.address().port
  console.log('Example app listening at http://%s:%s', host, port)
})
