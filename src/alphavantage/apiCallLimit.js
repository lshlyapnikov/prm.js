// @flow strict
import { Observable, interval, zip } from "rxjs"
import { bufferCount, map, mergeAll } from "rxjs/operators"
import { Duration } from "@js-joda/core"
import { serialize } from "../server/utils"
import {
  type Result,
  failure,
  success,
  resultFromTryCatch,
  applyResult,
  resultToPromiseWithDelay
} from "../server/result"

type Speed = {| +numberOfCalls: number, +perInterval: Duration |}

export function withSpeed<A>(source: Observable<A>, numberOfEmissions: number, perInterval: Duration): Observable<A> {
  const bufferedSource: Observable<Array<A>> = source.pipe(bufferCount(numberOfEmissions))
  const ticks: Observable<number> = interval(perInterval.toMillis())
  const timedSource: Observable<A> = zip(bufferedSource, ticks).pipe(
    map((tuple) => tuple[0]),
    mergeAll(1)
  )
  return timedSource
}

export function callFnWithSpeedLimit<A>(fn: () => A, limit: Speed, current: Speed): Promise<[A, Speed]> {
  const e = applyResult((a, b) => [a, b], validateSpeed(limit), validateSpeed(current))
  if (!e.success) {
    return Promise.reject(e.error)
  }

  const [sleepMillis, numberOfCalls] =
    current.numberOfCalls < limit.numberOfCalls ? [0, current.numberOfCalls + 1] : [limit.perInterval.toMillis(), 1]

  const fa: Promise<A> = resultToPromiseWithDelay(() => resultFromTryCatch(fn), sleepMillis)
  return fa.then((a: A) => [a, { numberOfCalls, perInterval: limit.perInterval }])
}

function validateSpeed(speed: Speed): Result<Speed> {
  if (speed.numberOfCalls <= 0) {
    return failure(`Invalid Speed.numberOfCalls: ${serialize(speed)}`)
  }
  if (speed.perInterval.toMillis() <= 0) {
    return failure(`Invalid Speed.perInterval: ${serialize(speed)}`)
  }
  return success(speed)
}
