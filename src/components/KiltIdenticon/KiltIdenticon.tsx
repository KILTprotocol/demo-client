import Identicon from '@polkadot/ui-identicon'
import * as React from 'react'
import { Contact, MyIdentity } from '../../types/Contact'

import './KiltIdenticon.scss'

type Props = {
  contact?: Contact
  myIdentity?: MyIdentity
  size?: number
}

const DEFAULT_SIZE = 32

const KiltIdenticon = (props: Props) => {
  const { contact, myIdentity, size } = props
  const address = myIdentity
    ? myIdentity.identity.address
    : contact
    ? contact.publicIdentity.address
    : undefined

  return (
    <div className="KiltIdenticon">
      <Identicon
        value={address}
        size={size ? size : DEFAULT_SIZE}
        theme="substrate"
      />
    </div>
  )
}

export default KiltIdenticon
