// @flow
import React, { Component } from 'react'

import TextField from 'material-ui/TextField'
import RaisedButton from 'material-ui/RaisedButton'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import ContentAdd from 'material-ui/svg-icons/content/add'
import ContentRemove from 'material-ui/svg-icons/content/remove'

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
      <div>
        <TextField id="stock" hintText="Stock symbol" defaultValue={this.props.stock} />
        &nbsp;
        <FloatingActionButton mini={true} secondary={true}>
          <ContentRemove />
        </FloatingActionButton>
        &nbsp;
        <FloatingActionButton mini={true}>
          <ContentAdd />
        </FloatingActionButton>
        &nbsp;
        <br />
        <RaisedButton secondary={true}>Cancel</RaisedButton>
        &nbsp;
        <RaisedButton primary={true}>OK</RaisedButton>
      </div>
    );
  }
}

export default StockForm
