import React, { Component } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import Spinner from '../../components/Spinner/Spinner'
import * as UiState from '../../state/ducks/UiState'
import { State as ReduxState } from '../../state/PersistentStore'
import { BlockUi as IBlockUi } from '../../types/UserFeedback'

import './BlockUi.scss'

type StateProps = {
  blockUis: IBlockUi[]
}

type Props = StateProps

class BlockUi extends Component<Props> {
  private static getBlockUi(blockUi: IBlockUi): JSX.Element {
    return (
      <div key={blockUi.id} className="blockUi">
        {blockUi.headline && <header>{blockUi.headline}</header>}
        {blockUi.message && <div>{blockUi.message}</div>}
      </div>
    )
  }

  public render(): JSX.Element | '' {
    const { blockUis } = this.props

    return !!blockUis && !!blockUis.length ? (
      <section className="BlockUi">
        <div className="backdrop" />
        <div className="container">
          {blockUis.map((blockUi: IBlockUi) => BlockUi.getBlockUi(blockUi))}
        </div>
        <div className="Spinner">
          <Spinner size={64} strength={8} color="#fff" />
        </div>
      </section>
    ) : (
      ''
    )
  }
}

const mapStateToProps: MapStateToProps<StateProps, {}, ReduxState> = state => ({
  blockUis: UiState.getBlockUis(state),
})

export default connect(mapStateToProps)(BlockUi)
