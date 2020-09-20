// @flow strict
import { from, of, Observable, Scheduler, timer, throwError } from "rxjs"
import { map, toArray, ignoreElements, startWith, concatMap } from "rxjs/operators"
import { LocalDate } from "@js-joda/core"
import { type Matrix, isInvertableMatrix } from "./linearAlgebra"
import { type Vector } from "./vector"
import {
  efficientPortfolioFrontier as efficientPortfolioFrontierCtl,
  tangencyPortfolio as tangencyPortfolioCtl,
  globalMinimumVarianceEfficientPortfolio as globalMinimumVarianceEfficientPortfolioCtl
} from "./portfolioTheory"
import { PortfolioStats, covariance, mean, calculateReturnRatesFromPriceMatrix } from "./portfolioStats"
import { type SymbolPrices, symbolPrices, createPriceMatrix, maxPriceArrayLength } from "./priceMatrix"
import { logger } from "./utils"

const log = logger("server/prmController.js")

/**
 * rrKxN             Return Rates Matrix
 * expectedRrNx1     Expected Return Rates Matrix
 * rrCovarianceNxN   Return Rates Covariance Matrix
 * riskFreeRr        Risk Free Return Rate
 */
export type Input<N: number> = {|
  // rrKxN: Matrix<number, M, N>,
  expectedRrNx1: Matrix<number, N, 1>,
  rrCovarianceNxN: Matrix<number, N, N>,
  riskFreeRr: number
|}

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

  loadHistoricalPricesAsArray(symbol: string, startDate: LocalDate, endDate: LocalDate): Observable<SymbolPrices> {
    log.debug(`loadHistoricalPricesAsArray: ${symbol}, ${JSON.stringify(startDate)}, ${JSON.stringify(endDate)}`)
    return this.loadHistoricalPrices(symbol, startDate, endDate).pipe(
      toArray(),
      map((prices: Array<number>) => symbolPrices(symbol, prices))
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
    symbols: Vector<string, N>,
    startDate: LocalDate,
    endDate: LocalDate,
    riskFreeRr: number,
    delayMillis: number,
    scheduler: ?Scheduler
  ): Promise<[Input<N>, Output]> {
    const symbolsObservable: Observable<string> =
      scheduler != null ? from(symbols.values, scheduler) : from(symbols.values)
    return symbolsObservable
      .pipe(
        concatMap((value) => timer(delayMillis).pipe(ignoreElements(), startWith(value))),
        concatMap((s: string) => this.loadHistoricalPricesAsArray(s, startDate, endDate)),
        toArray(),
        concatMap((arr: Array<SymbolPrices>) => {
          const pricesMxN = createPriceMatrix(symbols, arr, maxPriceArrayLength(arr))
          if (pricesMxN.success) {
            const rrKxN = calculateReturnRatesFromPriceMatrix(pricesMxN.value, pricesMxN.value.m - 1)
            const expectedRrNx1 = mean(rrKxN)
            const rrCovarianceNxN = covariance(rrKxN, false)
            const input: Input<N> = { expectedRrNx1, rrCovarianceNxN, riskFreeRr }
            const output: Calculated | CannotCalculate = this.analyzeUsingPortfolioStatistics(input)
            return of([input, output])
          } else {
            return throwError(pricesMxN.error)
          }
        })
      )
      .toPromise()
  }

  analyzeUsingPortfolioStatistics<N: number>(input: Input<N>): Calculated | CannotCalculate {
    if (isInvertableMatrix(input.rrCovarianceNxN)) {
      const globalMinVarianceEfficientPortfolio: PortfolioStats = globalMinimumVarianceEfficientPortfolioCtl.calculate(
        input.expectedRrNx1,
        input.rrCovarianceNxN
      )
      const tangencyPortfolio = tangencyPortfolioCtl.calculate(
        input.expectedRrNx1,
        input.rrCovarianceNxN,
        input.riskFreeRr
      )
      const efficientPortfolioFrontier = efficientPortfolioFrontierCtl.calculate(
        input.expectedRrNx1,
        input.rrCovarianceNxN
      )
      return { Calculated: true, globalMinVarianceEfficientPortfolio, tangencyPortfolio, efficientPortfolioFrontier }
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
