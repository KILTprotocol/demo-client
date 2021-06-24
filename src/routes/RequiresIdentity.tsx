import React, { ComponentType } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import Loading from '../components/Loading/Loading'
import NoIdentities from '../components/NoIdentities/NoIdentities'
import NoSelectedIdentity from '../components/NoSelectedIdentity/NoSelectedIdentity'
import * as Wallet from '../state/ducks/Wallet'
import { State as ReduxState } from '../state/PersistentStore'

type StateProps = {
  identities?: Wallet.Entry[]
  selectedIdentity?: Wallet.Entry
}

type Props = StateProps

const mapStateToProps: MapStateToProps<StateProps, {}, ReduxState> = (
  state
) => ({
  identities: Wallet.getAllIdentities(state),
  selectedIdentity: Wallet.getSelectedIdentity(state),
})

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const requiresIdentity = (
  WrappedComponent: ComponentType<any>,
  additionalProps?: { [key: string]: any }
) => {
  return connect(mapStateToProps)((props: Props) => {
    const { identities, selectedIdentity } = props
    switch (true) {
      case !identities || !identities.length:
        return <NoIdentities />
      case !selectedIdentity:
        return <NoSelectedIdentity />
      case !!identities && !!identities.length && !!selectedIdentity:
        return <WrappedComponent {...additionalProps} />
      default:
        return <Loading />
    }
  })
}

export default requiresIdentity
