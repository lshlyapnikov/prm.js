// @flow strict
/* global describe, it */
import _ from "underscore"
import assert from "assert"
import { from, range, Observable } from "rxjs"
import { flatMap, toArray } from "rxjs/operators"
import { validateMatrix } from "./linearAlgebra"
import { PrmController, Input, Output } from "./prmController"
import {
  dailyAdjustedStockPricesFromStream,
  dailyAdjustedStockPrices,
  AscendingDates
} from "../alphavantage/DailyAdjusted"
import { alphavantage } from "../../test-config.js"

function loadStockHistory(symbol: string, minDate: Date, maxDate: Date): Observable<number> {
  return dailyAdjustedStockPrices(alphavantage.apiKey, symbol, minDate, maxDate, AscendingDates)
}

function verifyPortfolioStatsObjects(o) {
  assert.ok(_.isObject(o))
  assert.ok(_.isArray(o.weights))
  assert.ok(_.isNumber(o.stdDev))
  assert.ok(_.isNumber(o.expectedReturnRate))
}

function verifyPortfolioAnalysisResult(r: [Input, Output]): void {
  console.log(JSON.stringify(r, null, 2))
  const [input, output] = r
  validateMatrix(input.rrKxN)
  validateMatrix(input.expectedRrNx1)
  validateMatrix(input.rrCovarianceNxN)
  verifyPortfolioStatsObjects(output.globalMinVarianceEfficientPortfolio)
  assert.ok(_.isArray(output.tangencyPortfolio))
  output.tangencyPortfolio.forEach(n => assert.ok(!_.isNaN(n)))
  assert.equal(output.efficientPortfolioFrontier.length, 21)
  output.efficientPortfolioFrontier.forEach(p => verifyPortfolioStatsObjects(p))
}

describe("PrmController", () => {
  it.skip("should calculate portfolio statistics", done => {
    const controller = new PrmController(loadStockHistory)
    controller
      .analyzeUsingPortfolioHistoricalPrices(["IBM", "AA"], new Date("1975/03/01"), new Date("1975/03/31"), 1.0)
      .subscribe(
        analysisResult => {
          verifyPortfolioAnalysisResult(analysisResult)
          done()
        },
        error => done(error)
      )
  })

  // TODO: DRY - search for AAA
  it.skip("should calculate 5 times the same tangency portfolio", done => {
    function test(attempt) {
      const controller = new PrmController(loadStockHistory)
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
      .subscribe(
        results => {
          console.log(JSON.stringify(results))
          assert.equal(results.length, attempts)
          const tangencyArr: Array<Array<number>> = results.map(r => r[1].tangencyPortfolio)
          for (let i = 1; i < attempts; i++) {
            assert.deepEqual(tangencyArr[i - 1], tangencyArr[i])
          }
          done()
        },
        error => done(error)
      )
  })

  // TODO: DRY - search for AAA
  it.skip("should calculate portfolio statistics of a bit more realistic scenario, 5 years", done => {
    function test() {
      const controller = new PrmController(loadStockHistory)
      const symbols = ["AA", "XOM", "INTC", "JCP", "PG", "STJ", "PEG"]
      return controller.analyzeUsingPortfolioHistoricalPrices(
        symbols,
        new Date("2011/05/27"),
        new Date("2016/05/27"),
        1.0
      )
    }

    test().subscribe(
      result => {
        const tangencyArr = result[1].tangencyPortfolio
        console.log("\nweights:")
        _(tangencyArr).each(w => console.log(w))
        done()
      },
      error => done(error)
    )
  })
})
