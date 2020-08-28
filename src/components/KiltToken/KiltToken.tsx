import React, { useState } from 'react'
import { formatBalance } from '@polkadot/util'
import BN from 'bn.js'
import './KiltToken.scss'

type Props = {
  amount?: BN
  colored?: boolean
}

const KiltToken: React.FC<Props> = ({ amount, colored = false }) => {
  const [isShown, setIsShown] = useState(false)

  if (amount == null) {
    return <section className="KiltToken" />
  }

  let changeIndicator = ''
  if (amount.ltn(0)) changeIndicator = 'decreased'
  if (amount.gtn(0)) changeIndicator = 'increased'

  const classes = ['KiltToken', colored ? 'colored' : '', changeIndicator]

  return (
    <section
      className={classes.join(' ')}
      title={`${amount}`}
      onMouseEnter={() => setIsShown(true)}
      onMouseLeave={() => setIsShown(false)}
    >
      {!isShown &&
        formatBalance(amount, {
          withSiFull: true,
          withUnit: 'KILT',
        })}
      {isShown && <>{amount.toNumber().toFixed(2)}</>}
    </section>
  )
}

export default KiltToken
