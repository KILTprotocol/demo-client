import * as React from 'react'
import { ComponentType } from 'react'

import * as UiState from '../state/ducks/UiState'
import PersistentStore from '../state/PersistentStore'

const onAfterRouting = (WrappedComponent: ComponentType) => {
  return () => {
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
    return <WrappedComponent />
  }
}

export default onAfterRouting
