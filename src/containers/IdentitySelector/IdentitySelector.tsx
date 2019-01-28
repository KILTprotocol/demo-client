import * as React from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import Select from 'react-select'

import * as Wallet from '../../state/ducks/Wallet'
import { MyIdentity } from '../../types/Contact'

import './IdentitySelector.scss'

const addIdentity = {
  label: `Create an identity`,
  value: 'create',
}

type SelectIdentityOption = {
  label: MyIdentity['metaData']['name']
  value: MyIdentity['identity']['address']
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
          identity.value === selected.identity.address
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
      .map((myIdentity: MyIdentity) => ({
        label: myIdentity.metaData.name,
        value: myIdentity.identity.address,
      })),
    selected: state.wallet.get('selectedIdentity'),
  }
}

const mapDispatchToProps = (dispatch: (action: Wallet.Action) => void) => {
  return {
    selectIdentity: (address: string) => {
      dispatch(Wallet.Store.selectIdentityAction(address))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(IdentitySelector))
