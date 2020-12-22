// @flow strict
import { Observable, interval, zip } from "rxjs"
import { bufferCount, map, mergeAll } from "rxjs/operators"
import { Duration } from "@js-joda/core"

export function withSpeed<A>(source: Observable<A>, numberOfEmissions: number, perInterval: Duration): Observable<A> {
  const bufferedSource: Observable<Array<A>> = source.pipe(bufferCount(numberOfEmissions))
  const ticks: Observable<number> = interval(perInterval.toMillis())
  const timedSource: Observable<A> = zip(bufferedSource, ticks).pipe(
    map((tuple) => tuple[0]),
    mergeAll(1)
  )
  return timedSource
}
