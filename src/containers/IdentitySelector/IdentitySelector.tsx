import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import Select from 'react-select'

import * as Wallet from '../../state/ducks/Wallet'

import './IdentitySelector.scss'

const addIdentity = {
  label: `Create an identity`,
  value: 'create',
}

type SelectIdentityOption = {
  label: string
  value: string
}

type Props = RouteComponentProps<{}> & {
  selectIdentity: (seedAsHex: string) => void
  identities: SelectIdentityOption[]
  selected?: Wallet.Entry
}

type State = {
  randomPhrase: string
  alias: string
}

class IdentitySelector extends React.Component<Props, State> {
  public render() {
    const { identities, selected } = this.props

    identities.push(addIdentity)

    let selectedIdentity
    if (selected) {
      selectedIdentity = identities.find(
        (identity: SelectIdentityOption) =>
          identity.value === selected.identity.seedAsHex
      )
    }

    return (
      <section className="IdentitySelector">
        <Select
          className="react-select-container"
          classNamePrefix="react-select"
          isClearable={false}
          isSearchable={false}
          isMulti={false}
          name="selectIdentity"
          options={identities}
          value={selectedIdentity}
          onChange={this.selectIdentity}
        />
      </section>
    )
  }

  private selectIdentity = (selectedOption: SelectIdentityOption) => {
    if (selectedOption.value === 'create') {
      this.props.history.push('/wallet/add')
    } else {
      this.props.selectIdentity(selectedOption.value)
    }
  }
}

const mapStateToProps = (state: { wallet: Wallet.ImmutableState }) => {
  return {
    identities: state.wallet
      .get('identities')
      .toList()
      .toArray()
      .map(identity => ({
        label: identity.alias,
        value: identity.identity.seedAsHex,
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
