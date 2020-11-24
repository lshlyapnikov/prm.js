// @flow strict
import { from, of, Observable, Scheduler, timer, throwError } from "rxjs"
import { map, toArray, ignoreElements, startWith, concatMap } from "rxjs/operators"
import { LocalDate } from "@js-joda/core"
import { type Vector, vector } from "./vector"
import { type Matrix, matrix, isInvertableMatrix } from "./matrix"
import {
  efficientPortfolioFrontier as efficientPortfolioFrontierCtl,
  tangencyPortfolio as tangencyPortfolioCtl,
  globalMinimumVarianceEfficientPortfolio as globalMinimumVarianceEfficientPortfolioCtl
} from "./portfolioTheory"
import { PortfolioStats, covariance, mean, calculateReturnRatesFromPriceMatrix } from "./portfolioStats"
import { type SymbolPrices, symbolPrices, createPriceMatrix } from "./priceMatrixSafe"
import { type Result, equalArrays } from "./utils"

/**
 * expectedRrNx1     Expected Return Rates Matrix
 * rrCovarianceNxN   Return Rates Covariance Matrix
 * riskFreeRr        Risk Free Return Rate
 */
export type Input<N: number> = {|
  expectedRrNx1: Matrix<N, 1, number>,
  rrCovarianceNxN: Matrix<N, N, number>,
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
    return this.loadHistoricalPrices(symbol, startDate, endDate).pipe(
      toArray(),
      map((prices) => symbolPrices(symbol, prices))
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
  ): Promise<[Input<N>, Output]> {
    const symbolsObservable: Observable<string> =
      scheduler != null ? from(symbols.values, scheduler) : from(symbols.values)
    return symbolsObservable
      .pipe(
        concatMap((value) => timer(delayMillis).pipe(ignoreElements(), startWith(value))),
        concatMap((s: string) => this.loadHistoricalPricesAsArray(s, startDate, endDate)),
        toArray(),
        concatMap((symbolPrices: Array<SymbolPrices>) => {
          const orderOfSymbolsIsTheSame = checkOrderOfSymbols(symbols, symbolPrices)
          if (!orderOfSymbolsIsTheSame.success) {
            return throwError(orderOfSymbolsIsTheSame.error)
          }
          const m: number = maxPriceArrayLength(symbolPrices)
          if (m <= 0) {
            return throwError(new Error(`Cannot build a price matrix. m: ${m}.`))
          }

          const n: N = symbols.n
          const pricesMxN = createPriceMatrix(vector(n, symbolPrices), m)

          if (pricesMxN.success) {
            const rrKxN = calculateReturnRatesFromPriceMatrix(pricesMxN.value.values) // k = m - 1
            const expectedRrNx1_: $ReadOnlyArray<$ReadOnlyArray<number>> = mean(rrKxN)
            const expectedRrNx1: Matrix<N, 1, number> = matrix(n, 1, expectedRrNx1_)
            const rrCovarianceNxN_: $ReadOnlyArray<$ReadOnlyArray<number>> = covariance(rrKxN, false)
            const rrCovarianceNxN: Matrix<N, N, number> = matrix(n, n, rrCovarianceNxN_)
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
        input.expectedRrNx1.values,
        input.rrCovarianceNxN.values
      )
      const tangencyPortfolio = tangencyPortfolioCtl.calculate(
        input.expectedRrNx1.values,
        input.rrCovarianceNxN.values,
        input.riskFreeRr
      )
      const efficientPortfolioFrontier = efficientPortfolioFrontierCtl.calculate(
        input.expectedRrNx1.values,
        input.rrCovarianceNxN.values
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

function maxPriceArrayLength(arr: Array<SymbolPrices>): number {
  const result: number = arr.reduce((z, ps) => Math.max(z, ps.prices.length), 0)
  return result
}

function checkOrderOfSymbols<N: number>(
  symbols: Vector<N, string>,
  symbolPrices: $ReadOnlyArray<SymbolPrices>
): Result<{}> {
  const symbols2: $ReadOnlyArray<string> = symbolPrices.map((p) => p.symbol)
  if (equalArrays(symbols.values, symbols2)) {
    return { success: true, value: {} }
  } else {
    const error = new Error(
      `The order of symbols has changed from: ${JSON.stringify(symbols.values)} to: ${JSON.stringify(symbols2)}.`
    )
    return { success: false, error }
  }
}
