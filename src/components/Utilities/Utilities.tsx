import * as React from 'react'

import ChainStats from '../ChainStats/ChainStats'
import TestUserFeedback from '../TestUserFeedback/TestUserFeedback'

import sdkPackage from '@kiltprotocol/prototype-sdk/package.json'
import clientPackage from '../../../package.json'

import './Utilities.scss'

type Props = {}
type State = {}

class Utilities extends React.Component<Props, State> {
  public render() {
    return (
      <section className="Utilities">
        <h1>Utilities</h1>
        <section className="versions">
          <h2>Versions</h2>
          <div>
            <label>Client</label>
            <div>{clientPackage.version}</div>
          </div>
          <div>
            <label>SDK</label>
            <div>{sdkPackage.version}</div>
          </div>
        </section>
        <ChainStats />
        <TestUserFeedback />
      </section>
    )
  }
}

export default Utilities
