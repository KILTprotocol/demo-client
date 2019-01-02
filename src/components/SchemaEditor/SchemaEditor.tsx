import * as React from 'react'
import { JSONEditor } from 'react-schema-based-json-editor'
import * as common from 'schema-based-json-editor'

import './SchemaEditor.scss'

type Props = {
  schema: common.Schema
  initialValue: string
  updateValue: (value: common.ValueType, _isValid: boolean) => void
}

type State = {}

class SchemaEditor extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
  }

  public render() {
    return (
      <div className="schema-based-json-editor">
        <JSONEditor
          schema={this.props.schema}
          initialValue={this.props.initialValue}
          updateValue={this.props.updateValue}
          icon="fontawesome5"
        />
      </div>
    )
  }
}

export default SchemaEditor
