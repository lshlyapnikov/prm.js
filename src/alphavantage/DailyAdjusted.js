// @flow strict
import request from "request"
import { Observable, Subscriber, from, throwError } from "rxjs"
import { toArray, mergeMap } from "rxjs/operators"
import { LocalDate } from "@js-joda/core"
import { formatDate } from "../server/utils"
import { type Result } from "../server/result"
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
  minDate: LocalDate,
  maxDate: LocalDate,
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
  minDate: LocalDate,
  maxDate: LocalDate
): Observable<number> {
  if (maxDate.compareTo(minDate) < 0) {
    return throwError(`Invalid date range: [${formatDate(minDate)}, ${formatDate(maxDate)}]`)
  }
  return Observable.create((observer: Subscriber<number>) => {
    input
      .pipe(entryStream(true))
      .on("error", (error: Error) => observer.error(error))
      .on("data", (line: string) => {
        const result: Result<Entry> = parseEntry(line)
        if (result.success) {
          const entry: Entry = result.value
          if (minDate.compareTo(entry.date) <= 0 && entry.date.compareTo(maxDate) <= 0) {
            observer.next(entry.adjustedClose)
          } else if (entry.date.compareTo(minDate) > 0) {
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
