// @flow
import React, { Component } from 'react'
import 'typeface-roboto'

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
// import getMuiTheme from 'material-ui/styles/getMuiTheme'
// import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'
// import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme'
import AppBar from 'material-ui/AppBar'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import DatePicker from 'material-ui/DatePicker';

import StockForm from './StocksForm'

import './App.css'

const style = {
  marginLeft: 20,
  marginRight: 20
};

class App extends Component<{}> {
  render() {
    return (
      <MuiThemeProvider>
        <AppBar title="Test" />
        <div>
          <FlatButton>OK flat</FlatButton>
          <FloatingActionButton mini={true} style={style}>
            <ContentAdd />
          </FloatingActionButton>
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
      </MuiThemeProvider >
    );
  }
}

export default App;
