import * as React from 'react'
import { BalanceUtilities } from '../../services/BalanceUtilities'

import './KiltToken.scss'

type Props = {
  amount?: number
  colored?: boolean
  decimalPlaces?: number
}

type State = {}

class KiltToken extends React.Component<Props, State> {
  public static defaultProps = {
    colored: false,
    decimalPlaces: 2,
  }

  public render() {
    const { amount, colored, decimalPlaces } = this.props

    if (amount == null || !decimalPlaces) {
      return <section className="KiltToken" />
    }

    const classes = [
      'KiltToken',
      colored ? 'colored' : '',
      amount < 0 ? 'decreased' : amount > 0 ? 'increased' : '',
    ]

    return (
      <section className={classes.join(' ')} title={`${amount}`}>
        {amount.toFixed(decimalPlaces)}
      </section>
    )
  }
}

export default KiltToken
