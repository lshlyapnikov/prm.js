// @flow strict
import { type Result, logger, parseDate, isValidDate } from "../server/utils"

const log = logger("alphavantage/EntryStream.js")

export type Entry = {|
  date: Date,
  adjustedClose: number
|}

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

  return { success: true, value: { date, adjustedClose } }
}
