import { CTypeInputModel } from '@kiltprotocol/prototype-sdk/build'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/javascript/javascript.js'
import * as React from 'react'
import { JSONEditor } from 'react-schema-based-json-editor'
import * as common from 'schema-based-json-editor'

import './cTypeEditor.scss'

type Props = {
  ctype: string
  updateCType: (ctype: any) => void
  submit: () => void
  connected: boolean
}

interface State {
  isValid: boolean
}

class CtypeEditorComponent extends React.Component<Props, State> {
  schema: common.Schema

  constructor(props: Props) {
    super(props)
    this.schema = CTypeInputModel as common.Schema
    this.state = {
      isValid: false
    }
  }

  public render() {
    return (
      <section className="ctype-editor">
        <div className="schema-based-json-editor">
          <JSONEditor schema={this.schema}
                      initialValue={this.props.ctype}
                      updateValue={this.updateCType}
                      icon="fontawesome5" />
          <div className="actions">
            <button
              className="submit-ctype"
              disabled={!this.props.connected || !this.state.isValid}
              onClick={this.submit}
            >
              Submit
            </button>
            <button
              className="cancel-ctype"
              onClick={this.cancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </section>
    )
  }

  private updateCType = (ctype: any, _isValid: boolean) => {
    this.setState({
      isValid: _isValid
    })
    this.props.updateCType(ctype)
  }

  private submit = () => {
    if (this.props.connected && this.state.isValid) {
      this.props.submit()
    }
  }

  private cancel = () => {
    // do something
  }
}

export default CtypeEditorComponent
