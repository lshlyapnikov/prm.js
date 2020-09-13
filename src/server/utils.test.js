// @flow strict

import { toFixedNumber, generateRandomWeightsMatrix, parseDate, formatDate, isValidDate } from "./utils"
import assert from "assert"
import numeric from "numeric"

describe("utils", () => {
  describe("#toFixedNumber", () => {
    it("should round up", () => {
      assert.equal(12.35, toFixedNumber(12.3456, 2))
      assert.equal(1.235, toFixedNumber(1.23456, 3))
      assert.equal(1235, toFixedNumber(1234.5678, 0))
    })
    it("should round down", () => {
      assert.equal(12.3, toFixedNumber(12.3456, 1))
      assert.equal(1.23, toFixedNumber(1.23456, 2))
      assert.equal(123, toFixedNumber(123.456, 0))
    })
  })
  describe("#generateRandomWeightsMatrix", function () {
    it("should generate a matrix of random weights", function () {
      // GIVEN
      const rowNum = 30
      const colNum = 10
      // WHEN
      const weights: Array<Array<number>> = generateRandomWeightsMatrix(rowNum, colNum)
      // THEN sum == rowNum, every column summs to 1
      const sum = numeric.sum(weights)
      const error = Math.abs(sum - rowNum)
      assert.ok(error < 0.00001)
    })
    it("should generate a new weights matrix if called consequently", function () {
      // GIVEN
      var rowNum = 30
      var colNum = 10
      // WHEN
      var weights0 = generateRandomWeightsMatrix(rowNum, colNum)
      var weights1 = generateRandomWeightsMatrix(rowNum, colNum)
      // THEN
      var sum0 = numeric.sum(weights0)
      var sum1 = numeric.sum(weights1)
      assert.equal(rowNum, sum0)
      assert.equal(rowNum, sum1)
      assert.notDeepEqual(weights0, weights1)
      for (var i = 0; i < rowNum; i++) {
        assert.notDeepEqual(weights0[i], weights1[i])
      }
    })
    it("should throw up when invalid arguments passed", function () {
      // GIVEN
      // Valid arguments: rowNum > 0 and colNum > 1
      const invalidArguments: Array<Array<number>> = [
        [0, 10],
        [-1, 10],
        [10, 0],
        [10, -1],
        [10, 1],
        [0, 0]
      ]

      function test(rowNum: number, colNum: number): void {
        var actualException: Error
        // WHEN
        try {
          generateRandomWeightsMatrix(rowNum, colNum)
        } catch (e) {
          actualException = e
        }
        // THEN
        var debugMsg = "rowNum: " + rowNum + ", colNum: " + colNum
        assert.notEqual(undefined, actualException, debugMsg)
      }

      for (var i = 0; i < invalidArguments.length; i++) {
        test(invalidArguments[i][0], invalidArguments[i][1])
      }
    })
  })
  describe("#isValidDate", () => {
    it("should return true for a valid date", () => {
      assert.equal(true, isValidDate(new Date(Date.UTC(2018, 7, 24, 0, 0, 0, 0))))
      assert.equal(true, isValidDate(new Date()))
    })
    it("should return false for an invalid date", () => {
      assert.equal(false, isValidDate(new Date(Number.NaN)))
    })
  })
  describe("#parseDate", () => {
    it("should return UTC date with time 0:0:0.0", () => {
      assert.equal(new Date(Date.UTC(2018, 7, 24, 0, 0, 0, 0)).getTime(), parseDate("2018-08-24").getTime())
      assert.equal(new Date(Date.UTC(2018, 7, 4, 0, 0, 0, 0)).getTime(), parseDate("2018-8-4").getTime())
      assert.equal(new Date(Date.UTC(2019, 2, 7, 0, 0, 0, 0)).getTime(), parseDate("2019-03-07").getTime())
      assert.equal(false, isValidDate(parseDate("")))
      assert.equal(false, isValidDate(parseDate(" ")))
    })
  })
  describe("#formatDate", () => {
    it("format parsed date back to original string", () => {
      function testRoundtrip(str: string) {
        assert.equal(str, formatDate(parseDate(str)))
      }
      testRoundtrip("2018-08-24")
      testRoundtrip("2018-12-01")
      testRoundtrip("1900-01-01")
    })
  })
})
