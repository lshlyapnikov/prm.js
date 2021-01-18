// @flow strict
import fs from "fs"
import stream from "stream"
import { LocalDate } from "@js-joda/core"
import { logger, formatDate, serialize } from "../server/utils"
import { fnToPromise } from "../server/result"

const log = logger("alphavantage/DailyAdjustedCache.js")

export type CacheSettings = {| directory: string, date: LocalDate |}

export function dailyAdjustedStockPricesRawStreamFromCache(
  cache: CacheSettings,
  symbol: string,
  loadFn: (string) => Promise<stream.Readable>
): Promise<stream.Readable> {
  log.info(`loading symbol: ${symbol}`)
  const file = symbolCacheFileName(cache.directory, cache.date, symbol)
  return fs.promises.stat(file).then(
    (stat: fs.Stats) => {
      if (stat.isFile()) {
        log.info(`symbol cache found: ${file}`)
        return fnToPromise(() => fs.createReadStream(file))
      } else {
        return Promise.reject(
          Error(`Cannot load symbol: ${symbol}, file or directory already exist, stat: ${serialize(stat)}`)
        )
      }
    },
    () => {
      log.info(`symbol cache not found: ${file}`)
      return mkDirIfDoesNotExist(cache.directory).then(() =>
        loadFn(symbol).then((readable: stream.Readable) => {
          readable.pipe(fs.createWriteStream(file))
          const passThrough = new stream.PassThrough()
          readable.pipe(passThrough)
          return passThrough
        })
      )
    }
  )
}

function mkDirIfDoesNotExist(path: string): Promise<void> {
  return fs.promises.stat(path).then(
    (stat: fs.Stats) => {
      if (stat.isDirectory()) {
        return Promise.resolve()
      } else {
        return Promise.reject(new Error(`Cannot create directory: ${path}`))
      }
    },
    () => fs.promises.mkdir(path)
  )
}

export function removeSymbolCache(cache: CacheSettings, symbol: string): Promise<void> {
  const file = symbolCacheFileName(cache.directory, cache.date, symbol)
  return fs.promises.stat(file).then((stat: fs.Stats) => {
    if (stat.isFile()) {
      log.info(`removing symbol cache: ${file}`)
      return fs.promises.unlink(file)
    } else {
      return Promise.reject(new Error(`Cannot removing symbol cache: ${file}`))
    }
  })
}

function symbolCacheFileName(directory: string, date: LocalDate, symbol: string): string {
  return `${directory}/${symbol}-${formatDate(date)}.csv`
}
