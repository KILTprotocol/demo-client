import * as React from 'react'

import './KiltToken.scss'
import BalanceUtilities from '../../services/BalanceUtilities'

type Props = {
  amount?: number
  colored?: boolean
  decimalPlaces?: number
  displayRatio?: number
}

type State = {}

class KiltToken extends React.Component<Props, State> {
  public static defaultProps = {
    colored: false,
    decimalPlaces: 2,
    displayRatio: 1 / 1000000,
  }

  public render() {
    const { amount, colored, decimalPlaces, displayRatio } = this.props

    if (!amount || !decimalPlaces || !displayRatio) {
      return <section className="KiltToken" />
    }

    const classes = [
      'KiltToken',
      colored ? 'colored' : '',
      amount < 0 ? 'decreased' : amount > 0 ? 'increased' : '',
    ]

    const displayAmount = BalanceUtilities.convertTokenForExternal(amount)

    return (
      <section className={classes.join(' ')} title={`${displayAmount}`}>
        {(
          Math.round(displayAmount * Math.pow(10, decimalPlaces)) /
          Math.pow(10, decimalPlaces)
        ).toFixed(decimalPlaces)}
      </section>
    )
  }
}

export default KiltToken
