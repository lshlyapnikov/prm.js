// @flow strict
import assert from "assert"
import { from, range, throwError, Observable } from "rxjs"
import { flatMap, toArray } from "rxjs/operators"
import { validateMatrix } from "./linearAlgebra"
import { PrmController, Input, Output } from "./prmController"
import { PortfolioStats } from "./portfolioStats"
import { dailyAdjustedStockPrices, AscendingDates } from "../alphavantage/DailyAdjusted"
import { toFixedNumber, newArrayWithScale } from "./utils"
import { alphavantage } from "../../test-config.js"
import * as testData from "./testData"
import { logger } from "./utils"

const log = logger("prmController.test.js")

function loadStockHistoryFromAlphavantage(symbol: string, minDate: Date, maxDate: Date): Observable<number> {
  return dailyAdjustedStockPrices(alphavantage.apiKey, symbol, minDate, maxDate, AscendingDates)
}

// eslint-disable-next-line no-unused-vars
function loadMockStockHistory(symbol: string, dummy0: Date, dummy1: Date): Observable<number> {
  if (symbol === "NYX") return from(testData.NYX)
  else if (symbol == "INTC") return from(testData.INTC)
  else return throwError(`Unsupported mock symbol: ${symbol}`)
}

function verifyPortfolioStatsObjects(o: PortfolioStats) {
  assert.ok(o !== null)
}

function verifyPortfolioAnalysisResult(r: [Input, Output]): void {
  const [input, output] = r
  validateMatrix(input.rrKxN)
  validateMatrix(input.expectedRrNx1)
  validateMatrix(input.rrCovarianceNxN)
  verifyPortfolioStatsObjects(output.globalMinVarianceEfficientPortfolio)
  verifyPortfolioStatsObjects(output.tangencyPortfolio)
  assert.equal(output.efficientPortfolioFrontier.length, 21)
  output.efficientPortfolioFrontier.forEach(p => verifyPortfolioStatsObjects(p))
}

describe("PrmController", () => {
  it("should calculate portfolio statistics", done => {
    const controller = new PrmController(loadMockStockHistory)
    controller
      .analyzeUsingPortfolioHistoricalPrices(["NYX", "INTC"], new Date("1111/11/11"), new Date("1111/11/11"), 1.0)
      .subscribe(
        (analysisResult: [Input, Output]) => {
          verifyPortfolioAnalysisResult(analysisResult)
          const [input, output] = analysisResult
          assert.ok(input !== null)
          // numbers are from the lecture, I think
          assert.equal(toFixedNumber(output.globalMinVarianceEfficientPortfolio.expectedReturnRate * 100, 2), 0.64)
          assert.strictEqual(toFixedNumber(output.globalMinVarianceEfficientPortfolio.stdDev * 100, 2), 7.37)
          assert.deepStrictEqual(newArrayWithScale(output.globalMinVarianceEfficientPortfolio.weights, 2), [0.11, 0.89])
          done()
        },
        error => done.fail(error)
      )
  })

  // TODO: DRY - search for AAA
  it.skip("should calculate 5 times the same tangency portfolio", done => {
    function test(attempt) {
      log.info(`attempt: ${attempt}`)
      const controller = new PrmController(loadStockHistoryFromAlphavantage)
      const symbols = ["AA", "XOM", "INTC", "JCP", "PG"]
      return controller.analyzeUsingPortfolioHistoricalPrices(
        symbols,
        new Date("2015/05/27"),
        new Date("2016/05/27"),
        1.0
      )
    }

    const attempts = 5
    range(0, attempts)
      .pipe(
        flatMap(x => test(x)),
        toArray()
      )
      .subscribe(results => {
        assert.strictEqual(results.length, attempts)
        const tangencyArr: Array<Array<number>> = results.map(r => r[1].tangencyPortfolio)
        for (let i = 1; i < attempts; i++) {
          assert.deepStrictEqual(tangencyArr[i - 1], tangencyArr[i])
        }
        done()
      })
  })

  // TODO: DRY - search for AAA
  it.skip("should calculate portfolio statistics of a bit more realistic scenario, 5 years", done => {
    function test(): Observable<[Input, Output]> {
      const controller = new PrmController(loadStockHistoryFromAlphavantage)
      const symbols = ["AA", "XOM", "INTC", "JCP", "PG", "STJ", "PEG"]
      return controller.analyzeUsingPortfolioHistoricalPrices(
        symbols,
        new Date("2011/05/27"),
        new Date("2016/05/27"),
        1.0
      )
    }

    test().subscribe((result: [Input, Output]) => {
      const weights: Array<number> = result[1].tangencyPortfolio.weights
      log.info(`\nweights: ${JSON.stringify(weights)}`)
      done()
    })
  })
})
