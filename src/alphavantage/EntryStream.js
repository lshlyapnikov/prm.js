// @flow strict
import { parseDate, isValidDate } from "../server/utils"
import { logger } from "../server/utils"
import type { Result } from "../server/utils"
import { Transform } from "stream"

const log = logger("alphavantage/EntryStream.js")

export class Entry {
  constructor(timestamp: Date, adjustedClose: number) {
    this.timestamp = timestamp
    this.adjustedClose = adjustedClose
  }

  timestamp: Date
  adjustedClose: number
}

type Callback = (error: ?Error, entry: ?string) => void

export function entryStream(): EntryStream {
  return new EntryStream()
}

// TODO: report errors if `{ "Error Message": ".... " }` is in the response
class EntryStream extends Transform {
  // $FlowIgnore[unclear-type]
  constructor(options?: any) {
    super(options)
    this.count = 0
    this.line = ""
  }

  count: number
  line: string

  // eslint-disable-next-line no-unused-vars
  // $FlowIgnore[incompatible-extend]
  _transform(chunk: Buffer | string, encoding: string, callback: Callback): void {
    const data: string = typeof chunk === "string" ? chunk : chunk.toString()
    for (let i = 0; i < data.length; ++i) {
      const ch: string = data.charAt(i)
      if (ch == "\r") {
        continue
      } else if (ch == "\n") {
        const lineToPush: ?string = this.getLine()
        if (null != lineToPush) {
          this.push(lineToPush)
        }
      } else {
        this.line = this.line + ch
      }
    }

    callback(null, null)
  }

  // $FlowIgnore[incompatible-extend]
  _final(callback: Callback): void {
    callback(null, this.getLine())
  }

  getLine(): ?string {
    if (this.line.length == 0) {
      return null
    } else if (this.count == 0 && this.line.startsWith("timestamp,")) {
      this.line = ""
      this.count += 1
      return null
    } else {
      const tmp: string = this.line
      this.line = ""
      this.count += 1
      return tmp
    }
  }
}

export function parseEntry(line: string): Result<Entry> {
  log.debug(`parseEntry line:`, line)

  const fields: Array<string> = line.split(",")
  if (fields.length != 9) {
    return { success: false, error: new Error(`Cannot parse price entry from CSV line: ${line}`) }
  }

  const dateStr: string = fields[0] // timestamp
  const date: Date = parseDate(dateStr)
  if (!isValidDate(date)) {
    return { success: false, error: new Error(`Cannot parse date from '${dateStr}'. CSV line: ${line}`) }
  }

  const adjustedCloseStr: string = fields[5] // adjusted_close
  const adjustedClose: number = Number.parseFloat(adjustedCloseStr)
  if (Number.isNaN(adjustedClose)) {
    return {
      success: false,
      error: new Error(`Cannot parse adjusted close price from '${adjustedCloseStr}'. CSV line: ${line}`)
    }
  }

  return { success: true, value: new Entry(date, adjustedClose) }
}
