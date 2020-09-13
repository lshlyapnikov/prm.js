// @flow strict
import fs from "fs"
import stream from "stream"
import { logger, formatDate } from "../server/utils"

const log = logger("alphavantage/DailyAdjustedCache.js")

export type CacheSettings = { directory: string, date: Date }

export function dailyAdjustedStockPricesRawStreamFromCache(
  cache: CacheSettings,
  apiKey: string,
  symbol: string,
  loadFn: (string, string) => stream.Readable
): stream.Readable {
  log.info(`loading symbol: ${symbol}`)
  const file = symbolCacheFileName(cache.directory, cache.date, symbol)
  if (fs.existsSync(file)) {
    log.info(`symbol cache found: ${file}`)
    return fs.createReadStream(file)
  } else {
    log.info(`symbol cache not found: ${file}`)
    if (!fs.existsSync(cache.directory)) {
      fs.mkdirSync(cache.directory, { recursive: true })
    }
    const rawStream = loadFn(apiKey, symbol)
    rawStream.pipe(fs.createWriteStream(file))
    const passThrough = new stream.PassThrough()
    rawStream.pipe(passThrough)
    return passThrough
  }
}

function symbolCacheFileName(directory: string, date: Date, symbol: string): string {
  return `${directory}/${symbol}-${formatDate(date)}.csv`
}
