import React from 'react'
import { QRCode } from 'react-qrcode-logo'
import { IDelegationBaseNode, PublicIdentity } from '@kiltprotocol/sdk-js'

import logo from '../../assets/kilt_small.svg'
import encodePublicIdentity from '../../utils/PublicIdentity/Encoding'
import { IMyDelegation } from '../../state/ducks/Delegations'

type Props = {
  delegation: IMyDelegation
}

const QRCodeDelegationID: React.FunctionComponent<Props> = ({ delegation }) => {
  const formattedDelegationID = JSON.stringify(delegation.id)
  //   encodePublicIdentity(delegation.account) +
  return (
    <QRCode
      size={150}
      logoImage={logo}
      logoWidth={44}
      logoHeight={44}
      fgColor="#751869"
      quietZone={4}
      qrStyle="dots"
      value={formattedDelegationID}
    />
  )
}

export default QRCodeDelegationID
