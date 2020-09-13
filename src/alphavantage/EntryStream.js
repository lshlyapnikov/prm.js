// @flow strict
import { Transform } from "stream"

type Callback = (error: ?Error, entry: ?string) => void

export function entryStream(skipHeader: boolean): EntryStream {
  return new EntryStream(skipHeader)
}

class EntryStream extends Transform {
  // $FlowIgnore[unclear-type]
  constructor(skipHeader: boolean) {
    super({ encoding: "utf8" })
    this.skipHeader = skipHeader
    this.count = 0
    this.line = ""
    this.error = null
  }

  skipHeader: boolean
  count: number
  line: string
  error: ?string

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
    const line: ?string = this.getLine()
    if (null != this.error) {
      callback(new Error(this.error), null)
    } else {
      if (null != line) {
        this.push(line)
      }
      callback(null, null)
    }
  }

  getLine(): ?string {
    if (null != this.error) {
      this.error += this.line.trim()
      this.line = ""
      this.count += 1
      return null
    } else if (this.line.length == 0) {
      return null
    } else if (this.count == 0 && this.line.startsWith("{")) {
      this.error = this.line.trim()
      this.line = ""
      this.count += 1
      return null
    } else if (this.count == 0 && this.skipHeader) {
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
