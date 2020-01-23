import * as React from 'react'
import { Contact } from '../../types/Contact'
import './DidView.scss'
import Code from '../../components/Code/Code'

type Props = {
  did: Contact['did']
  children: any
}

const DidView = (did: Props) => {
  return (
    <>
      <div className="attributes">
        <div>
          <Code>{did.did}</Code>{' '}
        </div>
      </div>
    </>
  )
}

export default DidView
