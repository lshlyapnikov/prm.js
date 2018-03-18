// @flow
import React, { Component } from 'react'

type LegalInfoProps = {
  setTitle: (string) => void
}

class LegalInfo extends Component<LegalInfoProps> {
  constructor(props: LegalInfoProps) {
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