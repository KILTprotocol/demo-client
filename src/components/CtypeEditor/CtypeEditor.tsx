import React from 'react'
import * as common from 'schema-based-json-editor'

import CTypeInputModel from '../../utils/CtypeUtils/CtypeInputSchema'
import SchemaEditor from '../SchemaEditor/SchemaEditor'

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

const CTypeEditor: React.FC<Props> = ({
  cancel,
  connected,
  isValid,
  submit,
  cType,
  updateCType,
}) => {
  return (
    <section className="CTypeEditor">
      <SchemaEditor
        schema={CTypeInputModel as common.Schema}
        initialValue={cType}
        updateValue={updateCType}
      />
      <div className="actions">
        <button type="button" className="cancel-cType" onClick={cancel}>
          Cancel
        </button>
        <button
          type="button"
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
