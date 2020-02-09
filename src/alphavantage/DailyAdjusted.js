// @flow strict
import csv from "csv-parser"
import request from "request"
import { Observable, Subscriber, from } from "rxjs"
import { toArray, mergeMap } from "rxjs/operators"
import { endOfDay } from "date-fns"
import stream from "stream"

type DateOrder = "AscendingDates" | "DescendingDates"

export const AscendingDates = "AscendingDates"
export const DescendingDates = "DescendingDates"

export function dailyAdjustedStockPrices(
  apiKey: string,
  symbol: string,
  minDate: Date,
  maxDate: Date,
  dateOrder: DateOrder
): Observable<number> {
  const url: string = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${apiKey}&datatype=csv&outputsize=full`
  const rawStream: stream.Readable = request(url).pipe(csv())
  return dailyAdjustedStockPricesFromStream(rawStream, minDate, maxDate, dateOrder)
}

export function dailyAdjustedStockPricesFromStream(
  stream: stream.Readable,
  minDate: Date,
  maxDate: Date,
  dateOrder: DateOrder
): Observable<number> {
  const observable: Observable<number> = dailyAdjustedStockPricesFromStreamWithDescendingDates(stream, minDate, maxDate)
  if (dateOrder == DescendingDates) return observable
  else return reverseObservable(observable)
}

function reverseObservable<T>(o: Observable<T>): Observable<T> {
  return o.pipe(
    toArray(),
    mergeMap((arr: Array<T>) => from(arr.reverse()))
  )
}

function dailyAdjustedStockPricesFromStreamWithDescendingDates(
  stream: stream.Readable,
  minDate: Date,
  maxDate: Date
): Observable<number> {
  return Observable.create((observer: Subscriber<number>) => {
    stream
      .on("error", (error: Error) => observer.error(error))
      .on("data", (data: { [string]: string }) => {
        const dateStr: string = data["timestamp"]
        const date: Date = endOfDay(new Date(dateStr))
        if (Number.isNaN(date.getTime())) {
          observer.error(`Cannot parse date from '${dateStr}'. CSV line: ${JSON.stringify(data)}`)
          return
        }
        const adjustedCloseStr: string = data["adjusted_close"]
        const adjustedClose: number = Number.parseFloat(adjustedCloseStr)
        if (Number.isNaN(adjustedClose)) {
          observer.error(
            `Cannot parse adjusted close price from '${adjustedCloseStr}'. CSV line: ${JSON.stringify(data)}`
          )
          return
        }
        if (minDate <= date && date <= maxDate) {
          observer.next(adjustedClose)
        } else if (date > minDate) {
          // skip it
        } else {
          observer.complete()
        }
      })
      .on("end", () => {
        observer.complete()
      })
  })
}
