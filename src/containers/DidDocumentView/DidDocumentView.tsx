import * as React from 'react'
import { Contact } from '../../types/Contact'
import './DidDocumentView.scss'
import Code from '../../components/Code/Code'

type Props = {
  didDocument: object
  children: any
}

const DidDocumentView = (props: Props) => {
  const { didDocument } = props
  return (
    <>
      <div className="attributes">
        <div>
          <Code>{didDocument}</Code>
        </div>
      </div>
    </>
  )
}

export default DidDocumentView
