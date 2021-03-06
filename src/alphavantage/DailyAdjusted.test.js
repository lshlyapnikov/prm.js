// @flow strict
import assert from "assert"
import { toArray } from "rxjs/operators"
import stream from "stream"
import fs from "fs"
import stringToStream from "string-to-stream"
import {
  // dailyAdjustedStockPrices,
  dailyAdjustedStockPricesFromStream,
  AscendingDates,
  DescendingDates
} from "./DailyAdjusted"
import { parseDate } from "../server/utils.js"
// import { alphavantage } from "../../test-config.js"
// import { logger } from "../server/utils"
// const log = logger("DailyAdjusted.test.js")

describe("DailyAdjusted", () => {
  test("should parse and return adjusted closing prices with ascending date order", (done) => {
    const rawStream = fs.createReadStream("./src/alphavantage/daily_adjusted_MSFT.test.csv")
    dailyAdjustedStockPricesFromStream(rawStream, parseDate("2018-08-21"), parseDate("2018-08-22"), AscendingDates)
      .pipe(toArray())
      .subscribe(
        (array: Array<number>) => assert.deepStrictEqual(array, [105.98, 107.06]),
        (error) => done.fail(error),
        () => done()
      )
  })

  test("should parse and return adjusted closing prices with descending date order", (done) => {
    const rawStream = fs.createReadStream("./src/alphavantage/daily_adjusted_MSFT.test.csv")
    dailyAdjustedStockPricesFromStream(rawStream, parseDate("2018-08-21"), parseDate("2018-08-22"), DescendingDates)
      .pipe(toArray())
      .subscribe(
        (array: Array<number>) => assert.deepStrictEqual(array, [107.06, 105.98]),
        (error) => done.fail(error),
        () => done()
      )
  })

  test("should parse and return one adjusted closing price value", (done) => {
    const rawStream = fs.createReadStream("./src/alphavantage/daily_adjusted_MSFT.test.csv")
    dailyAdjustedStockPricesFromStream(rawStream, parseDate("2018-08-21"), parseDate("2018-08-21"), AscendingDates)
      .pipe(toArray())
      .subscribe(
        (array: Array<number>) => assert.deepStrictEqual(array, [105.98]),
        (error) => done.fail(error),
        () => done()
      )
  })

  test("should return error when invalid date range passed", (done) => {
    const rawStream = fs.createReadStream("./src/alphavantage/daily_adjusted_MSFT.test.csv")
    const d1 = "2018-08-22"
    const d2 = "2018-08-21"
    const expectedError = `Invalid date range: [${d1}, ${d2}]`
    dailyAdjustedStockPricesFromStream(rawStream, parseDate(d1), parseDate(d2), AscendingDates)
      .pipe(toArray())
      .subscribe(
        (array: Array<number>) => {
          done.fail(new Error(`Expected error, but got: ${JSON.stringify(array)}`))
        },
        (error) => {
          if (typeof error === "string" && error.startsWith(expectedError)) {
            done()
          } else {
            done.fail(new Error(`Expected error message that starts with: ${expectedError}, but got: ${error}`))
          }
        },
        () => done()
      )
  })

  test("should return empty array when date it out of range", (done) => {
    const rawStream = fs.createReadStream("./src/alphavantage/daily_adjusted_MSFT.test.csv")
    dailyAdjustedStockPricesFromStream(rawStream, parseDate("1970-01-01"), parseDate("1970-01-01"), AscendingDates)
      .pipe(toArray())
      .subscribe(
        (array: Array<number>) => assert.deepStrictEqual(array, []),
        (error) => done.fail(error),
        () => done()
      )
  })

  // TODO: run integration tests separately
  // test.skip("should parse and return adjusted closing prices requested from alphavantage", done => {
  //   log.info(`apiKey: ${alphavantage.apiKey}`)
  //   dailyAdjustedStockPrices(
  //     alphavantage.apiKey,
  //     "MSFT",
  //     parseDate("2018-08-20"),
  //     parseDate("2018-08-22"),
  //     AscendingDates
  //   )
  //     .pipe(toArray())
  //     .subscribe(
  //       (array: Array<number>) => assert.deepStrictEqual(array, [104.845, 103.9718, 105.0314]),
  //       error => done.fail(error),
  //       () => done()
  //     )
  // })
  test("should return error when CSV stream errors out", (done) => {
    function testShouldReturnError(rawStream: stream.Readable, expectedError: string) {
      dailyAdjustedStockPricesFromStream(rawStream, parseDate("2018-08-21"), parseDate("2018-08-21"), AscendingDates)
        .pipe(toArray())
        .subscribe(
          (array: Array<number>) => {
            done.fail(new Error(`Expected error, but got: ${JSON.stringify(array)}`))
          },
          (error) => {
            if (typeof error === "string" && error.startsWith(expectedError)) {
              done()
            } else {
              done.fail(new Error(`Expected error message that starts with: ${expectedError}, but got: ${error}`))
            }
          },
          () => done()
        )
    }

    testShouldReturnError(
      stringToStream(
        "timestamp,open,high,low,close,adjusted_close,volume,dividend_amount,split_coefficient\n" +
          "aaa2018-08-24,107.6700,108.5600,107.5600,108.4000,108.4000,17232126,0.0000,1.0000\n"
      ),
      "Cannot parse date from 'aaa2018-08-24'"
    )

    testShouldReturnError(
      stringToStream(
        "timestamp,open,high,low,close,adjusted_close,volume,dividend_amount,split_coefficient\n" +
          "2018-08-24,107.6700,108.5600,107.5600,108.4000,aaa108.4000,17232126,0.0000,1.0000\n"
      ),
      "Cannot parse adjusted close price from 'aaa108.4000"
    )
  })
})
