import { CTypeInputModel, CTypeWrapperModel } from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import * as common from 'schema-based-json-editor'
import PlainSchemaEditor from '../PlainSchemaEditor/PlainSchemaEditor'
import SchemaEditor from '../SchemaEditor/SchemaEditor'

import './CtypeEditor.scss'

type Props = {
  connected: boolean
  cType: string
  isValid: boolean

  onCancel: () => void
  onSubmit: () => void
  onUpdateCType: (cType: any) => void
}

const CTypeEditor = (props: Props) => {
  const { onCancel, connected, isValid, onSubmit, cType, onUpdateCType } = props

  return (
    <section className="CTypeEditor">
      {/*<SchemaEditor onUpdateValue={onUpdateCType} />*/}
      {/*<PlainSchemaEditor schema={CTypeWrapperModel as common.Schema} />*/}
      <div className="actions">
        <button className="cancel-cType" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="submit-cType"
          disabled={!connected || !isValid}
          onClick={onSubmit}
        >
          Submit
        </button>
      </div>
    </section>
  )
}

export default CTypeEditor
