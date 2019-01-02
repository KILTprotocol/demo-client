import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import { Select2, Select2Option } from 'select2-react-component'
import * as Wallet from '../../state/ducks/Wallet'

const addIdentity = {
  label: `Create an identity`,
  value: 'create',
}

type Props = RouteComponentProps<{}> & {
  selectIdentity: (seedAsHex: string) => void
  options: Array<{ alias: string; publicKeyAsHex: string; seedAsHex: string }>
  selected?: Wallet.Entry
}

type State = {
  randomPhrase: string
  alias: string
}

class IdentitySelector extends React.Component<Props, State> {
  public render() {
    const identities: Select2Option[] = this.props.options.map(option => {
      return {
        label: `${option.alias} (${option.publicKeyAsHex.substr(0, 10)}...)`,
        value: option.seedAsHex,
      }
    })

    identities.push(addIdentity)

    let currentValue
    if (this.props.selected) {
      const selectedIdentity = identities.find(identity => {
        return identity.value === this.props.selected!.identity.seedAsHex
      })
      if (selectedIdentity && selectedIdentity.value) {
        currentValue = selectedIdentity.value
      }
    }

    return (
      <Select2
        data={identities}
        value={currentValue}
        update={this.selectIdentity}
      />
    )
  }

  private selectIdentity = (value: any) => {
    if (value === 'create') {
      this.props.history.push('/wallet')
    } else {
      this.props.selectIdentity(value)
    }
  }
}

const mapStateToProps = (state: { wallet: Wallet.ImmutableState }) => {
  return {
    options: state.wallet
      .get('identities')
      .toList()
      .toArray()
      .map(identity => ({
        alias: identity.alias,
        publicKeyAsHex: identity.identity.signPublicKeyAsHex,
        seedAsHex: identity.identity.seedAsHex,
      })),
    selected: state.wallet.get('selected'),
  }
}

const mapDispatchToProps = (dispatch: (action: Wallet.Action) => void) => {
  return {
    selectIdentity: (seedAsHex: string) => {
      dispatch(Wallet.Store.selectIdentityAction(seedAsHex))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(IdentitySelector))
