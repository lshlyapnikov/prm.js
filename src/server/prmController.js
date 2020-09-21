// @flow strict
import { from, of, Observable, Scheduler, timer, throwError } from "rxjs"
import { map, flatMap, toArray, ignoreElements, startWith, concatMap } from "rxjs/operators"
import { LocalDate } from "@js-joda/core"
import { type Matrix, isInvertableMatrix } from "./linearAlgebra"
import { type Vector, vector } from "./vector"
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

export type Output = Calculated | CannotCalculate | Simulated

export type Calculated = {|
  Calculated: true,
  globalMinVarianceEfficientPortfolio: PortfolioStats,
  tangencyPortfolio: PortfolioStats,
  efficientPortfolioFrontier: Array<PortfolioStats>
|}

export type CannotCalculate = {|
  CannotCalculate: true,
  message: string
|}

export type Simulated = {|
  Simulated: true,
  globalMinVarianceEfficientPortfolio: PortfolioStats,
  simulations: Array<PortfolioStats>
|}

export class PrmController {
  constructor(loadHistoricalPrices: (string, LocalDate, LocalDate) => Observable<number>) {
    this.loadHistoricalPrices = loadHistoricalPrices
  }

  loadHistoricalPrices: (string, LocalDate, LocalDate) => Observable<number>

  loadHistoricalPricesAsArray(symbol: string, startDate: LocalDate, endDate: LocalDate): Observable<Prices> {
    return this.loadHistoricalPrices(symbol, startDate, endDate).pipe(
      toArray(),
      map((prices) => new Prices(symbol, prices))
    )
  }

  /**
   * Returns portfolio analysis.
   *
   * @param symbols  The stock symbols you are interested in
   * @param startDate  Specifies the start of the interval, inclusive
   * @param endDate    Specifies the end of the interval, inclusive
   * @param riskFreeRr Risk Free Return Rate, ratio
   * @param delayMillis Delay between requests to market data provider, millis
   * @param scheduler  optional RxJs scheduler
   * @returns {{globalMinVarianceEfficientPortfolio: *, tangencyPortfolio: *, efficientPortfolioFrontier: *}}
   */
  analyzeUsingPortfolioHistoricalPrices<N: number>(
    symbols: Vector<N, string>,
    startDate: LocalDate,
    endDate: LocalDate,
    riskFreeRr: number,
    delayMillis: number,
    scheduler: ?Scheduler
  ): Promise<[Input, Output]> {
    const symbolsObservable: Observable<string> =
      scheduler != null ? from(symbols.values, scheduler) : from(symbols.values)
    return symbolsObservable
      .pipe(
        concatMap((value) => timer(delayMillis).pipe(ignoreElements(), startWith(value))),
        concatMap((s: string) => this.loadHistoricalPricesAsArray(s, startDate, endDate)),
        toArray(),
        flatMap((arr: Array<Prices>) => {
          const maxLength: number = arr.reduce((z, ps) => Math.max(z, ps.prices.length), 0)
          const invalidPrices: Array<Prices> = findInvalidPriceArray(arr, maxLength)
          if (maxLength == 0) {
            const badSymbols: Array<string> = arr.map((p) => p.symbol)
            return throwError(
              `Cannot build a price matrix. No prices loaded for all provided symbols: ${JSON.stringify(badSymbols)}.`
            )
          }
          if (invalidPrices.length > 0) {
            const badSymbols: Array<string> = invalidPrices.map((p) => p.symbol)
            return throwError(
              `Cannot build a price matrix. Invalid number of prices for symbols: ${JSON.stringify(badSymbols)}. ` +
                `All symbols must have the same number of price entries: ${maxLength}.`
            )
          }
          const pricesMxN: Matrix<number> = createPriceMatrix(symbols, vector(symbols.n, arr))
          const rrKxN = calculateReturnRatesFromPriceMatrix(pricesMxN)
          const expectedRrNx1 = mean(rrKxN)
          const rrCovarianceNxN = covariance(rrKxN, false)
          const input = new Input(rrKxN, expectedRrNx1, rrCovarianceNxN, riskFreeRr)
          const output = this.analyzeUsingPortfolioStatistics(input)
          return of([input, output])
        })
      )
      .toPromise()
  }

  analyzeUsingPortfolioStatistics(input: Input): Calculated | CannotCalculate {
    if (isInvertableMatrix(input.rrCovarianceNxN)) {
      return {
        Calculated: true,
        globalMinVarianceEfficientPortfolio: globalMinimumVarianceEfficientPortfolio.calculate(
          input.expectedRrNx1,
          input.rrCovarianceNxN
        ),
        tangencyPortfolio: tangencyPortfolio.calculate(input.expectedRrNx1, input.rrCovarianceNxN, input.riskFreeRr),
        efficientPortfolioFrontier: efficientPortfolioFrontier.calculate(input.expectedRrNx1, input.rrCovarianceNxN)
      }
    } else {
      return {
        CannotCalculate: true,
        message:
          "Cannot calculate efficient portfolios: GlobalMinVarianceEfficientPortfolio and TangencyPortfolio. " +
          "Return rate covariance matrix (returnRatesCovarianceNxN) is NOT invertible. Use portfolio simulations."
      }
    }
  }
}

// returns Array of invalid Prices or empty Array
function findInvalidPriceArray(array: Array<Prices>, expectedLength: number): Array<Prices> {
  function collectInvalidPrices(z: Array<Prices>, p: Prices): Array<Prices> {
    if (p.prices.length != expectedLength) {
      return z.concat(p)
    } else {
      return z
    }
  }

  const invalidPrices: Array<Prices> = array.reduce(collectInvalidPrices, [])

  return invalidPrices
}
