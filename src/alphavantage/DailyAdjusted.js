// @flow strict
import request from "request"
import { Observable, Subscriber, from, throwError } from "rxjs"
import { toArray, mergeMap } from "rxjs/operators"
import { formatDate } from "../server/utils"
import type { Result } from "../server/utils"
import stream from "stream"
import { entryStream, Entry, parseEntry } from "./EntryStream"

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

  const rawStream: stream.Readable = request(url).pipe(entryStream())
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
  if (maxDate < minDate) {
    return throwError(`Invalid date range: [${formatDate(minDate)}, ${formatDate(maxDate)}]`)
  }
  return Observable.create((observer: Subscriber<number>) => {
    stream
      .on("error", (error: Error) => observer.error(error.message))
      .on("data", (line: string | Buffer) => {
        const result: Result<Entry> = parseEntry(line.toString())
        if (result.success) {
          const entry: Entry = result.value
          if (minDate <= entry.timestamp && entry.timestamp <= maxDate) {
            observer.next(entry.adjustedClose)
          } else if (entry.timestamp > minDate) {
            // skip it
          } else {
            observer.complete()
          }
        } else {
          observer.error(result.error.message)
        }
      })
      .on("end", () => {
        observer.complete()
      })
  })
}
