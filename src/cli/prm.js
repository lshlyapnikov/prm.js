// @flow strict
import * as yargs from "yargs"
import { Observable } from "rxjs"
import { prettyPrint } from "numeric"
import { logger } from "../server/utils"
import { PrmController, Input, Output } from "../server/prmController"
import { dailyAdjustedStockPrices, AscendingDates } from "../alphavantage/DailyAdjusted"
import { subYears } from "date-fns"

// import { alphavantage } from "../../test-config.js"
const alphavantage: { apiKey: string } = {
  apiKey: "S2A8UKWLTKUMVG88"
}
const log = logger("cli/prm.js")

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function loadStockHistoryFromAlphavantage(symbol: string, minDate: Date, maxDate: Date): Observable<number> {
  sleep(5000)
  return dailyAdjustedStockPrices(alphavantage.apiKey, symbol, minDate, maxDate, AscendingDates)
}

function cumulativeReturnRate(returnRate: number, periods: number): number {
  return Math.pow(1 + returnRate, periods) - 1
}

function mixedToString(a: mixed): string {
  if (typeof a === "string") {
    return (a: string)
  } else {
    throw new Error(`Cannot convert mixed to string`)
  }
}

function mixedToNumber(a: mixed): number {
  if (typeof a === "number") {
    return (a: number)
  } else {
    throw new Error(`Cannot convert mixed to number`)
  }
}

log.info(`args: ${JSON.stringify(process.argv)}`)

const options = yargs
  .usage("$0 [options]")
  .help("help")
  .options({
    stocks: {
      description: "A comma-separated list of stock symbols, example: --stocks=IBM,MSFT",
      requiresArg: true,
      demandOption: true,
      type: "string"
    },
    years: {
      description: "Interval in years, example: --years=3",
      requiresArg: true,
      demandOption: true,
      type: "number"
    }
  }).argv

const stocks: Array<string> = mixedToString(options["stocks"]).split(",")
const years: number = mixedToNumber(options["years"])

log.info(`stocks: ${JSON.stringify(stocks)}`)
log.info(`years: ${JSON.stringify(years)}`)

const maxDate = new Date()
const minDate = subYears(maxDate, years)
const riskFreeRate: number = 0.01 / 10

log.info(`minDate: ${minDate.toString()}, maxDate: ${maxDate.toString()}`)

const controller = new PrmController(loadStockHistoryFromAlphavantage)
controller.analyzeUsingPortfolioHistoricalPrices(stocks, minDate, maxDate, riskFreeRate).then(
  (analysisResult: [Input, Output]) => {
    const output: Output = analysisResult[1]
    log.info(`tangencyPortfolio:\n${prettyPrint(output.tangencyPortfolio)}`)
    log.info(`globalMinVarianceEfficientPortfolio:\n${prettyPrint(output.globalMinVarianceEfficientPortfolio)}`)
    log.info(
      `tangencyAnnualInterest, %: ${cumulativeReturnRate(output.tangencyPortfolio.expectedReturnRate, 365) * 100}`
    )
    log.info(
      `minVarianceAnnualInterest, %: ${cumulativeReturnRate(
        output.globalMinVarianceEfficientPortfolio.expectedReturnRate,
        365
      ) * 100}`
    )
  },
  error => log.error(error)
)
