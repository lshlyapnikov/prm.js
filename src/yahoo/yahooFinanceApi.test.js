// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, describe, it */

var yahooFinanceApi = require("./yahooFinanceApi")
var utils = require("../server/utils")
var la = require("../server/linearAlgebra")
var assert = require("assert")
var _ = require('underscore-contrib')

const log = utils.logger("yahooFinanceApiTest")

function parseLines(csv) {
  return csv.split("\n").filter(line => !_.isEmpty(line))
}

function verifyCsvHeader(header) {
  assert.equal(header, "Date,Open,High,Low,Close,Volume,Adj Close")
}

function verifyCsvValues(line) {
  var values = line.split(",")
  assert.equal(_.size(values), 7)
  assert.ok(_.isValidDate(new Date(values[0])))
  values.slice(1).forEach(str => {
    assert.ok(_.isFinite(parseFloat(str)))
  })
}

function getDates(lines) {
  return lines.map(line => line.split(",")[0])
}

describe.skip("yahooFinanceApi @IntegrationTest", function () {
  describe("#loadStockHistoryAsString()", function () {
    it("should load expected CSV string  [3 days]", function (done) {
      const o = yahooFinanceApi.loadStockHistoryAsString("IBM", new Date(1975, 2, 3), new Date(1975, 2, 5), 'd')
      o.subscribe((actualCsv) => {
        //var expectedCsv = "Date,Open,High,Low,Close,Volume,Adj Close\n" +
        //  "1975-03-05,214.50,220.25,214.25,215.38,1867200,4.89\n" +
        //  "1975-03-04,220.00,224.75,214.25,214.50,2065600,4.87\n" +
        //  "1975-03-03,216.00,220.00,216.00,220.00,1267200,5.00\n";
        var lines = parseLines(actualCsv)
        var dates = getDates(lines.slice(1))
        assert.deepEqual(dates, ["1975-03-05", "1975-03-04", "1975-03-03"])
        verifyCsvHeader(lines[0])
        lines.slice(1).forEach(line =>
            verifyCsvValues(line)
        )
        done()
      }, (error) => {
        done(error);
      })
    });
    it("should load expected CSV string [1 day]", function (done) {
      const o = yahooFinanceApi.loadStockHistoryAsString("IBM", new Date(1975, 2, 5), new Date(1975, 2, 5), "d")
      o.subscribe((actualCsv) => {
        var lines = parseLines(actualCsv)
        assert.deepEqual(getDates(lines.slice(1)), ["1975-03-05"])
        verifyCsvHeader(lines[0])
        verifyCsvValues(lines[1])
        done()
      }, (error) => {
        done(error)
      })
    });
    it("should return error due to unknown symbol", function (done) {
      const o = yahooFinanceApi.loadStockHistoryAsString(
        "UnknownSymbol", new Date(2013, 3, 1), new Date(2013, 3, 1), "d")

      o.subscribe(() => {
        done(new Error("Expected an error due to unknown symbol but did not get one"));
      }, (error) => {
        if (_.isUndefined(error)) {
          done(new Error("Expected an error due to unknown symbol but did not get one"));
        } else {
          assert.ok(error.message.indexOf("Cannot retrieve historical prices for symbol: UnknownSymbol") === 0)
          done();
        }
      })
    })
  })
  describe("#loadStockHistory()", function () {
    function verifyAllNumbers(arr) {
      arr.forEach(str => {
        assert.ok(_.isNumeric(str), "expected number: " + str)
      })
    }

    it("[1] should load historical prices as array of arrays in the chronological order [3 days]", (done) => {
      //var expectedMatrix3x7 = [
      //  ["1975-03-03", "216.00", "220.00", "216.00", "220.00", "1267200", "5.00"],
      //  ["1975-03-04", "220.00", "224.75", "214.25", "214.50", "2065600", "4.87"],
      //  ["1975-03-05", "214.50", "220.25", "214.25", "215.38", "1867200", "4.89"]
      //];
      yahooFinanceApi.loadStockHistory("IBM", new Date(1975, 2, 3), new Date(1975, 2, 5), "d",
        ["Date", "Open", "High", "Low", "Close", "Volume", "Adj Close"],
        [utils.noop, utils.noop, utils.noop, utils.noop, utils.noop, utils.noop, utils.noop]
      ).subscribe((matrix3x7) => {
          assert.deepEqual(la.dim(matrix3x7), [3, 7])
          assert.equal(matrix3x7[0][0], "1975-03-03")
          assert.equal(matrix3x7[1][0], "1975-03-04")
          assert.equal(matrix3x7[2][0], "1975-03-05")
          assert.equal(matrix3x7[0][5], "1267200")
          assert.equal(matrix3x7[1][5], "2065600")
          assert.equal(matrix3x7[2][5], "1867200")
          verifyAllNumbers(matrix3x7[0].slice(1))
          verifyAllNumbers(matrix3x7[1].slice(1))
          verifyAllNumbers(matrix3x7[2].slice(1))
          done()
        }, (error) => {
          done(error)
        })
    });
    it("[2] should load 'Adj Close' prices as Numbers in the chronological order [3 days]", function (done) {
      yahooFinanceApi.loadStockHistory("IBM", new Date(1975, 2, 3), new Date(1975, 2, 5), "d",
        ["Adj Close"], [utils.strToNumber]
      ).subscribe((matrix3x1) => {
          assert.deepEqual(la.dim(matrix3x1), [3, 1])
          assert.ok(_.isFloat(matrix3x1[0][0]))
          assert.ok(_.isFloat(matrix3x1[1][0]))
          assert.ok(_.isFloat(matrix3x1[2][0]))
          done()
        }, (error) => {
          done(error)
        })
    })
    it("[3] should load 'Volume' and 'Adj Close' prices as Numbers in the chronolical order [3 days]", function (done) {
      yahooFinanceApi.loadStockHistory("IBM", new Date(1975, 2, 3), new Date(1975, 2, 5), "d",
        ["Volume", "Adj Close"], [utils.strToNumber, utils.strToNumber]
      ).subscribe((matrix3x7) => {
          assert.ok(_.isInteger(matrix3x7[0][0]))
          assert.ok(_.isInteger(matrix3x7[1][0]))
          assert.ok(_.isInteger(matrix3x7[2][0]))
          assert.equal(matrix3x7[0][0], 1267200)
          assert.equal(matrix3x7[1][0], 2065600)
          assert.equal(matrix3x7[2][0], 1867200)

          assert.ok(_.isFloat(matrix3x7[0][1]))
          assert.ok(_.isFloat(matrix3x7[1][1]))
          assert.ok(_.isFloat(matrix3x7[2][1]))

          done()
        }, (error) => {
          done(error)
        })
    })
    it("[4] should return error due to unknown symbol [3 days]", function (done) {
      yahooFinanceApi.loadStockHistory("UnknownSymbol", new Date(2013, 3, 10), new Date(2013, 3, 12), "d",
        ["Adj Close"], [(str) => {
          return Number(str)
        }]
      ).subscribe(() => {
          done(new Error("Expecting an error due to unknown symbol"));
        }, (error) => {
          assert.ok(error.message.indexOf("Cannot retrieve historical prices for symbol: UnknownSymbol") === 0)
          done()
        })
    });
    it("[5] should return error caused by unknown field", function (done) {
      var UNKNOWN_FIELD_NAME = "UnknownFieldName";
      yahooFinanceApi.loadStockHistory("IBM", new Date(1975, 2, 3), new Date(1975, 2, 5), "d",
        [UNKNOWN_FIELD_NAME], [utils.strToNumber]
      ).subscribe(() => {
          done(new Error("Expecting an error caused by unknown field name"));
        }, (error) => {
          log.info(error)
          assert.ok(error.message.indexOf(UNKNOWN_FIELD_NAME) >= 0)
          done()
        })
    })
    it("[6] should return error: 2 fields, but only 1 converter", function (done) {
      yahooFinanceApi.loadStockHistory("IBM", new Date(1975, 2, 3), new Date(1975, 2, 5), "d",
        ["Volume", "Adj Close"], [utils.strToNumber]
      ).subscribe(() => {
          done(new Error("Expecting an error: 2 fields -- 2 converters, passed only 1"))
        }, function (error) {
          assert.ok(error.message.indexOf("fieldNames.length") >= 0)
          assert.ok(error.message.indexOf("fieldConverters.length") >= 0)
          done();
        })
    });
  });
});
