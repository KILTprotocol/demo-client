import * as React from 'react'
import { JSONEditor } from 'react-schema-based-json-editor'
import * as common from 'schema-based-json-editor'

import './SchemaEditor.scss'

type Props = {
  schema: common.Schema
  initialValue: string
  updateValue: (value: common.ValueType, _isValid: boolean) => void
}

const SchemaEditor = (props: Props) => {
  return (
    <div className="schema-based-json-editor">
      <JSONEditor
        schema={props.schema}
        initialValue={props.initialValue}
        updateValue={props.updateValue}
        icon="fontawesome5"
      />
    </div>
  )
}

export default SchemaEditor
