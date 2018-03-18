// @flow
import React, { Component } from 'react'

type NewsProps = {
  setTitle: (string) => void
}

class News extends Component<NewsProps> {
  constructor(props: NewsProps) {
    super(props)
    props.setTitle("News")
  }

  render() {
    return (
      <div className="mdl-grid">
        <div className="mdl-cell">
          News
        </div>
      </div>
    )
  }
}

export default News