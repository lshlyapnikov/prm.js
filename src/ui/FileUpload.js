// @flow
import React from "react"

type FileUploadProps = {
  id: string,
  label: string,
  handleFileUpload(file: File): void
}

export default class FileUpload extends React.Component<FileUploadProps> {
  onChange(file: File): void {
    const inputElement = document.getElementById(this.props.id)
    if (inputElement instanceof HTMLInputElement) {
      inputElement.placeholder = file.name
    }
    this.props.handleFileUpload(file)
  }

  render() {
    return (
      <div className="mdl-textfield mdl-js-textfield mdl-textfield--file">
        <input
          className="mdl-textfield__input"
          placeholder={this.props.label}
          type="text"
          readOnly
          id={this.props.id}
        />
        <div className="mdl-button mdl-button--primary mdl-button--icon mdl-button--file">
          <i className="material-icons">attach_file</i>
          <input type="file" onChange={e => this.onChange(e.target.files[0])} />
        </div>
      </div>
    )
  }
}
