// @flow strict

import { toFixedNumber, generateRandomWeightsMatrix, parseDate, parseDateSafe, formatDate } from "./utils"
import { LocalDate } from "@js-joda/core"
import { dim } from "./linearAlgebra"
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
    it("should generate a matrix of random positive weights that sum up to 1", function () {
      // GIVEN
      const rowNum = 30
      const colNum = 10
      // WHEN
      const weights: Array<Array<number>> = generateRandomWeightsMatrix(rowNum, colNum, 0, false)

      const [m, n] = dim(weights)
      assert.equal(m, rowNum)
      assert.equal(n, colNum)

      // THEN sum == rowNum, every column summs to 1
      const sum = numeric.sum(weights)
      assert.ok(Math.abs(sum - rowNum) < maxError)

      for (let i = 0; i < rowNum; i++) {
        for (let j = 0; j < colNum; j++) {
          const x: number = weights[i][j]
          assert.ok(x >= 0 && x <= 1, `x: ${x}`)
        }
      }
    })
    it("should generate a matrix of random positive and negative weights that sum up to 1", function () {
      // GIVEN
      const rowNum = 30
      const colNum = 10
      // WHEN
      const weights: Array<Array<number>> = generateRandomWeightsMatrix(rowNum, colNum, 0, true)

      const [m, n] = dim(weights)
      assert.equal(m, rowNum)
      assert.equal(n, colNum)

      // THEN sum == rowNum, every column summs to 1
      const sum = numeric.sum(weights)
      assert.ok(Math.abs(sum - rowNum) < maxError)

      var positiveWeightsCount = 0
      var netagiveWeightsCount = 0

      for (let i = 0; i < rowNum; i++) {
        for (let j = 0; j < colNum; j++) {
          const x: number = weights[i][j]
          if (x > 0) {
            positiveWeightsCount += 1
          } else {
            netagiveWeightsCount += 1
          }
        }
      }

      // console.log(numeric.prettyPrint(weights))

      const diff = positiveWeightsCount - netagiveWeightsCount
      assert.ok(
        Math.abs(diff) < (rowNum * colNum) / 3,
        `positiveWeightsCount: ${positiveWeightsCount}, netagiveWeightsCount: ${netagiveWeightsCount}`
      )
    })
    it("should generate the same weights matrix if called with the same seed", function () {
      // GIVEN
      var rowNum = 30
      var colNum = 10
      // WHEN
      var weights0 = generateRandomWeightsMatrix(rowNum, colNum, 0, false)
      var weights1 = generateRandomWeightsMatrix(rowNum, colNum, 0, false)
      // THEN
      assert.deepEqual(weights0, weights1)
    })
    it("should generate a different weights matrix if called with a different seed", function () {
      // GIVEN
      var rowNum = 30
      var colNum = 10
      // WHEN
      var weights0 = generateRandomWeightsMatrix(rowNum, colNum, 0, false)
      var weights1 = generateRandomWeightsMatrix(rowNum, colNum, 1, false)
      // THEN
      assert.notDeepEqual(weights0, weights1)
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
          generateRandomWeightsMatrix(rowNum, colNum, 0, false)
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
