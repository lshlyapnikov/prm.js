// @flow strict
import * as yargs from "yargs"
import fs from "fs"
import stream from "stream"
import { LocalDate } from "@js-joda/core"
import { prettyPrint } from "numeric"
import { logger, formatDate, parseDate, today, periodReturnRate } from "../server/utils"
import { vector } from "../server/vector"
import { PrmController, type Output } from "../server/prmController"
import {
  ApiKey,
  dailyAdjustedStockPricesFromStream,
  dailyAdjustedStockPricesRawStream,
  AscendingDates
} from "../alphavantage/DailyAdjusted"
import { dailyAdjustedStockPricesRawStreamFromCache, type CacheSettings } from "../alphavantage/DailyAdjustedCache"

const log = logger("cli/prm.js")

function mixedToString(a: mixed): string {
  if (typeof a === "string") {
    return (a: string)
  } else {
    throw new Error(`Cannot convert mixed to string`)
  }
}

function mixedToOptionalString(a: mixed): ?string {
  if (typeof a === "string") {
    return (a: string)
  } else {
    return null
  }
}

function mixedToStringWithDefault(a: mixed, defaultValue: string): string {
  const b: ?string = mixedToOptionalString(a)
  return null != b ? b : defaultValue
}

function stringToDateWithDefault(a: ?string, defaultValue: LocalDate): LocalDate {
  return null != a ? parseDate(a) : defaultValue
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
  .wrap(null)
  .help("help")
  .example(
    "$0 --stocks=IBM,MSFT --start-date=2020-01-01 --end-date=2020-03-01 " +
      "--delay-millis=0 --annual-risk-free-interest-rate=1.0 " +
      "--output-file=./output.json --api-key=<Alphavantage API key>"
  )
  .options({
    stocks: {
      description: "A comma-separated list of stock symbols.",
      requiresArg: true,
      demandOption: true,
      type: "string"
    },
    "start-date": {
      description: "Stock price history start date in the yyyy-MM-dd format.",
      requiresArg: true,
      demandOption: true,
      type: "string"
    },
    "end-date": {
      description: "Stock price history end date in the yyyy-MM-dd format.",
      requiresArg: true,
      demandOption: true,
      type: "string"
    },
    "api-key": {
      description: "Alphavantage API key.",
      requiresArg: true,
      demandOption: true,
      type: "string"
    },
    "delay-millis": {
      description: "Delay between stock price history requests, millis.",
      requiresArg: true,
      demandOption: true,
      type: "number"
    },
    "annual-risk-free-interest-rate": {
      description: "Annual risk free interest rate, %.",
      requiresArg: true,
      demandOption: true,
      type: "number"
    },
    "output-file": {
      description: "File where to write calculated portfolios.",
      requiresArg: true,
      demandOption: false,
      type: "string"
    },
    "cache-dir": {
      description: "Cache directory override.",
      requiresArg: true,
      demandOption: false,
      defaultDescription: "./.cache",
      type: "string"
    },
    "cache-date": {
      description: "Cache date override in the yyyy-MM-dd format.",
      requiresArg: true,
      demandOption: false,
      defaultDescription: "today",
      type: "string"
    }
  }).argv

const stocks: Array<string> = mixedToString(options["stocks"]).split(",")
const startDate: LocalDate = parseDate(mixedToString(options["start-date"]))
const endDate: LocalDate = parseDate(mixedToString(options["end-date"]))
const apiKey = new ApiKey(mixedToString(options["api-key"]))
const delayMillis: number = mixedToNumber(options["delay-millis"])
const annualRiskFreeInterestRate: number = mixedToNumber(options["annual-risk-free-interest-rate"])
const outputFile: ?string = mixedToOptionalString(options["output-file"])
const cacheDir: string = mixedToStringWithDefault(options["cache-dir"], "./.cache")
const cacheDate: LocalDate = stringToDateWithDefault(options["cache-date"], today())

log.info(`stocks: ${JSON.stringify(stocks)}`)
log.info(`delay-millis: ${delayMillis}`)
log.info(`annual-risk-free-interest-rate: ${annualRiskFreeInterestRate}%`)
if (null != outputFile) {
  log.info(`output-file: ${outputFile}`)
}

const dailyRiskFreeReturnRate: number = periodReturnRate(annualRiskFreeInterestRate / 100.0, 365)

log.info(`startDate: ${formatDate(startDate)}`)
log.info(`endDate: ${formatDate(endDate)}`)
log.info(`dailyRiskFreeReturnRate: ${dailyRiskFreeReturnRate}`)

const cache: CacheSettings = { directory: cacheDir, date: cacheDate }
log.info(`cache: ${JSON.stringify(cache)}`)

const controller = new PrmController((symbol: string, minDate: LocalDate, maxDate: LocalDate) => {
  const rawStream: stream.Readable = dailyAdjustedStockPricesRawStreamFromCache(cache, symbol, (x: string) =>
    dailyAdjustedStockPricesRawStream(apiKey, x)
  )
  return dailyAdjustedStockPricesFromStream(rawStream, minDate, maxDate, AscendingDates)
})

controller
  .analyzeUsingPortfolioHistoricalPrices(
    vector(stocks.length, stocks),
    startDate,
    endDate,
    dailyRiskFreeReturnRate,
    delayMillis
  )
  .then(
    (analysisResult) => {
      const output: Output = analysisResult[1]
      printResults(stocks, output)
      if (null != outputFile) {
        log.info(`writing output into file: ${outputFile}`)
        fs.writeFileSync(outputFile, JSON.stringify(output))
      }
    },
    (error) => log.error(error)
  )

function printResults(stocks: Array<string>, output: Output) {
  log.info(`stocks: ${JSON.stringify(stocks)}`)
  if (output.Calculated) {
    log.info(`globalMinVarianceEfficientPortfolio:\n${prettyPrint(output.globalMinVarianceEfficientPortfolio)}`)
    log.info(`tangencyPortfolio:\n${prettyPrint(output.tangencyPortfolio)}`)
    log.info(
      `min variance daily interest rate, %: ${output.globalMinVarianceEfficientPortfolio.expectedReturnRate * 100}`
    )
    log.info(`tangency daily interest rate, %: ${output.tangencyPortfolio.expectedReturnRate * 100}`)
  } else if (output.CannotCalculate) {
    log.warn(output.message)
  } else {
    log.error(`Expected Calculated output, got: ${JSON.stringify(output)}`)
  }
}
