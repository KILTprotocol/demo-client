import * as React from 'react'

import ChainStats from '../ChainStats/ChainStats'
import TestUserFeedback from '../TestUserFeedback/TestUserFeedback'

import './Utilities.scss'

type Props = {}
type State = {}

class Utilities extends React.Component<Props, State> {
  public render() {
    return (
      <section className="Utilities">
        <h1>Utilities</h1>
        <ChainStats />
        <TestUserFeedback />
      </section>
    )
  }
}

export default Utilities
