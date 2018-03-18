// @flow
import React, { Component } from 'react'
import 'typeface-roboto'

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import DatePicker from 'material-ui/DatePicker'
import Paper from 'material-ui/Paper'
import Menu from 'material-ui/Menu'
import MenuItem from 'material-ui/MenuItem'

import StockForm from './StocksForm'

import './App.css'

type AppProps = {}

class App extends Component<AppProps> {
  render() {
    return (
      <MuiThemeProvider>
        <AppContent />
      </MuiThemeProvider >
    );
  }
}

const paperStyle = {
  textAlign: 'left',
  backgroundColor: '#616161',
  display: 'inline-block'
}

class AppContent extends Component<{}> {
  render() {
    return (
      <div class="mdl-grid">
        <div class="mdl-cell">
          <FlatButton>OK flat</FlatButton>
          <br />
          <RaisedButton primary={true} onClick={() => alert("OK!")}>OK</RaisedButton>
          <RaisedButton secondary={true} onClick={() => alert("Cancel!")}>Cancel</RaisedButton>
        </div>
        <div class="mdl-cell">
          <DatePicker hintText="Portrait Dialog" />
          <DatePicker hintText="Landscape Dialog" mode="landscape" />
          <DatePicker hintText="Dialog Disabled" disabled={true} />
          <DatePicker hintText="Open to Year" openToYearSelection={true} />
        </div>
        <StockForm stock="IBM" />
      </div>
    )
  }
}

export default App;
