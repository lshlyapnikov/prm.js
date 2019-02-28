// @flow strict
/* global describe, it */

import { toFixedNumber, generateRandomWeightsMatrix } from "./utils"
import assert from "assert"
import numeric from "numeric"

describe("utils", function() {
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
  describe("#generateRandomWeightsMatrix", function() {
    it("should generate a matrix of random weights", function() {
      // GIVEN
      var rowNum = 30
      var colNum = 10
      // WHEN
      var weights = generateRandomWeightsMatrix(rowNum, colNum)
      // THEN
      var sum = numeric.sum(weights)
      assert.equal(rowNum, sum)
    })
    it("should generate a new weights matrix if called consequently", function() {
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
      for(var i = 0; i < rowNum; i++) {
        assert.notDeepEqual(weights0[i], weights1[i])
      }
    })
    it("should throw up when invalid arguments passed", function() {
      // GIVEN
      // Valid arguments: rowNum > 0 and colNum > 1
      const invalidArguments: Array<Array<number>> = [
        [0, 10],
        [-1, 10],
        [10, 0],
        [10, -1],
        [10, 1],
        [0, 0],
      ]

      function test(rowNum: number, colNum: number): void {
        var actualException: Error
        // WHEN
        try {
          generateRandomWeightsMatrix(rowNum, colNum)
        } catch(e) {
          actualException = e
        }
        // THEN
        var debugMsg = "rowNum: " + rowNum + ", colNum: " + colNum
        assert.notEqual(undefined, actualException, debugMsg)
      }

      for(var i = 0; i < invalidArguments.length; i++) {
        test(invalidArguments[i][0], invalidArguments[i][1])
      }
    })
  })
})
