import React from 'react'

import './KiltToken.scss'

type Props = {
  amount?: number
  colored?: boolean
  decimalPlaces?: number
}

const KiltToken: React.FC<Props> = ({
  amount,
  colored = false,
  decimalPlaces = 2,
}) => {
  if (amount == null || !decimalPlaces) {
    return <section className="KiltToken" />
  }

  let changeIndicator = ''
  if (amount < 0) changeIndicator = 'decreased'
  if (amount > 0) changeIndicator = 'increased'

  const classes = ['KiltToken', colored ? 'colored' : '', changeIndicator]

  return (
    <section className={classes.join(' ')} title={`${amount}`}>
      {amount.toFixed(decimalPlaces)}
    </section>
  )
}

export default KiltToken
