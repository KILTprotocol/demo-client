import { CTypeInputModel } from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import * as common from 'schema-based-json-editor'
import SchemaEditor from '../SchemaEditor/SchemaEditor'

import './CtypeEditor.scss'

type Props = {
  // input
  connected: boolean
  ctype: string
  isValid: boolean
  // output
  cancel: () => void
  submit: () => void
  updateCType: (ctype: any, isValid: boolean) => void
}

const CtypeEditor = (props: Props) => {
  return (
    <section className="CtypeEditor">
      <SchemaEditor
        schema={CTypeInputModel as common.Schema}
        initialValue={props.ctype}
        updateValue={props.updateCType}
      />
      <div className="actions">
        <button className="cancel-ctype" onClick={props.cancel}>
          Cancel
        </button>
        <button
          className="submit-ctype"
          disabled={!props.connected || !props.isValid}
          onClick={props.submit}
        >
          Submit
        </button>
      </div>
    </section>
  )
}

export default CtypeEditor
