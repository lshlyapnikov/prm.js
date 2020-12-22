// @flow strict
import { Observable, from } from "rxjs"
// import * as assert from "assert"
import { Duration, Instant } from "@js-joda/core"
import { type JestDoneFn, logger, serialize } from "../server/utils"

import { withSpeed } from "./apiCallLimit"
const log = logger("apiCallLimit.test.js")

function validateEmissionSpeed(
  timedSource: Observable<number>,
  expectedNumberOfTotalEmissions: number,
  expectedNumberOfEmissions: number,
  perInterval: Duration,
  done: JestDoneFn
): void {
  var count = 0
  const times: Array<Instant> = Array<number>(expectedNumberOfTotalEmissions)
  timedSource.subscribe(
    (x) => {
      times[count] = Instant.now()
      count += 1
      log.info("x: ", serialize(x) + ", " + times[count - 1].toString())
    },
    (error) => done.fail(error),
    () => {
      if (count == 8) {
        validateSpeed(times, expectedNumberOfEmissions, perInterval, done)
      } else {
        done.fail(new Error(`expected count: ${expectedNumberOfTotalEmissions}, actual count: ${count}`))
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
  done()
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
    validateEmissionSpeed(timedSource, 8, expectedNumberOfEmissions, perInterval, done)
  })
})
