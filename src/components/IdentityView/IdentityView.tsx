import * as React from 'react'

import { MyIdentity } from '../../types/Contact'
import ContactPresentation from '../ContactPresentation/ContactPresentation'

import './IdentityView.scss'

type Props = {
  // input
  myIdentity: MyIdentity
  selected: boolean
  // output
  onDelete?: (address: MyIdentity['identity']['address']) => void
  onSelect?: (seedAsHex: MyIdentity['identity']['address']) => void
}

class IdentityView extends React.Component<Props, {}> {
  constructor(props: Props) {
    super(props)
  }

  public render() {
    const { myIdentity, onDelete, onSelect, selected } = this.props

    const classes = ['IdentityView', selected ? 'selected' : '']

    return (
      <section className={classes.join(' ')}>
        {selected && <h2>Active identity</h2>}
        <ContactPresentation myIdentity={myIdentity} size={50} />
        <div className="attributes">
          <div>
            <label>Alias</label>
            <div>{myIdentity.metaData.name}</div>
          </div>
          <div>
            <label>Phrase</label>
            <div>{myIdentity.phrase}</div>
          </div>
          <div>
            <label>Address</label>
            <div>{myIdentity.identity.address}</div>
          </div>
          <div>
            <label>Seed (as hex)</label>
            <div>{myIdentity.identity.seedAsHex}</div>
          </div>
          <div>
            <label>Public Key</label>
            <div>{myIdentity.identity.signPublicKeyAsHex}</div>
          </div>
          <div>
            <label>Encryption Public Key</label>
            <div>{myIdentity.identity.boxPublicKeyAsHex}</div>
          </div>
        </div>
        {!selected && (
          <div className="actions">
            {onDelete && (
              <button
                onClick={onDelete.bind(this, myIdentity.identity.address)}
                disabled={selected}
              >
                Remove
              </button>
            )}
            {onSelect && (
              <button
                onClick={onSelect.bind(this, myIdentity.identity.address)}
                disabled={selected}
              >
                Select
              </button>
            )}
          </div>
        )}
      </section>
    )
  }
}

export default IdentityView
