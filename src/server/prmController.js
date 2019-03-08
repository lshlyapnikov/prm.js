// @flow strict
import { from, Observable } from "rxjs"
import { map, flatMap, toArray } from "rxjs/operators"
import { type Matrix } from "./linearAlgebra"
import {
  efficientPortfolioFrontier,
  tangencyPortfolio,
  globalMinimumVarianceEfficientPortfolio
} from "./portfolioTheory"
import { PortfolioStats, covariance, mean, calculateReturnRatesFromPriceMatrix } from "./portfolioStats"
import { Prices, createPriceMatrix } from "./priceMatrix"

export class Input {
  /**
   * @param {Array.<Array.<Number>>} rrKxN             Return Rates Matrix
   * @param {Array.<Array.<Number>>} expectedRrNx1     Expected Return Rates Matrix
   * @param {Array.<Array.<Number>>} rrCovarianceNxN   Return Rates Covariance Matrix
   * @param {Number}                 riskFreeRr        Risk Free Return Rate
   */

  constructor(
    rrKxN: Matrix<number>,
    expectedRrNx1: Matrix<number>,
    rrCovarianceNxN: Matrix<number>,
    riskFreeRr: number
  ) {
    this.rrKxN = rrKxN
    this.expectedRrNx1 = expectedRrNx1
    this.rrCovarianceNxN = rrCovarianceNxN
    this.riskFreeRr = riskFreeRr
  }

  rrKxN: Matrix<number>
  expectedRrNx1: Matrix<number>
  rrCovarianceNxN: Matrix<number>
  riskFreeRr: number
}

export class Output {
  constructor(
    globalMinVarianceEfficientPortfolio: PortfolioStats,
    tangencyPortfolio: PortfolioStats,
    efficientPortfolioFrontier: Array<PortfolioStats>
  ) {
    this.globalMinVarianceEfficientPortfolio = globalMinVarianceEfficientPortfolio
    this.tangencyPortfolio = tangencyPortfolio
    this.efficientPortfolioFrontier = efficientPortfolioFrontier
  }
  globalMinVarianceEfficientPortfolio: PortfolioStats
  tangencyPortfolio: PortfolioStats
  efficientPortfolioFrontier: Array<PortfolioStats>
}

export class PrmController {
  constructor(loadHistoricalPrices: (string, Date, Date) => Observable<number>) {
    this.loadHistoricalPrices = loadHistoricalPrices
  }

  loadHistoricalPrices: (string, Date, Date) => Observable<number>

  loadHistoricalPricesAsArray(symbol: string, minDate: Date, maxDate: Date): Observable<Prices> {
    return this.loadHistoricalPrices(symbol, minDate, maxDate).pipe(
      toArray(),
      map(prices => new Prices(symbol, prices))
    )
  }

  /**
   * Returns portfolio analysis.
   *
   * @param symbols  The stock symbols you are interested in
   * @param startDate  Specifies the start of the interval, inclusive
   * @param endDate    Specifies the end of the interval, inclusive
   * @param riskFreeRr Risk Free Return Rate
   * @returns {{globalMinVarianceEfficientPortfolio: *, tangencyPortfolio: *, efficientPortfolioFrontier: *}}
   */

  analyzeUsingPortfolioHistoricalPrices(
    symbols: Array<string>,
    startDate: Date,
    endDate: Date,
    riskFreeRr: number
  ): Promise<[Input, Output]> {
    // TODO: would be nice if `loadHistoricalPrices` can be run in parallel
    return from(symbols)
      .pipe(
        flatMap((s: string) => this.loadHistoricalPricesAsArray(s, startDate, endDate)),
        toArray(),
        map((arr: Array<Prices>) => {
          const pricesMxN: Matrix<number> = createPriceMatrix(symbols, arr)
          const rrKxN = calculateReturnRatesFromPriceMatrix(pricesMxN)
          const expectedRrNx1 = mean(rrKxN)
          const rrCovarianceNxN = covariance(rrKxN, false)
          const input = new Input(rrKxN, expectedRrNx1, rrCovarianceNxN, riskFreeRr)
          const output = this.analyzeUsingPortfolioStatistics(input)
          return [input, output]
        })
      )
      .toPromise()
  }

  analyzeUsingPortfolioStatistics(input: Input): Output {
    return new Output(
      globalMinimumVarianceEfficientPortfolio.calculate(input.expectedRrNx1, input.rrCovarianceNxN),
      tangencyPortfolio.calculate(input.expectedRrNx1, input.rrCovarianceNxN, input.riskFreeRr),
      efficientPortfolioFrontier.calculate(input.expectedRrNx1, input.rrCovarianceNxN)
    )
  }
}
