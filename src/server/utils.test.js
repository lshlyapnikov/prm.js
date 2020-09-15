// @flow strict

import { toFixedNumber, generateRandomWeightsMatrix, parseDate, parseDateSafe, formatDate, isValidDate } from "./utils"
import assert from "assert"
import numeric from "numeric"

const maxError: number = 0.0000000000001

describe("utils", () => {
  describe("#toFixedNumber", () => {
    it("should round up", () => {
      assert.equal(toFixedNumber(12.3456, 2), 12.35)
      assert.equal(toFixedNumber(1.23456, 3), 1.235)
      assert.equal(toFixedNumber(1234.5678, 0), 1235)
    })
    it("should round down", () => {
      assert.equal(toFixedNumber(12.3456, 1), 12.3)
      assert.equal(toFixedNumber(1.23456, 2), 1.23)
      assert.equal(toFixedNumber(123.456, 0), 123)
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
      assert.ok(Math.abs(sum - rowNum) < maxError)
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
      assert.ok(Math.abs(sum0 - rowNum) < maxError)
      assert.ok(Math.abs(sum1 - rowNum) < maxError)
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
      assert.equal(isValidDate(new Date(Date.UTC(2018, 7, 24, 0, 0, 0, 0))), true)
      assert.equal(isValidDate(new Date()), true)
    })
    it("should return false for an invalid date", () => {
      assert.equal(isValidDate(new Date(Number.NaN)), false)
    })
  })
  describe("#parseDate", () => {
    it("should return UTC date with time 0:0:0.0", () => {
      assert.deepEqual(parseDate("2018-08-24"), new Date(Date.UTC(2018, 7, 24, 0, 0, 0, 0)))
      assert.deepEqual(parseDate("2018-8-4"), new Date(Date.UTC(2018, 7, 4, 0, 0, 0, 0)))
      assert.deepEqual(parseDate("2019-03-07"), new Date(Date.UTC(2019, 2, 7, 0, 0, 0, 0)))
      assert.equal(isValidDate(parseDate("")), false)
      assert.equal(isValidDate(parseDate(" ")), false)
    })
  })
  describe("#parseDateSafe", () => {
    it("should return UTC date with time 0:0:0.0", () => {
      assert.deepEqual(parseDateSafe("2018-08-24"), {
        success: true,
        value: new Date(Date.UTC(2018, 7, 24, 0, 0, 0, 0))
      })
      assert.deepEqual(parseDateSafe("2018-8-4"), {
        success: true,
        value: new Date(Date.UTC(2018, 7, 4, 0, 0, 0, 0))
      })
      assert.deepEqual(parseDateSafe("2019-03-07"), {
        success: true,
        value: new Date(Date.UTC(2019, 2, 7, 0, 0, 0, 0))
      })
      assert.deepEqual(parseDateSafe(""), { success: false, error: new Error("Not a validate date: ''") })
      assert.deepEqual(parseDateSafe(" "), { success: false, error: new Error("Not a validate date: ' '") })
    })
  })
  describe("#formatDate", () => {
    it("format parsed date back to original string", () => {
      function testRoundtrip(str: string) {
        assert.equal(formatDate(parseDate(str)), str)
      }
      testRoundtrip("2018-08-24")
      testRoundtrip("2018-12-01")
      testRoundtrip("1900-01-01")
    })
  })
})
