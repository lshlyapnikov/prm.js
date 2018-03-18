// @flow
import React, { Component } from 'react'

type ContactProps = {
  setTitle: (string) => void
}

class Contact extends Component<ContactProps> {
  constructor(props: ContactProps) {
    super(props)
    props.setTitle("Contact")
  }
  
  render() {
    return (
      <div className="mdl-grid">
        <div className="mdl-cell">
          Contact
        </div>
      </div>
    )
  }
}

export default Contact