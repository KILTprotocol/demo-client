import React from 'react'

import BN from 'bn.js'
import { BalanceUtils } from '@kiltprotocol/sdk-js'
import setupAndDelegate from './DevTools.anticov'
import { ENDOWMENT, MIN_BALANCE } from '../../services/BalanceUtilities'
import FeedbackService from '../../services/FeedbackService'
import KiltToken from '../KiltToken/KiltToken'
import { BsAttestation, BsAttestationsPool } from './DevTools.attestations'
import { BsClaim, BsClaimsPool } from './DevTools.claims'
import { BsCType, BsCTypesPool } from './DevTools.ctypes'
import { BsDelegation, BsDelegationsPool } from './DevTools.delegations'
import { BsIdentitiesPool, BsIdentity } from './DevTools.wallet'
import * as Wallet from '../../state/ducks/Wallet'
import * as Balances from '../../state/ducks/Balances'
import { persistentStoreInstance } from '../../state/PersistentStore'
import { IMyIdentity } from '../../types/Contact'
import identitiesPool from './data/identities.json'

type WithMessages = {
  label: string
  with: boolean
}

type Props = {}

class DevTools extends React.Component<Props> {
  private static async bootstrapIdentities(): Promise<void> {
    const blockUi = FeedbackService.addBlockUi({
      headline: 'Creating identities',
    })

    await BsIdentity.createPool((bsIdentityKey: keyof BsIdentitiesPool) => {
      blockUi.updateMessage(`Creating: ${bsIdentityKey}`)
    }).then(() => {
      blockUi.remove()
    })
  }

  private static async bootstrapCTypes(): Promise<void> {
    const blockUi = FeedbackService.addBlockUi({
      headline: 'Creating cTypes',
    })

    await BsCType.savePool((bsCTypeKey: keyof BsCTypesPool) => {
      blockUi.updateMessage(`Creating: ${bsCTypeKey}`)
    }).then(() => {
      blockUi.remove()
    })
  }

  private static async bootstrapClaims(): Promise<void> {
    const blockUi = FeedbackService.addBlockUi({
      headline: 'Creating claims',
    })

    await BsClaim.savePool((bsClaimKey: keyof BsClaimsPool) => {
      blockUi.updateMessage(`creating claim: ${bsClaimKey}`)
    }).then(() => {
      blockUi.remove()
    })
  }

  private static async bootstrapDelegations(
    withMessages = false
  ): Promise<void> {
    const blockUi = FeedbackService.addBlockUi({
      headline: 'Creating delegations',
    })

    await BsDelegation.create(
      false,
      withMessages,
      (bsDelegationKey: keyof BsDelegationsPool) => {
        blockUi.updateMessage(`Creating: ${bsDelegationKey}`)
      }
    ).then(() => {
      blockUi.remove()
    })
  }

  private static async bootstrapPCRs(withMessages = false): Promise<void> {
    const blockUi = FeedbackService.addBlockUi({
      headline: 'Creating PCRs',
    })

    await BsDelegation.create(
      true,
      withMessages,
      (bsDelegationKey: keyof BsDelegationsPool) => {
        blockUi.updateMessage(`Creating: ${bsDelegationKey}`)
      }
    ).then(() => {
      blockUi.remove()
    })
  }

  private static async bootstrapAttestations(
    withMessages = false
  ): Promise<void> {
    const blockUi = FeedbackService.addBlockUi({
      headline: 'Creating legitimations & attestations',
    })

    await BsAttestation.create(
      withMessages,
      (bsAttestationKey: keyof BsAttestationsPool) => {
        blockUi.updateMessage(`Creating: ${bsAttestationKey}`)
      }
    ).then(() => {
      blockUi.remove()
    })
  }

  private static async bootstrapAll(withMessages = false): Promise<void> {
    await DevTools.bootstrapIdentities()
    await DevTools.bootstrapCTypes()
    await DevTools.bootstrapClaims()
    await DevTools.bootstrapDelegations(withMessages)
    await DevTools.bootstrapPCRs(withMessages)
    await DevTools.bootstrapAttestations(withMessages)
  }

  public render(): JSX.Element {
    const withMessages: WithMessages[] = [
      { label: 'Without messages', with: false },
      { label: 'With messages', with: true },
    ]

    const selectedIdentity: IMyIdentity = Wallet.getSelectedIdentity(
      persistentStoreInstance.store.getState()
    )

    const balance: BN = selectedIdentity
      ? Balances.getBalance(
          persistentStoreInstance.store.getState(),
          selectedIdentity.identity.address
        )
      : new BN(0)

    const minBalanceForBootstrap = ENDOWMENT.add(BalanceUtils.TRANSACTION_FEE)
      .muln(Object.keys(identitiesPool).length)
      .add(MIN_BALANCE)

    return (
      <section className="DevTools">
        <h2>Dev Tools</h2>
        {selectedIdentity && balance.gt(minBalanceForBootstrap) ? (
          <div>
            <div>
              <h4>Auto Bootstrap</h4>
              {withMessages.map((messages: WithMessages) => (
                <button
                  type="button"
                  key={messages.label}
                  onClick={DevTools.bootstrapAll.bind(this, messages.with)}
                >
                  {messages.label}
                </button>
              ))}
            </div>
            <div>
              <h4>AntiCov Setup</h4>
              <button
                type="button"
                onClick={() => setupAndDelegate(selectedIdentity)}
              >
                AntiCov Delegation
              </button>
            </div>
            {withMessages.map((messages: WithMessages) => (
              <div key={messages.label}>
                <h4>{`Manual Bootstrap ${messages.label}`}</h4>
                <button type="button" onClick={DevTools.bootstrapIdentities}>
                  Identities
                </button>
                <button type="button" onClick={DevTools.bootstrapCTypes}>
                  CTypes
                </button>
                <button type="button" onClick={DevTools.bootstrapClaims}>
                  Claims
                </button>
                <button
                  type="button"
                  onClick={() => DevTools.bootstrapDelegations(messages.with)}
                >
                  Delegations
                </button>
                <button
                  type="button"
                  onClick={() => DevTools.bootstrapPCRs(messages.with)}
                >
                  PCRs
                </button>
                <button
                  type="button"
                  onClick={() => DevTools.bootstrapAttestations(messages.with)}
                >
                  Attestations
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div>
            To enable bootstrapping please select an identity with more than{' '}
            <KiltToken amount={minBalanceForBootstrap} />.
          </div>
        )}
      </section>
    )
  }
}

export default DevTools
