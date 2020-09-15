// @flow strict
import { type Result, logger, parseDateSafe } from "../server/utils"
import { LocalDate } from "@js-joda/core"

const log = logger("alphavantage/EntryStream.js")

export type Entry = {|
  date: LocalDate,
  adjustedClose: number
|}

export function parseEntry(line: string): Result<Entry> {
  log.debug(`parseEntry line:`, line)

  const fields: Array<string> = line.split(",")
  if (fields.length != 9) {
    return { success: false, error: new Error(`Cannot parse price entry from CSV line: ${line}`) }
  }

  const dateStr: string = fields[0] // timestamp
  const dateR = parseDateSafe(dateStr)

  if (dateR.success) {
    const adjustedCloseStr: string = fields[5] // adjusted_close
    const adjustedClose: number = Number.parseFloat(adjustedCloseStr)
    if (Number.isNaN(adjustedClose)) {
      return {
        success: false,
        error: new Error(`Cannot parse adjusted close price from '${adjustedCloseStr}'. CSV line: ${line}`)
      }
    } else {
      return { success: true, value: { date: dateR.value, adjustedClose } }
    }
  } else {
    return {
      success: false,
      error: new Error(`Cannot parse date from '${dateStr}'. CSV line: ${line}. Cause: ${dateR.error.toString()}`)
    }
  }
}
