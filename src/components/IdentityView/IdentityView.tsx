import Identicon from '@polkadot/ui-identicon'
import * as React from 'react'
import { MyIdentity } from '../../types/Contact'

import './IdentityView.scss'

type Props = {
  // input
  myIdentity: MyIdentity
  selected: boolean
  // output
  onDelete: (address: MyIdentity['identity']['address']) => void
  onSelect: (seedAsHex: MyIdentity['identity']['address']) => void
}

class IdentityView extends React.Component<Props, {}> {
  constructor(props: Props) {
    super(props)
  }

  public render() {
    const { myIdentity, selected } = this.props

    const classes = ['IdentityView', selected ? 'selected' : '']

    return (
      <section className={classes.join(' ')}>
        <div className="attributes">
          <div>
            <label>Alias</label>
            <div>{myIdentity.metaData.name}</div>
          </div>
          <div>
            <label>Identicon</label>
            <div>
              <Identicon
                value={myIdentity.identity.address}
                size={32}
                theme="substrate"
              />
            </div>
          </div>
          <div>
            <label>Phrase</label>
            <div>{myIdentity.phrase}</div>
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
        <div className="actions">
          <button onClick={this.onDelete} disabled={selected}>
            Remove
          </button>
          <button onClick={this.onSelect} disabled={selected}>
            Select
          </button>
        </div>
      </section>
    )
  }

  private onDelete = () => {
    this.props.onDelete(this.props.myIdentity.identity.address)
  }

  private onSelect = () => {
    this.props.onSelect(this.props.myIdentity.identity.address)
  }
}

export default IdentityView
