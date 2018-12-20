import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import { Dropdown, DropdownItemProps, DropdownProps } from 'semantic-ui-react'
import WalletRedux, {
  ImmutableWalletState,
  WalletAction,
  WalletStateEntry,
} from '../../state/ducks/WalletRedux'

const addIdentity = {
  key: 'create',
  text: `Create an identity`,
  value: 'create',
}

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

    identities.push(addIdentity)

    let defaultValue
    if (this.props.selected) {
      const selectedIdentity = identities.find(identity => {
        return identity.value === this.props.selected!.identity.seedAsHex
      })
      if (selectedIdentity && selectedIdentity.value) {
        defaultValue = selectedIdentity.value
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

  private selectIdentity = (
    event: React.SyntheticEvent<HTMLElement>,
    selectedOption: DropdownProps
  ) => {
    if (selectedOption.value === 'create') {
      this.props.history.push('/wallet')
    } else {
      const publicKeyAsHex = selectedOption.value as string
      this.props.selectIdentity(publicKeyAsHex)
    }
  }
}

const mapStateToProps = (state: { wallet: ImmutableWalletState }) => {
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
