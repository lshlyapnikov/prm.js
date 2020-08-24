// @flow strict
import * as yargs from "yargs"
import fs from "fs"
import es from "event-stream"
import { Observable, Subscriber } from "rxjs"
import { prettyPrint } from "numeric"
import { logger, formatDate, parseDate, periodReturnRate } from "../server/utils"
import { PrmController, Input, Output } from "../server/prmController"
import { dailyAdjustedStockPrices, AscendingDates } from "../alphavantage/DailyAdjusted"

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

function mixedToNumber(a: mixed): number {
  if (typeof a === "number") {
    return (a: number)
  } else {
    throw new Error(`Cannot convert mixed to number`)
  }
}

function readPrices(file: string): Observable<number> {
  return Observable.create((subscriber: Subscriber<number>) => {
    fs.createReadStream(file)
      .pipe(es.split())
      .on("data", (line: string) => {
        if (line.length > 0) {
          subscriber.next(Number.parseFloat(line))
        }
      })
      .on("error", (err) => {
        subscriber.error(`Error while reading file: ${JSON.stringify(err)}`)
      })
      .on("end", () => {
        subscriber.complete()
      })
  })
}

function loadDailyAdjustedStockPrices(
  cacheDir: string,
  apiKey: string,
  symbol: string,
  minDate: Date,
  maxDate: Date
): Observable<number> {
  log.info(`loading symbol: ${symbol}`)
  let file = `${cacheDir}/${symbol}-${formatDate(minDate)}-${formatDate(maxDate)}.txt`
  if (fs.existsSync(file)) {
    log.info(`Symbol cache found: ${file}`)
    return readPrices(file)
  } else {
    log.info(`Symbol cache not found: ${file}`)
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true })
    }
    let ws = fs.createWriteStream(file, { flags: "w" })
    return Observable.create((subscriber: Subscriber<number>) => {
      ws.on("error", (error) => subscriber.error(error))
      dailyAdjustedStockPrices(apiKey, symbol, minDate, maxDate, AscendingDates).subscribe(
        (num: number) => {
          ws.write(String(num))
          ws.write("\n")
          subscriber.next(num)
        },
        (error) => subscriber.error(error),
        () => {
          ws.close()
          subscriber.complete()
        }
      )
    })
  }
}

// log.info(`args: ${JSON.stringify(process.argv)}`)

const options = yargs
  .usage("$0 [options]")
  .help("help")
  .example(
    "$0 --stocks=IBM,MSFT --start-date=2020-01-01 --end-date=2020-03-01 " +
      "--delay-millis=0 --annual-risk-free-interest-rate=1.0 " +
      "--output-file=./output.json --api-key=<Alphavantage API key>"
  )
  .options({
    stocks: {
      description: "A comma-separated list of stock symbols",
      requiresArg: true,
      demandOption: true,
      type: "string"
    },
    "start-date": {
      description: "Stock price history start date in the YYYY-MM-dd format",
      requiresArg: true,
      demandOption: true,
      type: "string"
    },
    "end-date": {
      description: "Stock price history end date in the YYYY-MM-dd format",
      requiresArg: true,
      demandOption: true,
      type: "string"
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
    "annual-risk-free-interest-rate": {
      description: "Annual risk free interest rate, %",
      requiresArg: true,
      demandOption: true,
      type: "number"
    },
    "output-file": {
      description: "File where to write calculated portfolios",
      requiresArg: true,
      demandOption: false,
      type: "string"
    }
  }).argv

const stocks: Array<string> = mixedToString(options["stocks"]).split(",")
const startDate: Date = parseDate(mixedToString(options["start-date"]))
const endDate: Date = parseDate(mixedToString(options["end-date"]))
const apiKey: string = mixedToString(options["api-key"])
const delayMillis: number = mixedToNumber(options["delay-millis"])
const annualRiskFreeInterestRate: number = mixedToNumber(options["annual-risk-free-interest-rate"])
const outputFile: ?string = mixedToOptionalString(options["output-file"])

log.info(`stocks: ${JSON.stringify(stocks)}`)
log.info(`api-key: ${apiKey}`)
log.info(`delay-millis: ${delayMillis}`)
log.info(`annual-risk-free-interest-rate: ${annualRiskFreeInterestRate}%`)
if (null != outputFile) {
  log.info(`output-file: ${outputFile}`)
}

const dailyRiskFreeReturnRate: number = periodReturnRate(annualRiskFreeInterestRate / 100.0, 365)

log.info(`startDate: ${formatDate(startDate)}`)
log.info(`endDate: ${formatDate(endDate)}`)
log.info(`dailyRiskFreeReturnRate: ${dailyRiskFreeReturnRate}`)

const controller = new PrmController((symbol: string, minDate: Date, maxDate: Date) => {
  return loadDailyAdjustedStockPrices("./.cache", apiKey, symbol, minDate, maxDate)
})

controller.analyzeUsingPortfolioHistoricalPrices(stocks, startDate, endDate, dailyRiskFreeReturnRate, delayMillis).then(
  (analysisResult: [Input, Output]) => {
    const output: Output = analysisResult[1]
    log.info(`stocks: ${JSON.stringify(stocks)}`)
    log.info(`tangencyPortfolio:\n${prettyPrint(output.tangencyPortfolio)}`)
    log.info(`globalMinVarianceEfficientPortfolio:\n${prettyPrint(output.globalMinVarianceEfficientPortfolio)}`)
    log.info(`tangency daily interest rate, %: ${output.tangencyPortfolio.expectedReturnRate * 100}`)
    log.info(
      `min variance daily interest rate, %: ${output.globalMinVarianceEfficientPortfolio.expectedReturnRate * 100}`
    )
    if (null != outputFile) {
      log.info(`writing output into file: ${outputFile}`)
      fs.writeFileSync(outputFile, JSON.stringify(output))
    }
  },
  (error) => log.error(error)
)
