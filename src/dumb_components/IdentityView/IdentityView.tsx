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
      <tbody className={classes.join(' ')}>
        <tr>
          <td>Alias:</td>
          <td>{alias}</td>
        </tr>
        <tr>
          <td>Phrase:</td>
          <td>{identity.phrase}</td>
        </tr>
        <tr>
          <td>Seed (as hex):</td>
          <td>{identity.seedAsHex}</td>
        </tr>
        <tr>
          <td>Public Key:</td>
          <td>{identity.signPublicKeyAsHex}</td>
        </tr>
        <tr>
          <td>Encryption Public Key:</td>
          <td>{identity.boxPublicKeyAsHex}</td>
        </tr>
        <tr>
          <td colSpan={2} className="actions">
            <button onClick={this.onSelect}>Select</button>
            <button onClick={this.onDelete}>Remove</button>
          </td>
        </tr>
      </tbody>
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
