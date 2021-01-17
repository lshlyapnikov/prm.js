// @flow strict
import { from, of, Observable, throwError } from "rxjs"
import { map, toArray, concatMap } from "rxjs/operators"
import { LocalDate } from "@js-joda/core"
import { type Vector } from "./vector"
import { type Matrix, matrix, isInvertableMatrix, generateRandomWeightsMatrix } from "./matrix"
import {
  efficientPortfolioFrontier as efficientPortfolioFrontierCtl,
  tangencyPortfolio as tangencyPortfolioCtl,
  globalMinimumVarianceEfficientPortfolio as globalMinimumVarianceEfficientPortfolioCtl
} from "./portfolioTheory"
import {
  PortfolioStats,
  createPortfolioStats,
  covariance,
  mean,
  calculateReturnRatesFromPriceMatrix
} from "./portfolioStats"
import { type SymbolPrices, maxPriceArrayLength, symbolPrices, createPriceMatrix } from "./priceMatrix"
import { type Result, success, failure } from "./result"

/**
 * expectedRrNx1     Expected Return Rates Matrix
 * rrCovarianceNxN   Return Rates Covariance Matrix
 */
export type ReturnRateStats<N: number> = {|
  expectedRrNx1: Matrix<N, 1, number>,
  rrCovarianceNxN: Matrix<N, N, number>
|}

// always allows short sales
export type Calculated = {|
  Calculated: true,
  globalMinVarianceEfficientPortfolio: PortfolioStats,
  tangencyPortfolio: PortfolioStats,
  efficientPortfolioFrontier: Array<PortfolioStats>
|}

export type Simulated = {|
  Simulated: true,
  allowShortSales: boolean,
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
   */
  returnRateStats<N: number>(
    symbols: Vector<N, string>,
    startDate: LocalDate,
    endDate: LocalDate
  ): Promise<ReturnRateStats<N>> {
    return from(symbols.values)
      .pipe(
        concatMap((s: string) => this.loadHistoricalPricesAsArray(s, startDate, endDate)),
        toArray(),
        concatMap((symbolPrices: Array<SymbolPrices>) => {
          const m: number = maxPriceArrayLength(symbolPrices)
          const n: N = symbols.n
          const pricesMxN = createPriceMatrix(symbols, symbolPrices, m)
          if (pricesMxN.success) {
            const rrKxN = calculateReturnRatesFromPriceMatrix(pricesMxN.value.values) // k = m - 1
            const expectedRrNx1_: $ReadOnlyArray<$ReadOnlyArray<number>> = mean(rrKxN)
            const expectedRrNx1: Matrix<N, 1, number> = matrix(n, 1, expectedRrNx1_)
            const rrCovarianceNxN_: $ReadOnlyArray<$ReadOnlyArray<number>> = covariance(rrKxN, false)
            const rrCovarianceNxN: Matrix<N, N, number> = matrix(n, n, rrCovarianceNxN_)
            const stats: ReturnRateStats<N> = { expectedRrNx1, rrCovarianceNxN }
            return of(stats)
          } else {
            return throwError(pricesMxN.error)
          }
        })
      )
      .toPromise()
  }

  calculate<N: number>(input: ReturnRateStats<N>, riskFreeRr: number): Result<Calculated> {
    if (riskFreeRr < 0) {
      return failure(`Invalid riskFreeRr: ${riskFreeRr}. Must be >= 0`)
    }
    if (isInvertableMatrix(input.rrCovarianceNxN)) {
      const globalMinVarianceEfficientPortfolio: PortfolioStats = globalMinimumVarianceEfficientPortfolioCtl.calculate(
        input.expectedRrNx1.values,
        input.rrCovarianceNxN.values
      )
      const tangencyPortfolio = tangencyPortfolioCtl.calculate(
        input.expectedRrNx1.values,
        input.rrCovarianceNxN.values,
        riskFreeRr
      )
      const efficientPortfolioFrontier = efficientPortfolioFrontierCtl.calculate(
        input.expectedRrNx1.values,
        input.rrCovarianceNxN.values
      )
      return success({
        Calculated: true,
        globalMinVarianceEfficientPortfolio,
        tangencyPortfolio,
        efficientPortfolioFrontier
      })
    } else {
      return failure(
        "Cannot calculate efficient portfolios: GlobalMinVarianceEfficientPortfolio and TangencyPortfolio. " +
          "Return rate covariance matrix (returnRatesCovarianceNxN) is NOT invertible. Use portfolio simulations."
      )
    }
  }

  simulate<M: number, N: number>(
    input: ReturnRateStats<N>,
    numberOfSimulations: M,
    seed: number,
    allowShortSales: boolean
  ): Result<Simulated> {
    const minNumberOfSimulations = 100
    if (numberOfSimulations < minNumberOfSimulations) {
      return failure(`Invalid numberOfSimulations: ${numberOfSimulations}. Min allowed: ${minNumberOfSimulations}`)
    }
    const m: M = numberOfSimulations
    const n: N = input.rrCovarianceNxN.n
    const weightsMxN: Matrix<M, N, number> = generateRandomWeightsMatrix(m, n, seed, allowShortSales)
    const simulations: Array<PortfolioStats> = weightsMxN.values.map((weightsN: $ReadOnlyArray<number>) =>
      createPortfolioStats(weightsN, input.expectedRrNx1.values, input.rrCovarianceNxN.values)
    )
    const globalMinVarianceEfficientPortfolio: PortfolioStats = minRiskPortfolio(simulations)
    return success({ Simulated: true, allowShortSales, globalMinVarianceEfficientPortfolio, simulations })
  }
}

function minRiskPortfolio(arr: $ReadOnlyArray<PortfolioStats>): PortfolioStats {
  const result: PortfolioStats = arr.reduce((z, a) => (z.stdDev < a.stdDev ? z : a))
  return result
}
