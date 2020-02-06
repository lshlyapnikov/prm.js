// @flow strict
import * as yargs from "yargs"
import { prettyPrint } from "numeric"
import { logger } from "../server/utils"
import { PrmController, Input, Output } from "../server/prmController"
import { dailyAdjustedStockPrices, AscendingDates } from "../alphavantage/DailyAdjusted"
import { subYears } from "date-fns"

const log = logger("cli/prm.js")

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

// log.info(`args: ${JSON.stringify(process.argv)}`)

const options = yargs
  .usage("$0 [options]")
  .help("help")
  .example(
    "$0 --stocks=IBM,MSFT --years=3 --api-key=<Alphavantage API key> --delay-millis=0 " +
      "--annual-risk-free-return-rate=0.01",
    "Calculate statistics for stock portfolio consisting of: IBM, MSFT; using Alphavantage historical stock prices for the last 3 years."
  )
  .options({
    stocks: {
      description: "A comma-separated list of stock symbols",
      requiresArg: true,
      demandOption: true,
      type: "string"
    },
    years: {
      description: "Stock price history interval, years",
      requiresArg: true,
      demandOption: true,
      type: "number"
    },
    "api-key": {
      description: "Alphavantage API key",
      requiresArg: true,
      demandOption: true,
      type: "string"
    },
    "delay-millis": {
      description: "Delay between stock price history requests, millis",
      requiresArg: true,
      demandOption: true,
      type: "number"
    },
    "annual-risk-free-return-rate": {
      description: "Annual risk free return rate, ratio (P1/P0 - 1)",
      requiresArg: true,
      demandOption: true,
      type: "number"
    }
  }).argv

const stocks: Array<string> = mixedToString(options["stocks"]).split(",")
const years: number = mixedToNumber(options["years"])
const apiKey: string = mixedToString(options["api-key"])
const delayMillis: number = mixedToNumber(options["delay-millis"])
const annualRiskFreeReturnRate: number = mixedToNumber(options["annual-risk-free-return-rate"])

log.info(`stocks: ${JSON.stringify(stocks)}`)
log.info(`years: ${years}`)
log.info(`api-key: ${apiKey}`)
log.info(`delay-millis: ${delayMillis}`)
log.info(`annual-risk-free-return-rate: ${annualRiskFreeReturnRate}`)

const maxDate = new Date()
const minDate = subYears(maxDate, years)
const dailyRiskFreeReturnRate: number = Math.pow(annualRiskFreeReturnRate + 1.0, 1.0 / 365) - 1

log.info(`minDate: ${minDate.toString()}`)
log.info(`maxDate: ${maxDate.toString()}`)
log.info(`dailyRiskFreeReturnRate: ${dailyRiskFreeReturnRate}`)

const controller = new PrmController((symbol, minDate, maxDate) => {
  log.info(`loading symbol: ${symbol}`)
  return dailyAdjustedStockPrices(apiKey, symbol, minDate, maxDate, AscendingDates)
})
controller.analyzeUsingPortfolioHistoricalPrices(stocks, minDate, maxDate, dailyRiskFreeReturnRate, delayMillis).then(
  (analysisResult: [Input, Output]) => {
    const output: Output = analysisResult[1]
    log.info(`stocks: ${JSON.stringify(stocks)}`)
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
