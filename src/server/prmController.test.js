// @flow strict
import assert from "assert"
import fs from "fs"
import { prettyPrint } from "numeric"
import { from, throwError, Observable } from "rxjs"
import { LocalDate } from "@js-joda/core"
import { vector } from "./vector"
import { type Calculated, PrmController } from "./prmController"
import { PortfolioStats } from "./portfolioStats"
import { dailyAdjustedStockPricesFromStream, AscendingDates } from "../alphavantage/DailyAdjusted"
import { toFixedNumber, newArrayWithScale, type JestDoneFn } from "./utils"
import * as testData from "./testData"
import { type Result, logger, parseDate } from "./utils"

const log = logger("prmController.test.js")

// eslint-disable-next-line no-unused-vars
function loadMockStockHistory(symbol: string, dummy0: LocalDate, dummy1: LocalDate): Observable<number> {
  if (symbol === "NYX") return from(testData.NYX)
  else if (symbol == "INTC") return from(testData.INTC)
  else return throwError(`Unsupported mock symbol: ${symbol}`)
}

function loadStockHistoryFromAlphavantage(symbol: string, minDate: LocalDate, maxDate: LocalDate): Observable<number> {
  const rawStream = fs.createReadStream(`./src/testResources/alphavantage/${symbol}.csv`)
  return dailyAdjustedStockPricesFromStream(rawStream, minDate, maxDate, AscendingDates)
}

function verifyPortfolioStatsObjects(o: PortfolioStats) {
  assert.ok(o !== null)
}

function verifyPortfolioAnalysisResult(result: Result<Calculated>, done: JestDoneFn): void {
  if (result.success) {
    const calculated: Calculated = result.value
    verifyPortfolioStatsObjects(calculated.globalMinVarianceEfficientPortfolio)
    assert.equal(calculated.efficientPortfolioFrontier.length, 21)
    calculated.efficientPortfolioFrontier.forEach((p) => verifyPortfolioStatsObjects(p))
    verifyPortfolioStatsObjects(calculated.tangencyPortfolio)
  } else {
    done.fail(new Error(`Expected successful Calculated result, got: ${JSON.stringify(result)}`))
  }
}

describe("PrmController", () => {
  it("should calculate portfolio statistics", (done) => {
    const controller = new PrmController(loadMockStockHistory)
    controller
      .returnRateStats(vector(2, ["NYX", "INTC"]), parseDate("1111-11-11"), parseDate("1111-11-11"), 0)
      .then((stats) => controller.calculate(stats, 1.0))
      .then(
        (result: Result<Calculated>) => {
          verifyPortfolioAnalysisResult(result, done)
          // TODO(#12): the numbers are from the lecture, if not add a test case to match the lecture numbers
          // numbers are from the lecture, I think
          if (result.success) {
            const calculated: Calculated = result.value
            assert.equal(
              toFixedNumber(calculated.globalMinVarianceEfficientPortfolio.expectedReturnRate * 100, 2),
              0.64
            )
            assert.strictEqual(toFixedNumber(calculated.globalMinVarianceEfficientPortfolio.stdDev * 100, 2), 7.37)
            assert.deepStrictEqual(newArrayWithScale(calculated.globalMinVarianceEfficientPortfolio.weights, 2), [
              0.11,
              0.89
            ])
            done()
          } else {
            done.fail(new Error(`Expected Calculated output, got: ${JSON.stringify(result)}`))
          }
        },
        (error) => done.fail(error)
      )
  })
  it("should calculate portfolio statistics of a bit more realistic scenario, 5 years", (done) => {
    function test(): Promise<Result<Calculated>> {
      const controller = new PrmController(loadStockHistoryFromAlphavantage)
      const symbols = vector(6, ["XOM", "INTC", "JCP", "PG", "ABT", "PEG"])
      return controller
        .returnRateStats(symbols, parseDate("2014-03-07"), parseDate("2019-03-07"), 0)
        .then((stats) => controller.calculate(stats, 1.0))
    }

    test().then((result: Result<Calculated>) => {
      assert.ok(result.success)
      log.debug(`output:\n${prettyPrint(result)}`)
      done()
    })
  })
  it("should fail when a symbol does not have enough price entries", (done) => {
    function test(): Promise<Result<Calculated>> {
      const controller = new PrmController(loadStockHistoryFromAlphavantage)
      const symbols = vector(2, ["AA", "XOM"])
      return controller
        .returnRateStats(symbols, parseDate("2014-03-07"), parseDate("2019-03-07"), 0)
        .then((stats) => controller.calculate(stats, 1.0))
    }

    test().then(
      (result: Result<Calculated>) => {
        done.fail(new Error(`Expected a failure, but received a result:\n${prettyPrint(result)}`))
      },
      (error) => {
        const startsWith = 'Cannot build a price matrix. Invalid number of prices for symbols: ["AA"]'
        if (error.message.startsWith(startsWith)) {
          done()
        } else {
          done.fail(new Error(`Expected error message that starts with: ${startsWith}, but got: ${error}`))
        }
      }
    )
  })
})
