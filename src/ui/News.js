// @flow strict
import React, { Component } from "react"
import { CommonProps } from "./CommonProps"

class News extends Component<CommonProps> {
  constructor(props: CommonProps) {
    super(props)
    props.setTitle("News")
  }

  render() {
    return (
      <div className="mdl-grid">
        <div className="mdl-cell">News</div>
      </div>
    )
  }
}

export default News
