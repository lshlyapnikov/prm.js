// @flow strict

import { toFixedNumber, generateRandomWeightsMatrix, parseDate, parseDateSafe, formatDate } from "./utils"
import { LocalDate } from "@js-joda/core"
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
  describe("#parseDate", () => {
    it("should return LocalDate", () => {
      assert.deepEqual(parseDate("2018-08-24"), LocalDate.of(2018, 8, 24))
      assert.deepEqual(parseDate("2019-03-07"), LocalDate.of(2019, 3, 7))
      assert.throws(() => parseDate("2018-8-4"), Error)
      assert.throws(() => parseDate(""), Error)
      assert.throws(() => parseDate(" "), Error)
    })
  })
  describe("#parseDateSafe", () => {
    it("should return LocalDate", () => {
      assert.deepEqual(parseDateSafe("2018-08-24"), {
        success: true,
        value: LocalDate.of(2018, 8, 24)
      })
      assert.deepEqual(parseDateSafe("2019-03-07"), {
        success: true,
        value: LocalDate.of(2019, 3, 7)
      })
      assert.equal(parseDateSafe("2018-8-4").success, false)
      assert.equal(parseDateSafe("").success, false)
      assert.equal(parseDateSafe(" ").success, false)
      assert.equal(parseDateSafe("2020-03-00").success, false)
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
