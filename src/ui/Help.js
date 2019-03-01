// @flow
import React, { Component } from "react"
import { CommonProps } from "./CommonProps"

class Help extends Component<CommonProps> {
  constructor(props: CommonProps) {
    super(props)
    props.setTitle("Help")
  }

  render() {
    return (
      <div className="mdl-grid">
        <div className="mdl-cell">Help</div>
      </div>
    )
  }
}

export default Help
