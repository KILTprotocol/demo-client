import React from 'react'
import BN from 'bn.js'

import './KiltToken.scss'

type Props = {
  amount?: BN
  colored?: boolean
  decimalPlaces?: number
}

export const denominations = [
  { power: 0, text: 'femto', value: 'f' },
  { power: 3, text: 'pico', value: 'p' },
  { power: 6, text: 'nano', value: 'n' },
  { power: 9, text: 'micro', value: 'µ' },
  { power: 12, text: 'milli', value: 'm' },
  { power: 15, text: 'Unit', value: '-' }, // position 8
  { power: 18, text: 'Kilo', value: 'k' },
  { power: 21, text: 'Mega', value: 'M' },
  { power: 24, text: 'Giga', value: 'G' },
  { power: 27, text: 'Tera', value: 'T' },
  { power: 30, text: 'Peta', value: 'P' },
  { power: 33, text: 'Exa', value: 'E' },
  { power: 36, text: 'Zeta', value: 'Z' },
  { power: 39, text: 'Yotta', value: 'Y' },
]

function autoDenominationSetter(current: BN): string {
  const absolateInt = current.abs().toString()
  const charLength = Number(absolateInt.length)

  const demonination = denominations[Math.floor(charLength / 3)]
  const pre = absolateInt.substring(
    charLength - demonination.power + 1,
    -charLength
  )

  const after = absolateInt.substring(
    charLength - demonination.power + 1,
    charLength - demonination.power + 4
  )

  return `${pre}.${after} ${demonination.text}`
}

const KiltToken: React.FC<Props> = ({
  amount,
  colored = false,
  decimalPlaces = 3,
}) => {
  if (amount == null || !decimalPlaces) {
    return <section className="KiltToken" />
  }

  let changeIndicator = ''
  if (amount.ltn(0)) changeIndicator = 'decreased'
  if (amount.gtn(0)) changeIndicator = 'increased'

  const classes = ['KiltToken', colored ? 'colored' : '', changeIndicator]
  const a = new BN(amount)
  const denominate = autoDenominationSetter(a)
  return (
    <section className={classes.join(' ')} title={`${denominate}`}>
      {denominate}
    </section>
  )
}

export default KiltToken
