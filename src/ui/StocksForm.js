// @flow
import React from 'react'

import TextField from './TextField'
import FileUpload from './FileUpload'

type StockFormProps = {
  stock: string
}

type StockFormState = {
  rows: Array<string>
}

class StockForm extends React.Component<StockFormProps, StockFormState> {
  state = {
    rows: []
  }

  // TODO find a way to stream the file content from this function
  handleFileUpload(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      var text: string | ArrayBuffer = reader.result;
      var node: HTMLElement | null = document.getElementById('output');
      if (node != null && typeof text === 'string') {
        node.innerText = text.substring(0, 32)
      }
    };
    reader.readAsText(file)
  }

  render() {
    return (
      <div className="mdl-grid">
        <form action="#">
          <TextField id="riskFreeInterestRate" label="Risk Free Interest Rate, %" pattern="[0-6](\.[0-9]{1,2})?" error="Not a valid risk free interest rate! Examples: 1.50, 2.58" />
          <TextField id="stock-1" label="Stock..." />
          <FileUpload id="file-1" label="File..." handleFileUpload={this.handleFileUpload} />
          <div id='output'></div>
        </form>
      </div>
    )
  }
}

export default StockForm
