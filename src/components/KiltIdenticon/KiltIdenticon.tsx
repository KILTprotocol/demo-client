import Identicon from '@polkadot/ui-identicon'
import * as React from 'react'
import { Contact, MyIdentity } from '../../types/Contact'

import './KiltIdenticon.scss'

type Props = {
  contact?: Contact
  iconOnly?: boolean
  myIdentity?: MyIdentity
  fallback?: string
  size?: number
}

const DEFAULT_SIZE = 32

const KiltIdenticon = (props: Props) => {
  const { contact, fallback, myIdentity, size, iconOnly } = props
  const address = myIdentity
    ? myIdentity.identity.address
    : contact
    ? contact.publicIdentity.address
    : undefined
  const name = myIdentity
    ? myIdentity.metaData.name
    : contact
    ? contact.metaData.name
    : fallback

  return (
    <div className="KiltIdenticon">
      <Identicon
        value={address}
        size={size ? size : DEFAULT_SIZE}
        theme="substrate"
      />
      <span className="name">{name}</span>
    </div>
  )
}

export default KiltIdenticon
