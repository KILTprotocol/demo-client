import React from 'react'

import FeedbackService from '../../services/FeedbackService'
import { BsAttestation, BsAttestationsPool } from './DevTools.attestations'
import { BsClaim } from './DevTools.claims'
import { BsCType } from './DevTools.ctypes'
import { BsDelegation } from './DevTools.delegations'
import { BsIdentity } from './DevTools.wallet'

type WithMessages = {
  label: string
  with: boolean
}

type Props = {}

class DevTools extends React.Component<Props> {
  public render() {
    const withMessages: WithMessages[] = [
      { label: 'Without messages', with: false },
      { label: 'With messages', with: true },
    ]

    return (
      <section className="DevTools">
        <h2>Dev Tools</h2>

        <div>
          <div>
            <h4>Auto Bootstrap</h4>
            {withMessages.map((messages: WithMessages) => (
              <button
                key={messages.label}
                onClick={this.bootstrapAll.bind(this, messages.with)}
              >
                {messages.label}
              </button>
            ))}
          </div>
          {withMessages.map((messages: WithMessages) => (
            <div key={messages.label}>
              <h4>{`Manual Bootstrap ${messages.label}`}</h4>
              <button onClick={this.bootstrapIdentities}>Identities</button>
              <button onClick={this.bootstrapCTypes}>CTypes</button>
              <button
                onClick={this.bootstrapDelegations.bind(this, messages.with)}
              >
                Delegations
              </button>
              <button onClick={this.bootstrapPCRs.bind(this, messages.with)}>
                PCRs
              </button>
              <button onClick={this.bootstrapClaims.bind(this, messages.with)}>
                Claims
              </button>
              <button
                onClick={this.bootstrapAttestations.bind(this, messages.with)}
              >
                Attestations
              </button>
            </div>
          ))}
        </div>
      </section>
    )
  }

  private async bootstrapIdentities() {
    const blockUi = FeedbackService.addBlockUi({
      headline: 'Creating identity',
    })

    await BsIdentity.createPool((alias: string) => {
      blockUi.updateMessage(`Building identity: ${alias}`)
    }).then(() => {
      blockUi.remove()
    })
  }

  private async bootstrapCTypes() {
    const blockUi = FeedbackService.addBlockUi({
      headline: 'Creating ctypes',
    })

    await BsCType.savePool((cTypeTitle: string) => {
      blockUi.updateMessage(`building ctype: ${cTypeTitle}`)
    }).then(() => {
      blockUi.remove()
    })
  }

  private async bootstrapDelegations(withMessages = false) {
    const blockUi = FeedbackService.addBlockUi({
      headline: 'Creating delegations',
    })

    await BsDelegation.create(
      false,
      withMessages,
      (delegationAlias: string) => {
        blockUi.updateMessage(`creating delegation: ${delegationAlias}`)
      }
    ).then(() => {
      blockUi.remove()
    })
  }

  private async bootstrapPCRs(withMessages = false) {
    const blockUi = FeedbackService.addBlockUi({
      headline: 'Creating PCRs',
    })

    await BsDelegation.create(true, withMessages, (delegationAlias: string) => {
      blockUi.updateMessage(`creating PCR: ${delegationAlias}`)
    }).then(() => {
      blockUi.remove()
    })
  }

  private async bootstrapClaims(withMessages = false) {
    const blockUi = FeedbackService.addBlockUi({
      headline: 'Creating claims',
    })

    await BsClaim.savePool((claimAlias: string) => {
      blockUi.updateMessage(`creating claim: ${claimAlias}`)
    }).then(() => {
      blockUi.remove()
    })

    // const isOfficialClaim = await saveClaim(
    //   'IsOfficial',
    //   'RootAttesterIsOfficial',
    //   {},
    //   'RootAttester'
    // )
    //
    // const AttesterOfIsOfficial = BS_identity.getByAlias(BS_identityPool.ATTESTER_OF_IS_OFFICIAL)
    // const RootAttester = BS_identity.getByAlias(BS_identityPool.ROOT_ATTESTER)
    //
    // if (!isOfficialClaim || !RootAttester || !AttesterOfIsOfficial) {
    //   console.error("isOfficialClaim couldn't be created")
    //   return
    // }
    //
    // const { attestedClaim } = await attestationWorkflow(
    //   isOfficialClaim,
    //   RootAttester,
    //   AttesterOfIsOfficial
    // )
    //
    // blockUi.updateMessage('DriversLicense')
    //
    // const driversLicenseClaim = await BS_claim.save(
    //   'DriversLicense',
    //   'ClaimersDriversLicense',
    //   {
    //     age: 30,
    //     name: 'Claimer',
    //   },
    //   'Claimer'
    // )
    //
    // const Claimer = getIdentity('Claimer')
    //
    // if (!driversLicenseClaim || !RootAttester || !Claimer) {
    //   console.error("driversLicenseClaim couldn't be created")
    //   return
    // }
    //
    // attestationWithLegitimationWorkflow(
    //   driversLicenseClaim,
    //   [attestedClaim],
    //   Claimer,
    //   RootAttester
    // )
    //
    // blockUi.remove()
  }

  private async bootstrapAttestations(withMessages = false) {
    const blockUi = FeedbackService.addBlockUi({
      headline: 'Creating legitimations & attestations',
    })

    await BsAttestation.create((attestationKey: keyof BsAttestationsPool) => {
      blockUi.updateMessage(`creating claim: ${attestationKey}`)
    }).then(() => {
      blockUi.remove()
    })
  }

  private async bootstrapAll(withMessages = false) {
    await this.bootstrapIdentities()
    await this.bootstrapCTypes()
    await this.bootstrapClaims(withMessages)
    await this.bootstrapDelegations(withMessages)
    await this.bootstrapAttestations(withMessages)
  }
}

export default DevTools
