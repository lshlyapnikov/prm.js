/* global describe, it */
import _ from "underscore"
import assert from "assert"
import { toArray } from "rxjs/operators"
import csv from "csv-parser"
import fs from "fs"
import request from "request"
import { dailyAdjustedStockPrices, dailyAdjustedStockPricesFromStream } from "./DailyAdjusted"
import { alphavantage } from "../../.test-config.js"

function doneOnFailure(assertStatement, doneFn) {
  try {
    assertStatement()
  } catch (e) {
    doneFn.fail(e)
  }
}

describe("DailyAdjusted", () => {
  it("should parse and return adjusted closing prices in reverse order", (done) => {
    const rawStream = fs.createReadStream('./src/alphavantage/daily_adjusted_MSFT.test.csv')
      .pipe(csv())
    const observable = dailyAdjustedStockPricesFromStream(rawStream, new Date("2018-08-21"),
      new Date("2018-08-22"))
    toArray()(observable).subscribe(
      array => doneOnFailure(() => assert.deepStrictEqual(array, [107.06, 105.98]), done),
      error => done.fail(error),
      () => done()
    )
  })

  it("should parse and return one adjusted closing price value", (done) => {
    const rawStream = fs.createReadStream('./src/alphavantage/daily_adjusted_MSFT.test.csv')
      .pipe(csv())
    const observable = dailyAdjustedStockPricesFromStream(rawStream, new Date("2018-08-21"),
      new Date("2018-08-21"))
    toArray()(observable).subscribe(
      array => doneOnFailure(() => assert.deepStrictEqual(array, [105.98]), done),
      error => done.fail(error),
      () => done()
    )
  })

  it("should return empty array when date it out of range", (done) => {
    const rawStream = fs.createReadStream('./src/alphavantage/daily_adjusted_MSFT.test.csv')
      .pipe(csv())
    const observable = dailyAdjustedStockPricesFromStream(rawStream, new Date("1970-01-01"),
      new Date("1970-01-01"))
    toArray()(observable).subscribe(
      array => doneOnFailure(() => assert.deepStrictEqual(array, []), done),
      error => done.fail(error),
      () => done()
    )
  })

  it("should parse and return adjusted closing prices requested from alphavantage", (done) => {
    console.log(`apiKey: ${alphavantage.apiKey}`)
    const observable = dailyAdjustedStockPrices(alphavantage.apiKey, "MSFT", new Date(
      "2018-08-21"), new Date("2018-08-22"))
    toArray()(observable).subscribe(
      array => doneOnFailure(() => assert.deepStrictEqual(array, [107.06, 105.98]), done),
      error => done.fail(error),
      () => done()
    )
  })
})
