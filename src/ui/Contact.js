/** @format */

// @flow
import React, { Component } from "react"
import { CommonProps } from "./CommonProps"

class Contact extends Component<CommonProps> {
  constructor(props: CommonProps) {
    super(props)
    props.setTitle("Contact")
  }

  render() {
    return (
      <div className="mdl-grid">
        <div className="mdl-cell">Contact</div>
      </div>
    )
  }
}

export default Contact
