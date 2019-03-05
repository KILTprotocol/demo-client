import Immutable from 'immutable'
import { createSelector } from 'reselect'

import KiltAction from '../../types/Action'
import { State as ReduxState } from '../PersistentStore'

const DEFAULT_CHAIN_VERSION: string = '0.0.0'

interface Parameters {
  chainVersion: string
}

interface UpdateAction extends KiltAction {
  payload: Parameters
}

type Action = UpdateAction

type State = {
  parameters: Parameters
}

type ImmutableState = Immutable.Record<State>

type SerializedState = {
  parameters: Partial<Parameters>
}

class Store {
  public static serialize(state: ImmutableState) {
    const serialized: SerializedState = {
      parameters: {},
    }

    serialized.parameters = state.get('parameters')
    return serialized
  }

  public static deserialize(parameters: SerializedState): ImmutableState {
    if (!parameters) {
      return Store.createState({
        parameters: Store.getDefaults(),
      })
    }

    return Store.createState({
      parameters: parameters.parameters as Parameters,
    })
  }

  public static reducer(
    state: ImmutableState = Store.createState(),
    action: Action
  ): ImmutableState {
    switch (action.type) {
      case Store.ACTIONS.UPDATE_PARAMETERS: {
        return state.setIn(['parameters'], (action as UpdateAction).payload)
      }
      default:
        return state
    }
  }

  public static updateParameters(parameters: Parameters): UpdateAction {
    return {
      payload: parameters,
      type: Store.ACTIONS.UPDATE_PARAMETERS,
    }
  }

  public static createState(obj?: State): ImmutableState {
    return Immutable.Record({
      parameters: Store.getDefaults(),
    } as State)(obj)
  }

  private static ACTIONS = {
    UPDATE_PARAMETERS: 'parameters/UPDATE_PARAMETERS',
  }

  private static getDefaults(): Parameters {
    return {
      chainVersion: DEFAULT_CHAIN_VERSION,
    } as Parameters
  }
}

const _getParameters = (state: ReduxState) => {
  return state.parameters
    ? state.parameters.get('parameters')
    : ({} as Parameters)
}

const getParameters = createSelector(
  [_getParameters],
  (parameters: Parameters) => parameters
)

export {
  Store,
  ImmutableState,
  SerializedState,
  Action,
  getParameters,
  DEFAULT_CHAIN_VERSION,
}
