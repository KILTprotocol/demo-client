import * as sdk from '@kiltprotocol/sdk-js'
import React from 'react'

import Code from '../Code/Code'
import ContactPresentation from '../ContactPresentation/ContactPresentation'

import './ClaimDetailView.scss'
import CTypePresentation from '../CTypePresentation/CTypePresentation'

type Props = {
  claim: sdk.IPartialClaim
}

const ClaimDetailView: React.FC<Props> = ({ claim }) => (
  <section className="ClaimDetailView">
    <h2>Claim details</h2>
    <div>
      <label>Ctype</label>
      <div>
        <CTypePresentation cTypeHash={claim.cTypeHash} linked interactive />
      </div>
    </div>
    {claim.owner && (
      <div>
        <label>Owner</label>
        <div>
          <ContactPresentation address={claim.owner} interactive />
        </div>
      </div>
    )}
    {claim.contents && (
      <div>
        <label>Contents</label>
        <div>
          <Code>{claim.contents}</Code>
        </div>
      </div>
    )}
  </section>
)

export default ClaimDetailView
