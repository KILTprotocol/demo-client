import React from 'react'
import { BalanceUtilities } from '../../services/BalanceUtilities'
import CheckClientVersion from '../../components/CheckClientVersion/CheckClientVersion'
import * as UiState from '../../state/ducks/UiState'
import { persistentStoreInstance } from '../../state/PersistentStore'

export default class InitialSetup extends React.Component {
  public componentDidMount(): void {
    BalanceUtilities.connectMyIdentities()
  }

  public componentDidUpdate(): void {
    // removes a maybe open task modal after routing
    const currentTask = UiState.getCurrentTask(
      persistentStoreInstance.store.getState()
    )
    if (currentTask && currentTask.objective) {
      persistentStoreInstance.store.dispatch(
        UiState.Store.updateCurrentTaskAction({
          objective: undefined,
          props: undefined,
        })
      )
    }
  }

  public render(): JSX.Element {
    return <CheckClientVersion />
  }
}
