// @flow
import React, { Component } from 'react'
import 'typeface-roboto'

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import AppBar from 'material-ui/AppBar'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import DatePicker from 'material-ui/DatePicker';

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

class AppContent extends Component<{}> {
  render() {
    return (
      <div>
        <AppBar title="Test" />
        <FlatButton>OK flat</FlatButton>
        <br />
        <RaisedButton primary={true} onClick={() => alert("OK!")}>OK</RaisedButton>
        <RaisedButton secondary={true} onClick={() => alert("Cancel!")}>Cancel</RaisedButton>
        <div>
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
