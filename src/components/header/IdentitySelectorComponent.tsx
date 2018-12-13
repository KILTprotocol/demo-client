import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import { Dropdown, DropdownItemProps } from 'semantic-ui-react'
import WalletRedux, {
  WalletAction,
  WalletState,
  WalletStateEntry,
} from '../../state/ducks/WalletRedux'

type Props = RouteComponentProps<{}> & {
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
    const identities: DropdownItemProps[] = this.props.options.map(option => {
      return {
        key: option.publicKeyAsHex,
        text: `${option.alias} (${option.publicKeyAsHex.substr(0, 10)}...)`,
        value: option.seedAsHex,
      }
    })

    identities.push({
      key: 'create',
      text: `Create an identity`,
      value: 'create',
    })

    let defaultValue
    if (this.props.selected) {
      const defaultIdentity = identities.find(identity => {
        return identity.value === this.props.selected!.identity.seedAsHex
      })
      if (defaultIdentity && defaultIdentity.value) {
        defaultValue = defaultIdentity.value
      }
    }

    return (
      <Dropdown
        placeholder="Select an identity"
        fluid={true}
        selection={true}
        options={identities}
        defaultValue={defaultValue}
        onChange={this.selectIdentity}
      />
    )
  }

  private selectIdentity = (event: any, selectedOption: any) => {
    if (selectedOption.value === 'create') {
      this.props.history.push('/wallet')
    } else {
      const publicKeyAsHex = selectedOption.value
      this.props.selectIdentity(publicKeyAsHex)
    }
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
)(withRouter(IdentitySelectorComponent))
