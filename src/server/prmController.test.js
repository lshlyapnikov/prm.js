/* global describe, it */
import _ from "underscore"
import assert from "assert"
import { Observable, range } from "rxjs"
import { from } from 'rxjs'
import { flatMap, toArray } from 'rxjs/operators'
import la from "./linearAlgebra"
import prmController from "./prmController"
import pStats from "./portfolioStats"
import pTheory from "./portfolioTheory"
import csv from "csv-parser"
import fs from "fs"
import request from "request"

function verifyPortfolioStatsObjects(o) {
  assert.ok(_.isObject(o))
  assert.ok(_.isArray(o.weights))
  assert.ok(_.isNumber(o.stdDev))
  assert.ok(_.isNumber(o.expectedReturnRate))
}

function verifyPortfolioAnalysisResult(r) {
  console.log(JSON.stringify(r, null, 2))
  assert.ok(_.isObject(r))
  assert.ok(_.isObject(r.input))
  la.validateMatrix(r.input.rrKxN)
  la.validateMatrix(r.input.expectedRrNx1)
  la.validateMatrix(r.input.rrCovarianceNxN)
  assert.ok(_.isNumber(r.input.riskFreeRr))
  assert.ok(_.isObject(r.output))
  verifyPortfolioStatsObjects(r.output.globalMinVarianceEfficientPortfolio)
  assert.ok(_.isArray(r.output.tangencyPortfolio))
  _(r.output.tangencyPortfolio).each(n => assert.ok(!_.isNaN(n)))
  assert.ok(_.isArray(r.output.efficientPortfolioFrontier))
  assert.equal(r.output.efficientPortfolioFrontier.length, 21)
  _(r.output.efficientPortfolioFrontier).each(p => verifyPortfolioStatsObjects(p))
}

describe("PrmController", () => {
  it.skip("should calculate portfolio statistics", (done) => {
    const controller = prmController.create(yahooFinanceApi.loadStockHistory, pStats,
      pTheory)
    controller.analyzeUsingPortfolioHistoricalPrices(
      ["IBM", "AA"],
      new Date("1975/03/01"),
      new Date("1975/03/31"),
      1.0).subscribe(analysisResult => {
        verifyPortfolioAnalysisResult(analysisResult)
        done()
      },
      error => done(error)
    )
  })

  // TODO: DRY - search for AAA
  it.skip("should calculate 5 times the same tangency portfolio", (done) => {
    function test(attempt) {
      const controller = prmController.create(yahooFinanceApi.loadStockHistory, pStats,
        pTheory)
      const symbols = ["AA", "XOM", "INTC", "JCP", "PG"]
      return controller.analyzeUsingPortfolioHistoricalPrices(
        symbols,
        new Date("2015/05/27"),
        new Date("2016/05/27"),
        1.0)
    }

    const attempts = 5
    range(0, attempts).pipe(
      flatMap((x) => test(x)),
      toArray()
    ).subscribe(results => {
        console.log(JSON.stringify(results))
        assert.equal(results.length, attempts)
        const tangencyArr = _(results).map(r => r.output.tangencyPortfolio)
        for (var i = 1; i < attempts; i++) {
          assert.deepEqual(tangencyArr[i - 1], tangencyArr[i])
        }
        done()
      },
      error => done(error)
    )
  })

  // TODO: DRY - search for AAA
  it.skip("should calculate portfolio statistics of a bit more realistic scenario, 5 years", (
    done) => {
    function test() {
      const controller = prmController.create(yahooFinanceApi.loadStockHistory, pStats,
        pTheory)
      const symbols = ["AA", "XOM", "INTC", "JCP", "PG", "STJ", "PEG"]
      return controller.analyzeUsingPortfolioHistoricalPrices(
        symbols,
        new Date("2011/05/27"),
        new Date("2016/05/27"),
        1.0)
    }

    test().subscribe(result => {
        const tangencyArr = result.output.tangencyPortfolio
        console.log("\nweights:")
        _(tangencyArr).each(w => console.log(w))
        done()
      },
      error => done(error)
    )
  })
})
