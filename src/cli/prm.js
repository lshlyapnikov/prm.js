// @flow strict
import commandLineArgs from "command-line-args"
import { Observable } from "rxjs"
import { prettyPrint } from "numeric"
import { logger } from "../server/utils"
import { PrmController, Input, Output } from "../server/prmController"
import { dailyAdjustedStockPrices, AscendingDates } from "../alphavantage/DailyAdjusted"
// import { alphavantage } from "../../test-config.js"
const alphavantage: { apiKey: string } = {
  apiKey: "S2A8UKWLTKUMVG88"
}
const log = logger("cli/prm.js")

function loadStockHistoryFromAlphavantage(symbol: string, minDate: Date, maxDate: Date): Observable<number> {
  return dailyAdjustedStockPrices(alphavantage.apiKey, symbol, minDate, maxDate, AscendingDates)
}

log.info(`args: ${JSON.stringify(process.argv)}`)
const optionDefinitions = [
  {
    name: "stocks",
    type: String,
    multiple: true,
    defaultValue: undefined,
    description: "A list of stock symbols"
  },
  {
    name: "interval",
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

const stocks: Array<string> = options["stocks"]
const interval: number = options["interval"]

// XOM, GOOG, VCSH, F
//  BAC COM STK FUND, DODGE & COX STOCK FUND (MUTF: DODGX), LIFEPATH INDEX 2040 FUND O

log.info(`options: ${JSON.stringify(options)}`)
log.info(`stocks: ${JSON.stringify(stocks)}`)
log.info(`interval: ${JSON.stringify(interval)}`)

const minDate = new Date("2014-03-12")
const maxDate = new Date("2019-03-12")
const riskFreeRate = 0.01

const controller = new PrmController(loadStockHistoryFromAlphavantage)
controller.analyzeUsingPortfolioHistoricalPrices(["XOM", "GOOG", "VCSH", "F"], minDate, maxDate, riskFreeRate).then(
  (analysisResult: [Input, Output]) => {
    const output: Output = analysisResult[1]
    log.info(`tangencyPortfolio:\n${prettyPrint(output.tangencyPortfolio)}`)
  },
  error => log.error(error)
)
