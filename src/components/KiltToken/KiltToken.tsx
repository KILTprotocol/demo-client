import React, { useState } from 'react'
import { formatBalance } from '@polkadot/util'
import './KiltToken.scss'

type Props = {
  amount?: number
  colored?: boolean
}

const KiltToken: React.FC<Props> = ({ amount, colored = false }) => {
  const [isShown, setIsShown] = useState(false)

  if (amount == null) {
    return <section className="KiltToken" />
  }

  let changeIndicator = ''
  if (amount < 0) changeIndicator = 'decreased'
  if (amount > 0) changeIndicator = 'increased'

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
      {isShown && <>{amount.toFixed(2)}</>}
    </section>
  )
}

export default KiltToken
