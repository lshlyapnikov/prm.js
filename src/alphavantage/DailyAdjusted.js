// @flow strict
import request from "request"
import { Observable, Subscriber, from, throwError } from "rxjs"
import { toArray, mergeMap } from "rxjs/operators"
import { type Result, formatDate } from "../server/utils"
import stream from "stream"
import { entryStream } from "./EntryStream"
import { type Entry, parseEntry } from "./Entry"

type DateOrder = "AscendingDates" | "DescendingDates"

export const AscendingDates = "AscendingDates"
export const DescendingDates = "DescendingDates"

export class ApiKey {
  constructor(value: string) {
    this.value = value
  }
  value: string
}

export function dailyAdjustedStockPricesRawStream(apiKey: ApiKey, symbol: string): stream.Readable {
  const url: string = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${apiKey.value}&datatype=csv&outputsize=full`
  return request(url)
}

export function dailyAdjustedStockPricesFromStream(
  input: stream.Readable,
  minDate: Date,
  maxDate: Date,
  dateOrder: DateOrder
): Observable<number> {
  const observable: Observable<number> = dailyAdjustedStockPricesFromStreamWithDescendingDates(input, minDate, maxDate)
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
  input: stream.Readable,
  minDate: Date,
  maxDate: Date
): Observable<number> {
  if (maxDate < minDate) {
    return throwError(`Invalid date range: [${formatDate(minDate)}, ${formatDate(maxDate)}]`)
  }
  return Observable.create((observer: Subscriber<number>) => {
    input
      .pipe(entryStream(true))
      .on("error", (error: Error) => observer.error(error.message))
      .on("data", (line: string) => {
        const result: Result<Entry> = parseEntry(line)
        if (result.success) {
          const entry: Entry = result.value
          if (minDate <= entry.date && entry.date <= maxDate) {
            observer.next(entry.adjustedClose)
          } else if (entry.date > minDate) {
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
