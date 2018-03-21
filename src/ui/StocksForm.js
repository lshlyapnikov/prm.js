// @flow
import React, { Component } from 'react'

import TextField from './TextField'

// import TextField from 'material-ui/TextField'
// import RaisedButton from 'material-ui/RaisedButton'
// import FloatingActionButton from 'material-ui/FloatingActionButton'
// import ContentAdd from 'material-ui/svg-icons/content/add'
// import ContentRemove from 'material-ui/svg-icons/content/remove'

type Props = {
  stock: string
}

type State = {
  rows: Array<string>
}

class StockForm extends Component<Props, State> {
  state = {
    rows: []
  }
  render() {
    return (
      <div className="mdl-grid">
        <form action="#">
          <TextField id="stock-1" label="Stock..." />
          <TextField id="riskFreeInterestRate" label="Risk Free Interest Rate, %" pattern="[0-9]*(\.[0-9]+)?" error="Input is not a number!" />
        </form>
      </div>
    )
  }
}

export default StockForm
