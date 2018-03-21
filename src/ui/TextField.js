// @flow
import React, { Component } from 'react'

type TextFieldProps = {
  id: string,
  label: string,
  pattern?: string,
  error?: string
}

export default class TextField extends Component<TextFieldProps> {
  render() {
    const hasPattern: boolean = this.props.pattern != null

    return hasPattern ? (
      <div className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
        <input className="mdl-textfield__input" type="text" pattern={this.props.pattern} id={this.props.id} />
        <label className="mdl-textfield__label" htmlFor={this.props.id}>{this.props.label}</label>
        <span className="mdl-textfield__error">{this.props.error}</span>
      </div>
    ) : (
        <div className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
          <input className="mdl-textfield__input" type="text" id={this.props.id} />
          <label className="mdl-textfield__label" htmlFor={this.props.id}>{this.props.label}</label>
        </div>
      )
  }
}
