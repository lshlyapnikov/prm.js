// @flow
import React, { Component } from 'react'
import { CommonProps } from './CommonProps'

class LegalInfo extends Component<CommonProps> {
  constructor(props: CommonProps) {
    super(props)
    props.setTitle("Legal Information")
  }

  render() {
    return (
      <div className="mdl-grid">
        <div className="mdl-cell">
          Legal Information
        </div>
      </div>
    )
  }
}

export default LegalInfo