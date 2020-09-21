// @--flow strict
/* eslint-disable */
import React from "react"
import { Subject } from "rxjs"
import autoBind from "react-autobind"

import TextField from "./TextField"
import FileUpload from "./FileUpload"

class FileContent {
  text: string
  rowIndex: number

  constructor(text: string, rowIndex: number) {
    this.text = text
    this.rowIndex = rowIndex
  }
}

type StockFormProps = {
  stock: string
}

type StockFormState = {
  riskFreeReturnRate: string,
  rows: Array<string>,
  fileUploadSubject: Subject<FileContent>
}

function fileUploaded(text: string): void {
  const node: HTMLElement | null = document.getElementById("output")
  if (node != null && typeof text === "string") {
    node.innerText = text
  }
}

class StockForm extends React.Component<StockFormProps, StockFormState> {
  constructor(props: StockFormProps) {
    super(props)
    this.state.fileUploadSubject.subscribe((x: FileContent) => fileUploaded(x.text))
    autoBind(this)
  }

  state = {
    riskFreeReturnRate: "0.9",
    rows: Array(1).fill(""),
    fileUploadSubject: new Subject()
  }

  // TODO find a way to stream the file content from this function
  handleFileUpload(file: File): void {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        this.state.fileUploadSubject.next(new FileContent(reader.result, 0))
      }
    }
    reader.readAsText(file)
  }

  render() {
    return (
      <div className="mdl-grid">
        <form action="#">
          <TextField
            id="riskFreeInterestRate"
            label="Risk Free Interest Rate, %"
            value={this.state.riskFreeReturnRate}
            pattern="[0-6](\.[0-9]{1,2})?"
            error="Not a valid risk free interest rate! Examples: 1.50, 2.58"
          />
          <TextField id="stock-1" label="Stock..." value={this.state.rows[0]} />
          <FileUpload id="file-1" label="File..." handleFileUpload={this.handleFileUpload} />
          <div id="output" />
        </form>
      </div>
    )
  }
}

export default StockForm
