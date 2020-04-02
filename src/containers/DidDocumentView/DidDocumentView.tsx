import React from 'react'
import './DidDocumentView.scss'
import Code from '../../components/Code/Code'

type Props = {
  didDocument: object
}

const DidDocumentView: React.FC<Props> = (props): JSX.Element => {
  const { didDocument } = props
  return (
    <div className="attributes">
      <Code>{didDocument}</Code>
    </div>
  )
}

export default DidDocumentView
