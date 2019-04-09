import React from 'react'

import FeedbackService from '../../services/FeedbackService'
import { BsAttestation, BsAttestationsPool } from './DevTools.attestations'
import { BsClaim } from './DevTools.claims'
import { BsCType } from './DevTools.ctypes'
import { BsDelegation } from './DevTools.delegations'
import { BsIdentity } from './DevTools.wallet'

type Props = {}

class DevTools extends React.Component<Props> {
  constructor(props: Props) {
    super(props)

    this.bootstrapAll = this.bootstrapAll.bind(this)
  }

  public render() {
    const withMessages: string[] = ['With messages', 'Without messages']

    return (
      <section className="DevTools">
        <h2>Dev Tools</h2>

        <div>
          <div>
            <h4>Auto Bootstrap</h4>
            {withMessages.map((_withMessages: string, index: number) => (
              <button
                key={_withMessages}
                onClick={this.bootstrapAll.bind(this, !!index)}
              >
                {_withMessages}
              </button>
            ))}
          </div>
          {withMessages.map((_withMessages: string, index: number) => (
            <div key={_withMessages}>
              <h4>{`Manual Bootstrap ${_withMessages}`}</h4>
              <button onClick={this.bootstrapIdentities.bind(this, !!index)}>
                Identities
              </button>
              <button onClick={this.bootstrapCTypes.bind(this, !!index)}>
                CTypes
              </button>
              <button onClick={this.bootstrapDelegations.bind(this, !!index)}>
                Delegations
              </button>
              <button onClick={this.bootstrapPCRs.bind(this, !!index)}>
                PCRs
              </button>
              <button onClick={this.bootstrapClaims.bind(this, !!index)}>
                Claims
              </button>
              <button onClick={this.bootstrapAttestations.bind(this, !!index)}>
                Attestations
              </button>
            </div>
          ))}
        </div>
      </section>
    )
  }

  private async bootstrapIdentities(withMessages = false) {
    const blockUi = FeedbackService.addBlockUi({
      headline: 'Creating identity',
    })

    await BsIdentity.createPool((alias: string) => {
      blockUi.updateMessage(`Building identity: ${alias}`)
    }).then(() => {
      blockUi.remove()
    })
  }

  private async bootstrapCTypes(withMessages = false) {
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

    await BsDelegation.create(false, (delegationAlias: string) => {
      blockUi.updateMessage(`creating delegation: ${delegationAlias}`)
    }).then(() => {
      blockUi.remove()
    })
  }

  private async bootstrapPCRs(withMessages = false) {
    const blockUi = FeedbackService.addBlockUi({
      headline: 'Creating PCRs',
    })

    await BsDelegation.create(true, (delegationAlias: string) => {
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

  private async bootstrapAttestations() {
    const blockUi = FeedbackService.addBlockUi({
      headline: 'Creating legitimations & attestations',
    })

    await BsAttestation.create((attestationKey: keyof BsAttestationsPool) => {
      blockUi.updateMessage(`creating claim: ${attestationKey}`)
    }).then(() => {
      blockUi.remove()
    })
  }

  private async bootstrapAll() {
    await this.bootstrapIdentities()
    await this.bootstrapCTypes()
    await this.bootstrapClaims()
    await this.bootstrapDelegations()
  }
}

export default DevTools
