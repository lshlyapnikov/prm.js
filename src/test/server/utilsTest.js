// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, describe, it */

var utils = require("../../main/server/utils")
var assert = require("assert")
var numeric = require("numeric")

describe("utils", function() {
  describe("#convertArrayElements()", function() {
    it("should convert array of object to array of numbers", function() {
      // GIVEN

      var objArray = [
        {Date: "2013-04-12", Open: "37.86", High: "38.05", Low: "37.76", Close: "38.05", Volume: "783400", "Adj Close": "38.05"},
        {Date: "2013-04-11", Open: "37.97", High: "38.18", Low: "37.81", Close: "37.99", Volume: "931200", "Adj Close": "37.99"},
        {Date: "2013-04-10", Open: "37.57", High: "37.99", Low: "37.46", Close: "37.93", Volume: "1043600", "Adj Close": "37.93"}
      ]

      var expected = [38.05, 37.99, 37.93]

      // WHEN
      var actual = utils.convertArrayElements(objArray, function(obj) {
        return Number(obj["Adj Close"])
      })

      // THEN
      assert.deepEqual(expected, actual)
    })
  })
  describe("#generateRandomWeightsMatrix", function() {
    it("should generate a matrix of random weights", function() {
      // GIVEN
      var rowNum = 30
      var colNum = 10
      // WHEN
      var weights = utils.generateRandomWeightsMatrix(rowNum, colNum)
      // THEN
      var sum = numeric.sum(weights)
      assert.equal(rowNum, sum)
    })
    it("should generate a new weights matrix if called consequently", function() {
      // GIVEN
      var rowNum = 30
      var colNum = 10
      // WHEN
      var weights0 = utils.generateRandomWeightsMatrix(rowNum, colNum)
      var weights1 = utils.generateRandomWeightsMatrix(rowNum, colNum)
      // THEN
      var sum0 = numeric.sum(weights0)
      var sum1 = numeric.sum(weights1)
      assert.equal(rowNum, sum0)
      assert.equal(rowNum, sum1)
      assert.notDeepEqual(weights0, weights1)
      for(var i = 0; i < rowNum; i++) {
        assert.notDeepEqual(weights0[i], weights1[i])
      }
    })
    it("should throw up when invalid arguments passed", function() {
      // GIVEN
      // Valid arguments: rowNum > 0 and colNum > 1
      var invalidArguments = [
        [undefined, undefined],
        [undefined, 10],
        [10, undefined],
        [0, 10],
        [-1, 10],
        [10, 0],
        [10, -1],
        [10, 1]
      ]

      function test(rowNum, colNum) {
        var actualException
        // WHEN
        try {
          utils.generateRandomWeightsMatrix(rowNum, colNum)
        } catch(e) {
          actualException = e
        }
        // THEN
        var debugMsg = "rowNum: " + rowNum + ", colNum: " + colNum
        assert.notEqual(undefined, actualException, debugMsg)
        assert.equal("Error", actualException.name, debugMsg)
      }
      for(var i = 0; i < invalidArguments.length; i++) {
        test(invalidArguments[i][0], invalidArguments[i][1])
      }
    })
  })
  describe("#parseCsvStr", () => {
    var csvStr = "Date,Open,High,Low,Close,Volume,Adj Close\n" +
      "2010-01-25,39.965,41.57,39.115,41.225,5301000,33.403\n" +
      "2010-01-18,41.75,42.93,40.13,40.465,4340200,32.787\n" +
      "2010-01-11,44.285,44.435,41.375,41.565,4399300,33.678\n" +
      "2010-01-04,43.46,44.85,43.35,44.02,2939200,35.667\n" +
      "2009-12-28,44.07,44.14,43.37,43.46,1562400,35.214\n"

    it("should return all fields", () => {
      var matrix5x7 = utils.parseCsvStr(csvStr, ["Date", "Open", "High", "Low", "Close", "Volume", "Adj Close"],
        [utils.noop, utils.noop, utils.noop, utils.noop, utils.noop, utils.noop, utils.noop])
      assert.equal(5, matrix5x7.length)
      assert.deepEqual(["2010-01-25","39.965","41.57","39.115","41.225","5301000","33.403"], matrix5x7[0])
      assert.deepEqual(["2010-01-18", "41.75", "42.93", "40.13", "40.465", "4340200", "32.787"], matrix5x7[1])
      assert.deepEqual(["2010-01-11", "44.285", "44.435", "41.375", "41.565", "4399300", "33.678"], matrix5x7[2])
      assert.deepEqual(["2010-01-04", "43.46", "44.85", "43.35", "44.02", "2939200", "35.667"], matrix5x7[3])
      assert.deepEqual(["2009-12-28", "44.07", "44.14", "43.37", "43.46", "1562400", "35.214"], matrix5x7[4])
    })
    it("should return only 'Date' and 'Adj Close' fields", () => {
      var matrix5x7 = utils.parseCsvStr(csvStr, ["Date", "Adj Close"], [utils.noop, utils.noop])
      assert.equal(5, matrix5x7.length)
      assert.deepEqual(["2010-01-25", "33.403"], matrix5x7[0])
      assert.deepEqual(["2010-01-18", "32.787"], matrix5x7[1])
      assert.deepEqual(["2010-01-11", "33.678"], matrix5x7[2])
      assert.deepEqual(["2010-01-04", "35.667"], matrix5x7[3])
      assert.deepEqual(["2009-12-28", "35.214"], matrix5x7[4])
    })
    it("should return only 'Date' and 'Adj Close' fields converted to Date and Float", () => {
      var matrix5x7 = utils.parseCsvStr(csvStr, ["Date", "Adj Close"], [utils.noop, utils.strToNumber])
      assert.equal(5, matrix5x7.length)
      assert.deepEqual(["2010-01-25", 33.403], matrix5x7[0])
      assert.deepEqual(["2010-01-18", 32.787], matrix5x7[1])
      assert.deepEqual(["2010-01-11", 33.678], matrix5x7[2])
      assert.deepEqual(["2010-01-04", 35.667], matrix5x7[3])
      assert.deepEqual(["2009-12-28", 35.214], matrix5x7[4])
    })
    it("should return only 'Adj Close' field converted to Float", () => {
      var matrix5x7 = utils.parseCsvStr(csvStr, ["Adj Close"], [utils.strToNumber])
      assert.equal(5, matrix5x7.length)
      assert.deepEqual([33.403], matrix5x7[0])
      assert.deepEqual([32.787], matrix5x7[1])
      assert.deepEqual([33.678], matrix5x7[2])
      assert.deepEqual([35.667], matrix5x7[3])
      assert.deepEqual([35.214], matrix5x7[4])
    })
    it("should return empty matrix when CSV string contains only header ", () => {
      var emptyMatrix = utils.parseCsvStr("Date,Open,High,Low,Close,Volume,Adj Close\n", ["Adj Close"],
        [utils.strToNumber])
      assert.equal(0, emptyMatrix.length)
    })
    it("should return empty matrix when CSV string is empty", () => {
      var emptyMatrix = utils.parseCsvStr("", ["Adj Close"], [utils.strToNumber])
      assert.equal(0, emptyMatrix.length)
    })
  })
})
