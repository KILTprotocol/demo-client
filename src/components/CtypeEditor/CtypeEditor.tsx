import { CTypeInputModel } from '@kiltprotocol/sdk-js'
import * as React from 'react'

import * as common from 'schema-based-json-editor'
import SchemaEditor from '../SchemaEditor/SchemaEditor'

import './CtypeEditor.scss'

type Props = {
  // input
  connected: boolean
  cType: string
  isValid: boolean
  // output
  cancel: () => void
  submit: () => void
  updateCType: (cType: any, isValid: boolean) => void
}

const CTypeEditor = (props: Props) => {
  const { cancel, connected, isValid, submit, cType, updateCType } = props

  return (
    <section className="CTypeEditor">
      <SchemaEditor
        schema={CTypeInputModel as common.Schema}
        initialValue={cType}
        updateValue={updateCType}
      />
      <div className="actions">
        <button className="cancel-cType" onClick={cancel}>
          Cancel
        </button>
        <button
          className="submit-cType"
          disabled={!connected || !isValid}
          onClick={submit}
        >
          Submit
        </button>
      </div>
    </section>
  )
}

export default CTypeEditor
