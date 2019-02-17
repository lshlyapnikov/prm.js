// @flow
import csv from "csv-parser"
import fs from "fs"
import request from "request"
import { Observable, Subscriber } from "rxjs"
import stream from "stream"
import utils from "../server/utils.js"

const log = utils.logger("DailyAdjusted")

export function dailyAdjustedStockPrices(apiKey: string, symbol: string,
  fromDate: Date, toDate: Date): Observable<number> {
  const url: string =
    `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${apiKey}&datatype=csv&outputsize=full`
  const stream: stream.Readable = request(url).pipe(csv())
  return dailyAdjustedStockPricesFromStream(stream, fromDate, toDate)
}

export function dailyAdjustedStockPricesFromStream(stream: stream.Readable, fromDate: Date,
  toDate: Date): Observable<number> {
  return Observable.create((observer: Subscriber<number>) => {
    stream
      .on('error', error => observer.error(error))
      .on('data', (data) => {
        const dateStr: string = data["timestamp"]
        const date = new Date(dateStr)
        if (Number.isNaN(date.getTime())) {
          observer.error(`Cannot parse date from '${dateStr}'. CSV line: ${JSON.stringify(data)}`)
          return
        }
        const adjustedCloseStr: string = data["adjusted_close"]
        const adjustedClose: number = Number.parseFloat(adjustedCloseStr)
        if (Number.isNaN(adjustedClose)) {
          observer.error(`Cannot parse adjusted close price from '${adjustedCloseStr}'. CSV line: ${JSON.stringify(data)}`)
          return
        }
        if (fromDate <= date && date <= toDate) {
          observer.next(adjustedClose)
        } else if (date > fromDate) {
          // skip it
        } else {
          observer.complete()
        }
      })
      .on('end', () => {
        observer.complete()
      })
  })
}
