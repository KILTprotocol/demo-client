import * as React from 'react'
import { JSONEditor } from 'react-schema-based-json-editor'
import * as common from 'schema-based-json-editor'

import './SchemaEditor.scss'

type Props = {
  schema: common.Schema
  initialValue: common.ValueType
  updateValue: (value: common.ValueType, _isValid: boolean) => void
}

const SchemaEditor = ({ schema, initialValue, updateValue }: Props) => {
  return (
    <div className="schema-based-json-editor">
      <JSONEditor
        schema={schema}
        initialValue={initialValue}
        updateValue={updateValue}
        icon="fontawesome5"
      />
    </div>
  )
}

export default SchemaEditor
