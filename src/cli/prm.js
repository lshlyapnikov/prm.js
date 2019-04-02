// @flow strict
import commandLineArgs from "command-line-args"
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

log.info(`args: ${JSON.stringify(process.argv)}`)
const optionDefinitions = [
  {
    name: "stock",
    type: String,
    multiple: true,
    defaultValue: undefined,
    description: "A list of stock symbols"
  },
  {
    name: "years",
    type: Number,
    defaultValue: undefined,
    description: "Interval in years"
  }
]

const options = commandLineArgs(optionDefinitions, { stopAtFirstUnknown: true })

const uknownArgs: ?Array<string> = options["_unknown"]
if (uknownArgs != null) {
  const uknownArgsStr: string = uknownArgs.reduce((z: string, a: string) => z + ", " + a)
  log.error(`Uknown command line arguments: ${uknownArgsStr}`)
}

const stocks: Array<string> = options["stock"]
const years: number = options["years"]

// XOM, GOOG, VCSH, F
//  BAC COM STK FUND, DODGE & COX STOCK FUND (MUTF: DODGX), LIFEPATH INDEX 2040 FUND O

log.info(`options: ${JSON.stringify(options)}`)
log.info(`stocks: ${JSON.stringify(stocks)}`)
log.info(`years: ${JSON.stringify(years)}`)

const maxDate = new Date()
const minDate = subYears(maxDate, years)
const riskFreeRate: number = 0.01 / 10
// const myStocks: Array<string> = ["XOM", "GOOG", "F"] // ["XOM", "GOOG", "VCSH", "F"]

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
