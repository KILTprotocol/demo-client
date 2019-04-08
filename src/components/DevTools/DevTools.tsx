import React from 'react'

import FeedbackService from '../../services/FeedbackService'
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
    return (
      <section className="TestUserFeedBack">
        <h2>Dev Tools</h2>

        <h4>Auto Bootstrap</h4>
        <button onClick={this.bootstrapAll}>Run</button>

        <h4>Manual Bootstrap</h4>
        <button onClick={this.bootstrapIdentities}>Identities</button>
        <button onClick={this.bootstrapCTypes}>CTypes</button>
        <button onClick={this.bootstrapDelegations}>Delegations</button>
        <button onClick={this.bootstrapPCRs}>PCRs</button>
        <button onClick={this.bootstrapClaims}>Claims</button>
        <button onClick={this.bootstrapLegitimations}>Legitimations</button>
        <button onClick={this.bootstrapAttestations}>Attestations</button>
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

  private async bootstrapDelegations() {
    const blockUi = FeedbackService.addBlockUi({
      headline: 'Creating delegations',
    })

    await BsDelegation.create(false, (delegationAlias: string) => {
      blockUi.updateMessage(`creating delegation: ${delegationAlias}`)
    }).then(() => {
      blockUi.remove()
    })
  }

  private async bootstrapPCRs() {
    const blockUi = FeedbackService.addBlockUi({
      headline: 'Creating PCRs',
    })

    await BsDelegation.create(true, (delegationAlias: string) => {
      blockUi.updateMessage(`creating PCR: ${delegationAlias}`)
    }).then(() => {
      blockUi.remove()
    })
  }

  private async bootstrapClaims() {
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

  private async bootstrapLegitimations() {
    // Legitimations
  }

  private async bootstrapAttestations() {
    // attestations
  }

  private async bootstrapAll() {
    await this.bootstrapIdentities()
    await this.bootstrapCTypes()
    await this.bootstrapClaims()
    await this.bootstrapDelegations()
  }
}

export default DevTools
