import * as React from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'

import Dashboard from '../components/Dashboard/Dashboard'
import Imprint from '../components/Imprint/Imprint'
import PrivacyPolicy from '../components/PrivacyPolicy/PrivacyPolicy'
import TermsOfUse from '../components/TermsOfUse/TermsOfUse'
import Utilities from '../components/Utilities/Utilities'
import AttestationsView from '../containers/AttestationsView/AttestationsView'
import DelegationsView from '../containers/DelegationsView/DelegationsView'
import ClaimCreate from '../containers/ClaimCreate/ClaimCreate'
import ClaimView from '../containers/ClaimView/ClaimView'
import ContactList from '../containers/ContactList/ContactList'
import CTypeCreate from '../containers/CtypeCreate/CtypeCreate'
import CtypeView from '../containers/CtypeView/CtypeView'
import MessageList from '../containers/MessageView/MessageView'
import WalletAdd from '../containers/WalletAdd/WalletAdd'
import WalletView from '../containers/WalletView/WalletView'
import onAfterRouting from './onAfterRouting'
import requiresIdentity from './RequiresIdentity'
import CheckClientVersion from '../components/CheckClientVersion/CheckClientVersion'
import DelegationCreate from '../containers/DelegationCreate/DelegationCreate'

const Routes: React.FunctionComponent<{}> = props => {
  // const bbqBirch = encodeURIComponent('wss://substrate-rpc.parity.io/')

  return (
    <React.Fragment>
      <Route path={'/'} component={onAfterRouting(CheckClientVersion)} />
      <Switch>
        <Route path={'/dashboard'} component={requiresIdentity(Dashboard)} />

        <Route path={'/contacts'} component={requiresIdentity(ContactList)} />

        <Route path={'/messages'} component={requiresIdentity(MessageList)} />
        <Route
          path={'/messages/:messageId'}
          component={requiresIdentity(MessageList)}
        />

        <Route path={'/wallet/add'} component={WalletAdd} />
        <Route path={'/wallet'} component={WalletView} />

        <Route path={'/ctype/new'} component={requiresIdentity(CTypeCreate)} />
        <Route
          path={'/ctype/:cTypeHash'}
          component={requiresIdentity(CtypeView)}
        />
        <Route path={'/ctype'} component={requiresIdentity(CtypeView)} />

        <Route
          path={'/claim/new/:cTypeHash'}
          component={requiresIdentity(ClaimCreate)}
        />
        <Route
          path={'/claim/:claimId'}
          component={requiresIdentity(ClaimView)}
        />
        <Route path={'/claim'} component={requiresIdentity(ClaimView)} />

        <Route path={'/utilities'} component={Utilities} />

        <Route
          path={'/attestations'}
          component={requiresIdentity(AttestationsView)}
        />

        <Route
          path={'/delegations/new/:cTypeHash'}
          component={requiresIdentity(DelegationCreate, { isPCR: false })}
        />
        <Route
          path={'/delegations/:delegationId'}
          component={requiresIdentity(DelegationsView, { isPCR: false })}
        />
        <Route
          path={'/delegations'}
          component={requiresIdentity(DelegationsView, { isPCR: false })}
        />

        <Route
          path={'/pcrs/new/:cTypeHash'}
          component={requiresIdentity(DelegationCreate, { isPCR: true })}
        />
        <Route
          path={'/pcrs/:delegationId'}
          component={requiresIdentity(DelegationsView, { isPCR: true })}
        />
        <Route
          path={'/pcrs'}
          component={requiresIdentity(DelegationsView, { isPCR: true })}
        />

        <Route path={'/imprint'} component={Imprint} />
        <Route path={'/privacy-policy'} component={PrivacyPolicy} />
        <Route path={'/terms-of-use'} component={TermsOfUse} />

        <Redirect to="/dashboard" />
      </Switch>
    </React.Fragment>
  )
}

export default Routes
