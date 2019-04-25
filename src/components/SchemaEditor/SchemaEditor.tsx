import * as React from 'react'
import { JSONEditor } from 'react-schema-based-json-editor'
import * as common from 'schema-based-json-editor'
import { Claim } from '@kiltprotocol/prototype-sdk'

import './SchemaEditor.scss'

type Props = {
  schema: common.Schema
  initialValue: common.ValueType
  updateValue: (value: common.ValueType, _isValid: boolean) => void
}

class SchemaEditor extends React.Component<Props> {
  constructor(props: Props) {
    super(props)

    this.prepareTimeValuesAndUpdate = this.prepareTimeValuesAndUpdate.bind(this)
  }

  public render() {
    const { schema, initialValue } = this.props
    return (
      <div className="schema-based-json-editor">
        <JSONEditor
          schema={schema}
          initialValue={initialValue}
          updateValue={this.prepareTimeValuesAndUpdate}
          icon="fontawesome5"
        />
      </div>
    )
  }

  private prepareTimeValuesAndUpdate(
    contents: Claim['contents'],
    isValid: boolean
  ) {
    const { updateValue, schema } = this.props

    for (const prop in contents) {
      if (
        contents.hasOwnProperty(prop) &&
        // is time format in schema
        // @ts-ignore
        schema.properties[prop].format === 'time' &&
        // not empty
        contents[prop] &&
        // Only, if not already ending in 00+00:00 (where 0 can be any digit)
        !contents[prop].match(/\d{2}\+\d{2}:\d{2}$/)
      ) {
        contents[prop] = `${contents[prop]}:00+00:00`
      }
    }

    updateValue(contents, isValid)
  }
}

export default SchemaEditor
