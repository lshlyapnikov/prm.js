// @flow strict
import { Observable, from } from "rxjs"
import * as assert from "assert"
import { Duration, Instant } from "@js-joda/core"
import { type JestDoneFn, logger, serialize } from "../server/utils"

import { withSpeed } from "./apiCallLimit"
const log = logger("apiCallLimit.test.js")

function validateEmissionSpeed(
  timedSource: Observable<number>,
  expectedNumberOfTotalEmissions: number,
  expectedSumOfElements: number,
  expectedNumberOfEmissions: number,
  perInterval: Duration,
  done: JestDoneFn
): void {
  var count = 0
  var sum = 0
  const times: Array<Instant> = Array<number>(expectedNumberOfTotalEmissions)
  timedSource.subscribe(
    (x) => {
      const current: Instant = Instant.now()
      times[count] = current
      count += 1
      sum += x
      log.info(`x: ${serialize(x)}, ${current.toString()}`)
    },
    (error) => done.fail(error),
    () => {
      if (count == expectedNumberOfTotalEmissions && sum == expectedSumOfElements) {
        validateSpeed(times, expectedNumberOfEmissions, perInterval, done)
      } else {
        done.fail(
          new Error(
            `expected count: ${expectedNumberOfTotalEmissions}, actual count: ${count}, ` +
              `expected sum: ${expectedSumOfElements}, actual sum: ${sum}`
          )
        )
      }
    }
  )
}

function validateSpeed(
  times: $ReadOnlyArray<Instant>,
  expectedNumberOfEmissions: number,
  perInterval: Duration,
  done: JestDoneFn
): void {
  const timeWindows: $ReadOnlyArray<$ReadOnlyArray<Instant>> = arrayOfWindows(times, expectedNumberOfEmissions)
  log.debug("timeWindows: ", serialize(timeWindows))
  for (let i = 0; i < timeWindows.length; i++) {
    const window: $ReadOnlyArray<Instant> = timeWindows[i]
    assert.ok(window.length <= expectedNumberOfEmissions)
    const first: Instant = window[0]
    const last: Instant = window[window.length - 1]
    const diff: number = last.toEpochMilli() - first.toEpochMilli()
    if (diff > perInterval.toMillis()) {
      done.fail(Error(`window: ${serialize(window)}, i: ${i}, diff: ${diff} millis`))
    }
  }

  done()
}

function arrayOfWindows<A>(xs: $ReadOnlyArray<A>, windowSize: number): Array<Array<A>> {
  const result = Array<Array<A>>()
  for (let i = 0; i < xs.length; i++) {
    if (i % windowSize == 0) {
      const arr = Array<A>()
      result.push(arr)
      arr.push(xs[i])
    } else {
      const j: number = Math.floor(i / windowSize)
      const arr: Array<A> = result[j]
      arr.push(xs[i])
    }
  }
  return result
}

describe("apiCallLimit#withSpeed", () => {
  it("does 3 calls per second", (done) => {
    const expectedNumberOfEmissions = 3
    const perInterval = Duration.ofSeconds(1)
    const timedSource: Observable<number> = withSpeed(
      from([1, 2, 3, 4, 5, 6, 7, 8]),
      expectedNumberOfEmissions,
      perInterval
    )
    validateEmissionSpeed(timedSource, 8, 36, expectedNumberOfEmissions, perInterval, done)
  })

  it("does 1 calls per 100 millis", (done) => {
    const expectedNumberOfEmissions = 1
    const perInterval = Duration.ofMillis(100)
    const timedSource: Observable<number> = withSpeed(
      from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
      expectedNumberOfEmissions,
      perInterval
    )
    validateEmissionSpeed(timedSource, 11, 66, expectedNumberOfEmissions, perInterval, done)
  })
})
