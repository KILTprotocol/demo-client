import * as React from 'react'

import './DelegationsView.scss'

type Props = {}

type State = {}

class DelegationsView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {}
  }

  public render() {
    return (
      <section className="DelegationsView">
        <h1>MY DELEGATIONS</h1>
      </section>
    )
  }
}

export default DelegationsView
