import React from 'react'
import { BalanceUtilities } from '../../services/BalanceUtilities'
import CheckClientVersion from '../../components/CheckClientVersion/CheckClientVersion'
import * as UiState from '../../state/ducks/UiState'
import PersistentStore from '../../state/PersistentStore'

export default class InitialSetup extends React.Component {
  public componentDidMount() {
    BalanceUtilities.connectMyIdentities()
  }

  public componentDidUpdate() {
    // removes a maybe open task modal after routing
    const currentTask = UiState.getCurrentTask(PersistentStore.store.getState())
    if (currentTask && currentTask.objective) {
      PersistentStore.store.dispatch(
        UiState.Store.updateCurrentTaskAction({
          objective: undefined,
          props: undefined,
        })
      )
    }
  }

  public render() {
    return <CheckClientVersion />
  }
}
