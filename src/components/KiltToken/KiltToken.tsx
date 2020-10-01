import React, { useState } from 'react'
import BN from 'bn.js'
import './KiltToken.scss'
import { BalanceUtils } from '@kiltprotocol/sdk-js'

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
      {!isShown && BalanceUtils.formatKiltBalance(amount)}
      {isShown && <>{amount.toString()}</>}
    </section>
  )
}

export default KiltToken
