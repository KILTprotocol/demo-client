import * as React from 'react'
import { Contact } from '../../types/Contact'
import './DidDocumentView.scss'
import Code from '../../components/Code/Code'

type Props = {
  did: Contact['did']
  children: any
}

const DidDocumentView = (props: Props) => {
  const { did } = props
  return (
    <>
      <div className="attributes">
        <div>
          <Code>{did?.document}</Code>{' '}
        </div>
      </div>
    </>
  )
}

export default DidDocumentView
