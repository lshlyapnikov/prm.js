/* global describe, it */
import _ from "underscore"
import assert from "assert"
import {
  toArray
} from "rxjs/operators"
import csv from "csv-parser"
import fs from "fs"
import request from "request"
import {
  dailyAdjustedStockPrices,
  dailyAdjustedStockPricesFromStream
} from "./DailyAdjusted"

describe("DailyAdjusted", () => {
  it("should parse and return adjusted closing prices", (done) => {
    const rawStream = fs.createReadStream(
        '/home/lshlyapnikov/Projects/prm.js/src/alphavantage/daily_adjusted_MSFT.test.csv')
      .pipe(csv())
    const observable = dailyAdjustedStockPricesFromStream(rawStream, new Date("2018-08-21"),
      new Date("2018-08-22"))
    toArray()(observable).subscribe(
      array => assert.deepStrictEqual(array, [107.06, 105.98]),
      error => done(error),
      () => done()
    )
  })
})
