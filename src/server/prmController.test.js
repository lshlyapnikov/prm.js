// @flow strict
import assert from "assert"
import fs from "fs"
import { prettyPrint } from "numeric"
import { from, throwError, Observable } from "rxjs"
import { LocalDate } from "@js-joda/core"
import { validateMatrix } from "./linearAlgebra"
import { vector } from "./vector"
import { PrmController, Input, type Output } from "./prmController"
import { PortfolioStats } from "./portfolioStats"
import { dailyAdjustedStockPricesFromStream, AscendingDates } from "../alphavantage/DailyAdjusted"
import { toFixedNumber, newArrayWithScale, type JestDoneFn } from "./utils"
import * as testData from "./testData"
import { logger, parseDate } from "./utils"

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

function verifyPortfolioAnalysisResult(r: [Input, Output], done: JestDoneFn): void {
  const [input, output] = r
  validateMatrix(input.rrKxN)
  validateMatrix(input.expectedRrNx1)
  validateMatrix(input.rrCovarianceNxN)
  if (output.Calculated) {
    verifyPortfolioStatsObjects(output.globalMinVarianceEfficientPortfolio)
    assert.equal(output.efficientPortfolioFrontier.length, 21)
    output.efficientPortfolioFrontier.forEach((p) => verifyPortfolioStatsObjects(p))
    verifyPortfolioStatsObjects(output.tangencyPortfolio)
  } else {
    done.fail(new Error(`Expected Calculated output, got: ${JSON.stringify(output)}`))
  }
}

describe("PrmController", () => {
  it("should calculate portfolio statistics", (done) => {
    const controller = new PrmController(loadMockStockHistory)
    controller
      .analyzeUsingPortfolioHistoricalPrices(
        vector(2, ["NYX", "INTC"]),
        parseDate("1111-11-11"),
        parseDate("1111-11-11"),
        1.0,
        0
      )
      .then(
        (analysisResult: [Input, Output]) => {
          verifyPortfolioAnalysisResult(analysisResult, done)
          const [input, output] = analysisResult
          assert.ok(input !== null)
          // numbers are from the lecture, I think
          if (output.Calculated) {
            assert.equal(toFixedNumber(output.globalMinVarianceEfficientPortfolio.expectedReturnRate * 100, 2), 0.64)
            assert.strictEqual(toFixedNumber(output.globalMinVarianceEfficientPortfolio.stdDev * 100, 2), 7.37)
            assert.deepStrictEqual(newArrayWithScale(output.globalMinVarianceEfficientPortfolio.weights, 2), [
              0.11,
              0.89
            ])
            done()
          } else {
            done.fail(new Error(`Expected Calculated output, got: ${JSON.stringify(output)}`))
          }
        },
        (error) => done.fail(error)
      )
  })
  it("should calculate portfolio statistics of a bit more realistic scenario, 5 years", (done) => {
    function test(): Promise<[Input, Output]> {
      const controller = new PrmController(loadStockHistoryFromAlphavantage)
      const symbols = vector(6, ["XOM", "INTC", "JCP", "PG", "ABT", "PEG"])
      return controller.analyzeUsingPortfolioHistoricalPrices(
        symbols,
        parseDate("2014-03-07"),
        parseDate("2019-03-07"),
        1.0,
        0
      )
    }

    test().then((result: [Input, Output]) => {
      const output = result[1]
      log.debug(`output:\n${prettyPrint(output)}`)
      done()
    })
  })
  it("should fail when a symbol does not have enough price entries", (done) => {
    function test(): Promise<[Input, Output]> {
      const controller = new PrmController(loadStockHistoryFromAlphavantage)
      const symbols = vector(2, ["AA", "XOM"])
      return controller.analyzeUsingPortfolioHistoricalPrices(
        symbols,
        parseDate("2014-03-07"),
        parseDate("2019-03-07"),
        1.0,
        0
      )
    }

    test().then(
      (result: [Input, Output]) => {
        const output = result[1]
        done.fail(new Error(`Expected a failure, but received a result:\n${prettyPrint(output)}`))
      },
      (error) => {
        const startsWith = 'Cannot build a price matrix. Invalid number of prices for symbols: ["AA"]'
        if (typeof error === "string" && error.startsWith(startsWith)) {
          done()
        } else {
          done.fail(new Error(`Expected error message that starts with: ${startsWith}, but got: ${error}`))
        }
      }
    )
  })
})
