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
  log.warn(`Uknown command line arguments: ${uknownArgsStr}`)
}

log.info(`options: ${JSON.stringify(options)}`)

const stocks: Array<string> = options["stock"]
if (stocks === undefined || stocks.length == 0) {
  log.error("At least one --stock=<SYMBOL> argument is required")
  process.exit(1)
}
const years: number = options["years"]
if (years === undefined || years <= 0) {
  log.error("Number of years (> 0) have to be specified with --years=<INTEGER> argument")
  process.exit(2)
}

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
