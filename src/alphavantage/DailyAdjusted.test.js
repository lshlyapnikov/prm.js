// @flow
/* global describe, it */
import _ from "underscore"
import assert from "assert"
import { toArray } from "rxjs/operators"
import csv from "csv-parser"
import fs from "fs"
import stringToStream from "string-to-stream"
import request from "request"
import { dailyAdjustedStockPrices, dailyAdjustedStockPricesFromStream } from "./DailyAdjusted"
// $FlowIgnore
import { alphavantage } from "../../.test-config.js"

function doneOnFailure(assertStatement, doneFn) {
  try {
    assertStatement()
  } catch (e) {
    doneFn.fail(e)
  }
}

describe.skip("DailyAdjusted", () => {
  it("should parse and return adjusted closing prices in reverse order", (done) => {
    const rawStream = fs.createReadStream('./src/alphavantage/daily_adjusted_MSFT.test.csv')
      .pipe(csv())
    dailyAdjustedStockPricesFromStream(rawStream, new Date("2018-08-21"),
      new Date("2018-08-22")).pipe(
        toArray()
      ).subscribe(
        array => doneOnFailure(() => assert.deepStrictEqual(array, [107.06, 105.98]), done),
        error => done.fail(error),
        () => done()
      )
  })

  it("should parse and return one adjusted closing price value", (done) => {
    const rawStream = fs.createReadStream('./src/alphavantage/daily_adjusted_MSFT.test.csv')
      .pipe(csv())
    dailyAdjustedStockPricesFromStream(rawStream, new Date("2018-08-21"), new Date(
      "2018-08-21")).pipe(
        toArray()
      ).subscribe(
        array => doneOnFailure(() => assert.deepStrictEqual(array, [105.98]), done),
        error => done.fail(error),
        () => done()
      )
  })

  it("should return empty array when date it out of range", (done) => {
    const rawStream = fs.createReadStream('./src/alphavantage/daily_adjusted_MSFT.test.csv')
      .pipe(csv())
    const observable = dailyAdjustedStockPricesFromStream(rawStream, new Date("1970-01-01"),
      new Date("1970-01-01")).pipe(
        toArray()).subscribe(
          array => doneOnFailure(() => assert.deepStrictEqual(array, []), done),
          error => done.fail(error),
          () => done()
        )
  })

  it("should parse and return adjusted closing prices requested from alphavantage", (done) => {
    console.log(`apiKey: ${alphavantage.apiKey}`)
    const observable = dailyAdjustedStockPrices(alphavantage.apiKey, "MSFT", new Date(
      "2018-08-21"), new Date("2018-08-22")).pipe(
        toArray()).subscribe(
          array => doneOnFailure(() => assert.deepStrictEqual(array, [106.5929, 105.5176]),
            done),
          error => done.fail(error),
          () => done()
        )
  })
})

describe("DailyAdjusted111", () => {
  it("should return error when CSV stream errors out", (done) => {
    const rawStream = stringToStream(
      "timestamp,open,high,low,close,adjusted_close,volume,dividend_amount,split_coefficient\n" +
      "aaa2018-08-24,aaa107.6700,aaa108.5600,aaa107.5600,aaa108.4000,aaa108.4000,aaa17232126,aaa0.0000,aa1.0000\n"
    ).pipe(csv())

    dailyAdjustedStockPricesFromStream(rawStream, new Date("2018-08-21"), new Date(
      "2018-08-21")).pipe(
        toArray()
      ).subscribe(
        (array: Array<number>) => {
          done.fail(`Expected error, but got: ${JSON.stringify(array)}`)
        },
        error => {
          if (typeof error === 'string' && error.startsWith("Cannot parse date from 'aaa2018-08-24'")) {
            done()
          } else {
            done.fail(`Expected string error, got: ${JSON.stringify(error)}`)
          }
        },
        () => done()
      )
  })
})
