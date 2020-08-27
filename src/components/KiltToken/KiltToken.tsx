import React from 'react'
import { formatBalance } from '@polkadot/util'
import './KiltToken.scss'

type Props = {
  amount?: number
  colored?: boolean
}

const KiltToken: React.FC<Props> = ({ amount, colored = false }) => {
  if (amount == null) {
    return <section className="KiltToken" />
  }

  let changeIndicator = ''
  if (amount < 0) changeIndicator = 'decreased'
  if (amount > 0) changeIndicator = 'increased'

  const classes = ['KiltToken', colored ? 'colored' : '', changeIndicator]

  return (
    <section className={classes.join(' ')} title={`${amount}`}>
      {formatBalance(amount, {
        withSiFull: true,
        withUnit: 'KILT',
      })}
    </section>
  )
}

export default KiltToken
