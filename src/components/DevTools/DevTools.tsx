import React from 'react'
import { ICType } from '@kiltprotocol/prototype-sdk'

import FeedbackService from '../../services/FeedbackService'

import { createIdentity } from './DevTools.wallet'
import { saveCtype } from './DevTools.ctypes'
import { saveClaim } from './DevTools.claims'
import {
  attestationWorkflow,
  attestationWithLegitimationWorkflow,
} from './DevTools.attestations'
import { getIdentity } from './DevTools.utils'

type Props = {}

type State = {}

class DevTools extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.bootstrapIdentities = this.bootstrapIdentities.bind(this)
    this.bootstrapCtypes = this.bootstrapCtypes.bind(this)
    this.bootstrapClaimsAndAttestations = this.bootstrapClaimsAndAttestations.bind(
      this
    )
  }

  public render() {
    return (
      <section className="TestUserFeedBack">
        <h2>Dev Tools</h2>

        <h4>Bootstrapping</h4>
        <button onClick={this.bootstrapIdentities}>Identities</button>
        <button onClick={this.bootstrapCtypes}>CTypes</button>
        <button onClick={this.bootstrapClaimsAndAttestations}>
          Claims & Attestations
        </button>
      </section>
    )
  }

  private async bootstrapClaimsAndAttestations() {
    const blockUi = FeedbackService.addBlockUi({
      headline: 'Creating claims and attestations',
      message: 'IsOfficial',
    })

    const isOfficialClaim = await saveClaim(
      'IsOfficial',
      'RootAttesterIsOfficial',
      {},
      'RootAttester'
    )

    const AttesterOfIsOfficial = getIdentity('AttesterOfIsOfficial')
    const RootAttester = getIdentity('RootAttester')

    if (!isOfficialClaim || !RootAttester || !AttesterOfIsOfficial) {
      console.error("isOfficialClaim couldn't be created")
      return
    }

    const { attestedClaim } = await attestationWorkflow(isOfficialClaim, RootAttester, AttesterOfIsOfficial)

    blockUi.updateMessage('DriversLicense')

    const driversLicenseClaim = await saveClaim(
      'DriversLicense',
      'ClaimersDriversLicense',
      {
        age: 30,
        name: 'Claimer',
      },
      'Claimer'
    )

    const Claimer = getIdentity('Claimer')

    if (!driversLicenseClaim || !RootAttester || !Claimer) {
      console.error("driversLicenseClaim couldn't be created")
      return
    }

    attestationWithLegitimationWorkflow(
      driversLicenseClaim,
      [attestedClaim],
      Claimer,
      RootAttester
    )

    blockUi.remove()
  }

  private async bootstrapCtypes() {
    const blockUi = FeedbackService.addBlockUi({
      headline: 'Creating ctypes',
      message: 'building ctype: DriversLicense',
    })

    const driversLicenseCtype = {
      schema: {
        $id: 'DriversLicense',
        $schema: 'http://kilt-protocol.org/draft-01/ctype#',
        properties: {
          name: {
            type: 'string',
          },
          age: {
            type: 'integer',
          },
        },
        type: 'object',
      },
      metadata: {
        title: {
          default: 'DriversLicense',
        },
        description: {},
        properties: {
          name: {
            title: {
              default: 'name',
            },
          },
          age: {
            title: {
              default: 'age',
            },
          },
        },
      },
      hash:
        '0x5a9d939af9fb5423e3e283f16996438da635de8dc152b13d3a67f01e3d6b0fc0',
    } as ICType

    const isOfficialCtype = {
      schema: {
        $id: 'IsOfficial',
        $schema: 'http://kilt-protocol.org/draft-01/ctype#',
        properties: {},
        type: 'object',
      },
      metadata: {
        title: {
          default: 'IsOfficial',
        },
        description: {},
        properties: {},
      },
      hash:
        '0xa7d8f30a154328e4c9e90b9f471f028eafb130e7405d5ca66defa4a59f4c31b5',
    } as ICType

    saveCtype(driversLicenseCtype, 'RootAttester')
      .then(() => {
        blockUi.updateMessage('buildind ctype: IsOfficial')
        return saveCtype(isOfficialCtype, 'AttesterOfIsOfficial')
      })
      .then(() => {
        blockUi.remove()
      })
      .catch(e => {
        console.error(e)
        blockUi.remove()
      })
  }

  private async bootstrapIdentities() {
    const blockUi = FeedbackService.addBlockUi({
      headline: 'Creating identity',
      message: 'building Identity: Claimer',
    })

    createIdentity('Claimer')
      .then(() => {
        const alias = 'RootAttester'
        blockUi.updateMessage(`building Identity: ${alias}`)
        return createIdentity(alias)
      })
      .then(() => {
        const alias = 'AttesterOfIsOfficial'
        blockUi.updateMessage(`building Identity: ${alias}`)
        return createIdentity(alias)
      })
      .then(() => {
        const alias = 'Department'
        blockUi.updateMessage(`building Identity: ${alias}`)
        return createIdentity(alias)
      })
      .then(() => {
        const alias = 'Employee'
        blockUi.updateMessage(`building Identity: ${alias}`)
        return createIdentity(alias)
      })
      .then(() => {
        const alias = 'Verifier'
        blockUi.updateMessage(`building Identity: ${alias}`)
        return createIdentity(alias)
      })
      .then(() => {
        blockUi.remove()
      })
  }
}

export default DevTools
