// @flow strict
import * as yargs from "yargs"
import fs from "fs"
import stream from "stream"
import { LocalDate } from "@js-joda/core"
import {
  type Result,
  logger,
  formatDate,
  parseDate,
  today,
  periodReturnRate,
  serialize,
  toFixedNumber
} from "../server/utils"
import { type Vector, vector } from "../server/vector"
import { type Calculated, type Simulated, PrmController } from "../server/prmController"
import { PortfolioStats } from "../server/portfolioStats"
import {
  ApiKey,
  dailyAdjustedStockPricesFromStream,
  dailyAdjustedStockPricesRawStream,
  AscendingDates
} from "../alphavantage/DailyAdjusted"
import { throwError } from "rxjs"
import { catchError } from "rxjs/operators"
import {
  type CacheSettings,
  dailyAdjustedStockPricesRawStreamFromCache,
  removeSymbolCache
} from "../alphavantage/DailyAdjustedCache"

const log = logger("cli/prm.js")

const SCALE: number = 5

type OutputContent = {|
  calculated: ?Result<Calculated>,
  simulated: ?Result<Simulated>
|}

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
function stringToDate(a: ?string): LocalDate {
  if (null != a) {
    return parseDate(a)
  } else {
    throw new Error(`Cannot convert string to date`)
  }
}

function mixedToNumber(a: mixed): number {
  if (typeof a === "number") {
    return (a: number)
  } else {
    throw new Error(`Cannot convert mixed to number`)
  }
}

function mixedToBoolean(a: mixed): boolean {
  if (typeof a === "boolean") {
    return (a: boolean)
  } else {
    throw new Error(`Cannot convert mixed to boolean`)
  }
}

function printResults<N: number>(
  stocks: Vector<N, string>,
  calculatedR: ?Result<Calculated>,
  simulatedR: ?Result<Simulated>
) {
  var output: string = "Results\n"
  const rows: Array<$ReadOnlyArray<string>> = []
  rows.push([""].concat(stocks.values))

  if (null != calculatedR) {
    if (calculatedR.success) {
      const calculated: Calculated = calculatedR.value
      output += formatStats(
        "P1: Calculated Global Min Variance Efficient Portfolio with Short Sales",
        calculated.globalMinVarianceEfficientPortfolio
      )
      rows.push(formatWeights(stocks.n, "P1", calculated.globalMinVarianceEfficientPortfolio))
      output += formatStats("P2: Calculated Tangency Portfolio with Short Sales", calculated.tangencyPortfolio)
      rows.push(formatWeights(stocks.n, "P2", calculated.tangencyPortfolio))
    } else {
      log.error(calculatedR.error)
    }
  }
  if (null != simulatedR) {
    if (simulatedR.success) {
      const simulated: Simulated = simulatedR.value
      const suffix = simulated.allowShortSales ? "with Short Sales" : "without Short Sales"
      output += formatStats(
        "P3: Simulated Global Min Variance Efficient Porfolio " + suffix,
        simulated.globalMinVarianceEfficientPortfolio
      )
      rows.push(formatWeights(stocks.n, "P3", simulated.globalMinVarianceEfficientPortfolio))
    } else {
      log.error(simulatedR.error)
    }
  }

  const maxLengthVal = maxStrLength2(rows)

  rows.forEach((row) => {
    row.forEach((x) => {
      output += x.padEnd(maxLengthVal + 1, " ")
    })
    output += "\n"
  })

  log.info(output)
}

function maxStrLength2(arr: $ReadOnlyArray<$ReadOnlyArray<string>>): number {
  return arr.map((x) => maxStrLength(x)).reduce((z, a) => Math.max(z, a))
}

function maxStrLength(arr: $ReadOnlyArray<string>): number {
  const xs: $ReadOnlyArray<number> = arr.map((a) => a.length)
  return xs.reduce((z, a) => Math.max(z, a))
}

function formatStats(title: string, p: PortfolioStats): string {
  var output: string = title + "\n"
  output += "- Expected Daily Return Rate, %: " + serialize(toFixedNumber(p.expectedReturnRate * 100, SCALE)) + "\n"
  output += "- Risk (stdDev): " + serialize(toFixedNumber(p.stdDev, SCALE)) + "\n"
  return output
}

function formatWeights<N: number>(n: N, legend: string, p: PortfolioStats): $ReadOnlyArray<string> {
  if (n != p.weights.length) {
    throw new Error(`Invalid number of weights: ${p.weights.length}, expected: ${n}`)
  }
  return [legend].concat(p.weights.map((x) => serialize(toFixedNumber(x, SCALE))))
}

// log.info(`args: ${serialize(process.argv)}`)

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
    "number-of-simulations": {
      description: "The number of random weight simulations",
      requiresArg: true,
      demandOption: false,
      default: 1000,
      type: "number"
    },
    "simulations-seed": {
      description: "Seed to use for random weights generation",
      requiresArg: true,
      demandOption: false,
      default: 0,
      type: "number"
    },
    "allow-short-sale-simulations": {
      description: "Enable short sale simulations",
      requiresArg: true,
      demandOption: false,
      default: false,
      type: "boolean"
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
      default: "./.cache",
      type: "string"
    },
    "cache-date": {
      description: "Cache date override in the yyyy-MM-dd format.",
      requiresArg: true,
      demandOption: false,
      default: formatDate(today()),
      type: "string"
    }
  }).argv

const stocks: Array<string> = mixedToString(options["stocks"]).split(",")
const startDate: LocalDate = parseDate(mixedToString(options["start-date"]))
const endDate: LocalDate = parseDate(mixedToString(options["end-date"]))
const apiKey = new ApiKey(mixedToString(options["api-key"]))
const delayMillis: number = mixedToNumber(options["delay-millis"])
const annualRiskFreeInterestRate: number = mixedToNumber(options["annual-risk-free-interest-rate"])
const numberOfSimulations: number = mixedToNumber(options["number-of-simulations"])
const simulationsSeed: number = mixedToNumber(options["simulations-seed"])
const allowShortSaleSimulations: boolean = mixedToBoolean(options["allow-short-sale-simulations"])
const outputFile: ?string = mixedToOptionalString(options["output-file"])
const cacheDir: string = mixedToString(options["cache-dir"])
const cacheDate: LocalDate = stringToDate(options["cache-date"])
const dailyRiskFreeReturnRate: number = periodReturnRate(annualRiskFreeInterestRate / 100.0, 365)
const cache: CacheSettings = { directory: cacheDir, date: cacheDate }

log.info(`stocks: ${serialize(stocks)}`)
log.info(`delay-millis: ${delayMillis}`)
log.info(`annual-risk-free-interest-rate: ${annualRiskFreeInterestRate}%`)
log.info(`number-of-simulations: ${numberOfSimulations}`)
log.info(`simulations-seed: ${simulationsSeed}`)
log.info(`allow-short-sale-simulations: ${serialize(allowShortSaleSimulations)}`)
if (null != outputFile) {
  log.info(`output-file: ${outputFile}`)
} else {
  log.info(`output-file: <is not configured>`)
}
log.info(`startDate: ${formatDate(startDate)}`)
log.info(`endDate: ${formatDate(endDate)}`)
log.info(`dailyRiskFreeReturnRate: ${dailyRiskFreeReturnRate}`)
log.info(`cache: ${serialize(cache)}`)

const controller = new PrmController((symbol: string, minDate: LocalDate, maxDate: LocalDate) => {
  const rawStream: stream.Readable = dailyAdjustedStockPricesRawStreamFromCache(cache, symbol, (x: string) =>
    dailyAdjustedStockPricesRawStream(apiKey, x)
  )
  return dailyAdjustedStockPricesFromStream(rawStream, minDate, maxDate, AscendingDates).pipe(
    catchError((error) => {
      log.error(`Error while loading prices for symbol: ${symbol}. Cause:`, error)
      removeSymbolCache(cache, symbol)
      return throwError(new Error(`Cannot load prices for symbol: ${symbol}. Cause: ${error.message.toString()}`))
    })
  )
})

const stocksVec = vector(stocks.length, stocks)
const rrStatsP = controller.returnRateStats(stocksVec, startDate, endDate, delayMillis)

const calculatedP: Promise<Result<Calculated>> = rrStatsP.then((rrStats) =>
  controller.calculate(rrStats, dailyRiskFreeReturnRate)
)

const simulatedP: Promise<?Result<Simulated>> =
  numberOfSimulations == 0
    ? Promise.resolve(null)
    : rrStatsP.then((rrStats) =>
        controller.simulate(rrStats, numberOfSimulations, simulationsSeed, allowShortSaleSimulations)
      )

Promise.all([calculatedP, simulatedP]).then(
  (arr) => {
    const calculated: Result<Calculated> = arr[0]
    const simulated: ?Result<Simulated> = arr[1]
    printResults(stocksVec, calculated, simulated)
    if (null != outputFile) {
      log.info(`writing output into file: ${outputFile} ...`)
      const outputContent: OutputContent = { calculated, simulated }
      fs.writeFileSync(outputFile, serialize(outputContent, 2))
    }
    log.info(`done.`)
  },
  (error) => log.error(error)
)
