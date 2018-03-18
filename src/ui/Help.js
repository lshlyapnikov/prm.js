// @flow
import React, { Component } from 'react'

type HelpProps = {
  setTitle: (string) => void
}

class Help extends Component<HelpProps> {
  constructor(props: HelpProps) {
    super(props)
    props.setTitle("Help")
  }
  
  render() {
    return (
      <div className="mdl-grid">
        <div className="mdl-cell">
          Help
        </div>
      </div>
    )
  }
}

export default Help