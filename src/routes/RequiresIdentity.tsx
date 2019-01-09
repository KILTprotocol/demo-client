import * as React from 'react'
import { ComponentType } from 'react'
import { connect } from 'react-redux'

import Loading from '../components/Loading/Loading'
import NoIdentities from '../components/NoIdentities/NoIdentities'
import NoSelectedIdentity from '../components/NoSelectedIdentity/NoSelectedIdentity'
import * as Wallet from '../state/ducks/Wallet'

type Props = {
  identities?: Wallet.Entry[]
  selectedIdentity?: Wallet.Entry
}

type State = {}

const mapStateToProps = (state: { wallet: Wallet.ImmutableState }) => {
  return {
    identities: state.wallet
      .get('identities')
      .toList()
      .toArray(),
    selectedIdentity: state.wallet.get('selected'),
  }
}

const requiresIdentity = (WrappedComponent: ComponentType) => {
  return connect(mapStateToProps)(
    class extends React.Component<Props, State> {
      constructor(props: Props) {
        super(props)
        this.state = {}
      }

      public render() {
        const { identities, selectedIdentity } = this.props
        switch (true) {
          case !identities || !identities.length:
            return <NoIdentities />
          case !selectedIdentity:
            return <NoSelectedIdentity />
          case !!identities && !!identities.length && !!selectedIdentity:
            return <WrappedComponent />
          default:
            return <Loading />
        }
      }
    }
  )
}

export default requiresIdentity
