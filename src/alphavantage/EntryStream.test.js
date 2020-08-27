// @flow strict
import { Readable } from "stream"
import { entryStream } from "./EntryStream"

type JestDoneFn = {|
  (): void,
  fail: (error: Error) => void
|}

function entryStreamTest(readable: Readable, expected: Array<string>, done: JestDoneFn) {
  const lines: Array<string> = []
  readable.on("data", (line: string) => {
    lines.push(line)
  })
  readable.on("error", (error) => {
    done.fail(error)
  })
  readable.on("finish", () => {
    const actualStr: string = JSON.stringify(lines)
    const expectedStr: string = JSON.stringify(expected)
    if (actualStr == expectedStr) {
      done()
    } else {
      done.fail(new Error(`actual: ${actualStr} is not equal to expected: ${expectedStr}`))
    }
  })
}

describe("EntryStream", () => {
  test("should return all lines", (done) => {
    async function* generate() {
      yield "1\r\n"
      yield "2\r"
      yield "3\n4\r5\r\n6\n7\n"
      yield "8\n9\n"
    }
    const expected: Array<string> = ["1", "23", "45", "6", "7", "8", "9"]

    // $FlowIgnore[prop-missing]
    entryStreamTest(Readable.from(generate()).pipe(entryStream(false)), expected, done)
  })
  test("should return all lines including the last one if it does not end with <new-line> char", (done) => {
    async function* generate() {
      yield "1\r\n"
      yield "2\r"
      yield "3\n4\r5\r\n6\n7\n"
      yield "8\n9"
    }
    const expected: Array<string> = ["1", "23", "45", "6", "7", "8", "9"]

    // $FlowIgnore[prop-missing]
    entryStreamTest(Readable.from(generate()).pipe(entryStream(false)), expected, done)
  })
  test("should return all lines except the header when skipHeader = true", (done) => {
    async function* generate() {
      yield "header line\n"
      yield "1\n"
      yield "2\n"
    }
    const expected: Array<string> = ["1", "2"]

    // $FlowIgnore[prop-missing]
    entryStreamTest(Readable.from(generate()).pipe(entryStream(true)), expected, done)
  })

  //TODO test error is reported
})
