// @flow strict
import commandLineArgs from "command-line-args"
import { logger } from "../server/utils"
const log = logger("cli/prm.js")

log.info(`args: ${JSON.stringify(process.argv)}`)
const optionDefinitions = [
  {
    name: "stocks",
    type: String,
    multiple: true,
    defaultValue: undefined,
    description: "A list of stock symbols"
  },
  {
    name: "interval",
    type: Number,
    defaultValue: undefined,
    description: "Interval in years"
  }
]

const options = commandLineArgs(optionDefinitions, { stopAtFirstUnknown: true })

const uknownArgs: ?Array<string> = options["_unknown"]
if (uknownArgs != null) {
  const uknownArgsStr: string = uknownArgs.reduce((z: string, a: string) => z + ", " + a)
  log.error(`Uknown command line arguments: ${uknownArgsStr}`)
}

const stocks: Array<string> = options["stocks"]
const interval: number = options["interval"]

log.info(`options: ${JSON.stringify(options)}`)
log.info(`stocks: ${JSON.stringify(stocks)}`)
log.info(`interval: ${JSON.stringify(interval)}`)
