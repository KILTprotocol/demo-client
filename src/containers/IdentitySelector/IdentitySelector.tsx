import React, { ReactNode } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import { IPublicIdentity } from '@kiltprotocol/types'
import Select from 'react-select'
import ContactPresentation from '../../components/ContactPresentation/ContactPresentation'
import ContactRepository from '../../services/ContactRepository'

import * as Contacts from '../../state/ducks/Contacts'
import * as Wallet from '../../state/ducks/Wallet'
import {
  persistentStoreInstance,
  State as ReduxState,
} from '../../state/PersistentStore'
import { IMyIdentity } from '../../types/Contact'

import './IdentitySelector.scss'
import { ValueType } from 'react-select/lib/types'

const addIdentity = {
  label: `Create an identity`,
  value: 'create',
}

type SelectIdentityOption = {
  label: ReactNode
  value: IPublicIdentity['address']
}

type StateProps = {
  myIdentities: IMyIdentity[]
  selectedIdentity?: Wallet.Entry
}

type DispatchProps = {
  selectIdentity: (seedAsHex: string) => void
}

type Props = StateProps & DispatchProps & RouteComponentProps<{}>

type State = {
  randomPhrase: string
  alias: string
}

class IdentitySelector extends React.Component<Props, State> {
  public componentDidMount(): void {
    const { myIdentities } = this.props
    const myIdentityContacts = myIdentities.map((myIdentity: IMyIdentity) =>
      ContactRepository.getContactFromIdentity(myIdentity, {
        unregistered: true,
      })
    )
    persistentStoreInstance.store.dispatch(
      Contacts.Store.addContacts(myIdentityContacts)
    )
  }

  private selectIdentity = (
    selectedOption: ValueType<SelectIdentityOption>
  ): void => {
    if (!selectedOption) return
    const { history, selectIdentity } = this.props
    if ((selectedOption as SelectIdentityOption).value === 'create') {
      history.push('/wallet/add')
    } else {
      selectIdentity((selectedOption as SelectIdentityOption).value)
    }
  }

  public render(): JSX.Element {
    const { myIdentities, selectedIdentity } = this.props

    const identityOptions: SelectIdentityOption[] = myIdentities.map(
      (myIdentity: IMyIdentity) => ({
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
          name="selectIdentity"
          options={identityOptions}
          value={selectedOption}
          onChange={this.selectIdentity}
        />
      </section>
    )
  }
}

const mapStateToProps: MapStateToProps<StateProps, {}, ReduxState> = (
  state
) => ({
  myIdentities: Wallet.getAllIdentities(state),
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

const mapDispatchToProps: DispatchProps = {
  selectIdentity: (address: string) =>
    Wallet.Store.selectIdentityAction(address),
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(IdentitySelector))
