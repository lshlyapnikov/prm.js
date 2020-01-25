// @flow strict
import React, { Component } from "react"

// import TextField from 'material-ui/TextField'
// import FloatingActionButton from 'material-ui/FloatingActionButton'
// import ContentAdd from 'material-ui/svg-icons/content/add'
// import ContentRemove from 'material-ui/svg-icons/content/remove'

type Props = {
  id: string,
  value?: string
}

type State = {
  rows: Array<string>
}

class StockInput extends Component<Props, State> {
  state = {
    rows: []
  }
  render() {
    return (
      <div>
        {/* <TextField id={this.props.id} defaultValue={this.props.value} hintText="Stock symbol"/>
        &nbsp;
        <FloatingActionButton mini={true} secondary={true}>
          <ContentRemove />
        </FloatingActionButton>
        &nbsp;
        <FloatingActionButton mini={true} primary={true}>
          <ContentAdd />
        </FloatingActionButton> */}
        &nbsp;
      </div>
    )
  }
}

export default StockInput
