import { CTypeInputModel } from '@kiltprotocol/prototype-sdk'
import * as React from 'react'
import * as common from 'schema-based-json-editor'
import SchemaEditor from '../SchemaEditor/SchemaEditor'

import './CtypeEditor.scss'

type Props = {
  ctype: string
  updateCType: (ctype: any) => void
  submit: () => void
  connected: boolean
}

type State = {
  isValid: boolean
}

class CtypeEditor extends React.Component<Props, State> {
  private schema: common.Schema

  constructor(props: Props) {
    super(props)
    this.schema = CTypeInputModel as common.Schema
    this.state = {
      isValid: false,
    }
  }

  public render() {
    return (
      <section className="CtypeEditor">
        <SchemaEditor
          schema={this.schema}
          initialValue={this.props.ctype}
          updateValue={this.updateCType}
        />
        <div className="actions">
          <button
            className="submit-ctype"
            disabled={!this.props.connected || !this.state.isValid}
            onClick={this.submit}
          >
            Submit
          </button>
          <button className="cancel-ctype" onClick={this.cancel}>
            Cancel
          </button>
        </div>
      </section>
    )
  }

  private updateCType = (ctype: common.ValueType, _isValid: boolean) => {
    this.setState({
      isValid: _isValid,
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

export default CtypeEditor
