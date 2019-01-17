import { Identity } from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

import './IdentityView.scss'

type Props = {
  // input
  identity: Identity
  alias: string
  selected: boolean
  // output
  onDelete: (seedAsHex: string) => void
  onSelect: (seedAsHex: string) => void
}

class IdentityView extends React.Component<Props, {}> {
  constructor(props: Props) {
    super(props)
  }

  public render() {
    const { identity, alias, selected } = this.props

    const classes = ['IdentityView', selected ? 'selected' : '']

    return (
      <section className={classes.join(' ')}>
        <div className="attributes">
          <div><label>Alias</label>
            <div>{alias}</div>
          </div>
          <div><label>Phrase</label>
            <div>{identity.phrase}</div>
          </div>
          <div><label>Seed (as hex)</label>
            <div>{identity.seedAsHex}</div>
          </div>
          <div><label>Public Key</label>
            <div>{identity.signPublicKeyAsHex}</div>
          </div>
          <div><label>Encryption Public Key</label>
            <div>{identity.boxPublicKeyAsHex}</div>
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
    this.props.onDelete(this.props.identity.seedAsHex)
  }

  private onSelect = () => {
    this.props.onSelect(this.props.identity.seedAsHex)
  }
}

export default IdentityView
