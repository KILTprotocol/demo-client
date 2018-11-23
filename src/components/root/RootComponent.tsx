import { Demo } from '@kiltprotocol/prototype-sdk'
import * as React from 'react'

class RootComponent extends React.Component {
  public render() {
    return (
      <div>
        <h1>Welcome to KILT Prototype Client</h1>
        The SDK says: {new Demo().hello()}
      </div>
    )
  }
}

export default RootComponent
