import * as React from 'react'

import Navigation from '../Navigation/Navigation'

import './Root.scss'

class Root extends React.Component {
  public render() {
    return (
      <section className="Root">
        <Navigation />
      </section>
    )
  }
}

export default Root
