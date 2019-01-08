import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import { Select2, Select2Option } from 'select2-react-component'

import * as Wallet from '../../state/ducks/Wallet'

import './IdentitySelector.scss'

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
    const { options, selected } = this.props

    const identities: Select2Option[] = options.map(option => {
      return {
        label: `${option.alias} (${option.seedAsHex.substr(0, 10)}...)`,
        value: option.seedAsHex,
      }
    })

    identities.push(addIdentity)

    return (
      <section className="IdentitySelector">
        <Select2
          data={identities}
          value={selected && selected!.identity.seedAsHex}
          update={this.selectIdentity}
        />
      </section>
    )
  }

  private selectIdentity = (value: any) => {
    if (value === 'create') {
      this.props.history.push('/wallet/add')
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
