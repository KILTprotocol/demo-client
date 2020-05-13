import React from 'react'
import { QRCode } from 'react-qrcode-logo'
import { IPublicIdentity } from '@kiltprotocol/sdk-js'

import logo from '../../assets/kilt_small.svg'
import { encodePublicIdentity } from '../../utils/PublicIdentity/Encoding'

type Props = {
  publicIdentity: IPublicIdentity
}

const QRCodePublicIdentity: React.FunctionComponent<Props> = ({
  publicIdentity,
}) => {
  const formattedPublicIdentity = JSON.stringify(
    encodePublicIdentity(publicIdentity)
  )
  return (
    // the public identity needs to be encoded in order to fit in a scannable QR Code
    <QRCode
      size={200}
      logoImage={logo}
      logoWidth={44}
      logoHeight={44}
      fgColor="#751869"
      quietZone={4}
      qrStyle="dots"
      value={formattedPublicIdentity}
    />
  )
}

export default QRCodePublicIdentity
