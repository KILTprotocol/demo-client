import * as React from 'react'
import { JSONEditor } from 'react-schema-based-json-editor'
import * as common from 'schema-based-json-editor'

import './SchemaEditor.scss'

type Props = {
  initialValue: common.ValueType
  schema: common.Schema
  // output
  onUpdateSchema: (value: common.ValueType, isValid: boolean) => void
}

const SchemaEditor = ({ initialValue, schema, onUpdateSchema }: Props) => {
  return (
    <div className="schema-based-json-editor">
      <JSONEditor
        schema={schema}
        initialValue={initialValue}
        updateValue={onUpdateSchema}
        icon="fontawesome5"
      />
    </div>
  )
}

export default SchemaEditor
