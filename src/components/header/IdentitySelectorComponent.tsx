import * as React from 'react'
import { connect } from 'react-redux'
import WalletRedux, {
  WalletAction,
  WalletState,
  WalletStateEntry,
} from '../../state/ducks/WalletRedux'

type Props = {
  selectIdentity: (seedAsHex: string) => void
  options: Array<{ alias: string; publicKeyAsHex: string; seedAsHex: string }>
  selected: WalletStateEntry | null
}
type State = {
  randomPhrase: string
  alias: string
}

class IdentitySelectorComponent extends React.Component<Props, State> {
  public render() {
    const identities = this.props.options.map(option => {
      return (
        <option value={option.seedAsHex} key={option.seedAsHex}>
          {option.alias} {option.publicKeyAsHex.substr(0, 10)}
        </option>
      )
    })

    let defaultValue
    if (this.props.selected !== null) {
      defaultValue = this.props.selected.identity.seedAsHex
    }

    return (
      <select onChange={this.selectIdentity} defaultValue={defaultValue}>
        <option key={0}>Nothing selected</option>
        {identities}
      </select>
    )
  }

  private selectIdentity = (event: React.FormEvent<HTMLSelectElement>) => {
    const publicKeyAsHex = event.currentTarget.value
    this.props.selectIdentity(publicKeyAsHex)
  }
}

const mapStateToProps = (state: { wallet: WalletState }) => {
  return {
    options: state.wallet
      .get('identities')
      .toList()
      .toArray()
      .map(identity => ({
        alias: identity.alias,
        publicKeyAsHex: identity.identity.publicKeyAsHex,
        seedAsHex: identity.identity.seedAsHex,
      })),
    selected: state.wallet.get('selected'),
  }
}

const mapDispatchToProps = (dispatch: (action: WalletAction) => void) => {
  return {
    selectIdentity: (seedAsHex: string) => {
      dispatch(WalletRedux.selectIdentityAction(seedAsHex))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(IdentitySelectorComponent)
