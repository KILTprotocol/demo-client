import * as React from 'react'
import { ReactNode } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import Select from 'react-select'
import ContactPresentation from '../../components/ContactPresentation/ContactPresentation'
import ContactRepository from '../../services/ContactRepository'

import * as Contacts from '../../state/ducks/Contacts'
import * as Wallet from '../../state/ducks/Wallet'
import PersistentStore, {
  State as ReduxState,
} from '../../state/PersistentStore'
import { MyIdentity } from '../../types/Contact'

import './IdentitySelector.scss'

const addIdentity = {
  label: `Create an identity`,
  value: 'create',
}

type SelectIdentityOption = {
  label: ReactNode
  value: MyIdentity['identity']['address']
}

type Props = RouteComponentProps<{}> & {
  selectIdentity: (seedAsHex: string) => void
  myIdentities: MyIdentity[]
  selectedIdentity?: Wallet.Entry
}

type State = {
  randomPhrase: string
  alias: string
}

class IdentitySelector extends React.Component<Props, State> {
  public componentDidMount() {
    const { myIdentities } = this.props
    const myIdentityContacts = myIdentities.map((myIdentity: MyIdentity) =>
      ContactRepository.getContactFromIdentity(myIdentity)
    )
    PersistentStore.store.dispatch(
      Contacts.Store.addContacts(myIdentityContacts)
    )
  }

  public render() {
    const { myIdentities, selectedIdentity } = this.props

    const identityOptions: SelectIdentityOption[] = myIdentities.map(
      (myIdentity: MyIdentity) => ({
        label: (
          <ContactPresentation
            address={myIdentity.identity.address}
            size={20}
          />
        ),
        value: myIdentity.identity.address,
      })
    )

    identityOptions.push(addIdentity)

    let selectedOption
    if (selectedIdentity) {
      selectedOption = identityOptions.find(
        (identityOption: SelectIdentityOption) =>
          identityOption.value === selectedIdentity.identity.address
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
          options={identityOptions}
          value={selectedOption}
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

const mapStateToProps = (state: ReduxState) => ({
  myIdentities: Wallet.getAllIdentities(state),
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

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
