import Immutable from 'immutable'
import { createSelector } from 'reselect'

import KiltAction from '../../types/Action'
import { ICType, ICTypeWithMetadata } from '../../types/Ctype'
import { State as ReduxState } from '../PersistentStore'

interface IAddCTypeAction extends KiltAction {
  payload: ICTypeWithMetadata
}

interface IAddCTypesAction extends KiltAction {
  payload: ICTypeWithMetadata[]
}

export type Action = IAddCTypeAction | IAddCTypesAction

type State = {
  cTypes: Immutable.Map<ICType['cType']['hash'], ICTypeWithMetadata>
}

export type ImmutableState = Immutable.Record<State>

const arrayToMap = (
  cTypeArray: ICTypeWithMetadata[]
): Immutable.Map<ICType['cType']['hash'], ICTypeWithMetadata> => {
  const cTypes: { [hash: string]: ICTypeWithMetadata } = {}
  cTypeArray.forEach((cType: ICTypeWithMetadata) => {
    const { hash } = cType.cType
    if (hash) {
      cTypes[hash] = cType
    }
  })
  return Immutable.Map(cTypes)
}

class Store {
  public static reducer(
    state: ImmutableState = Store.createState(),
    action: Action
  ): ImmutableState {
    switch (action.type) {
      case Store.ACTIONS.ADD_CTYPE: {
        const cType = (action as IAddCTypeAction).payload
        const { hash } = cType.cType
        return state.setIn(['cTypes', hash], cType)
      }
      case Store.ACTIONS.ADD_CTYPES: {
        const cTypes = arrayToMap((action as IAddCTypesAction).payload)
        const currentCTypes = state.getIn(['cTypes'])
        return state.setIn(['cTypes'], currentCTypes.mergeDeep(cTypes))
      }
      default:
        return state
    }
  }

  public static addCType(cType: ICTypeWithMetadata): IAddCTypeAction {
    return {
      payload: cType,
      type: Store.ACTIONS.ADD_CTYPE,
    }
  }

  public static addCTypes(cTypes: ICTypeWithMetadata[]): IAddCTypesAction {
    return {
      payload: cTypes,
      type: Store.ACTIONS.ADD_CTYPES,
    }
  }

  public static createState(obj?: State): ImmutableState {
    return Immutable.Record({
      cTypes: Immutable.Map<ICType['cType']['hash'], ICTypeWithMetadata>(),
    } as State)(obj)
  }

  private static ACTIONS = {
    ADD_CTYPE: 'ctypes/ADD_CTYPE',
    ADD_CTYPES: 'ctypes/ADD_CTYPES',
  }
}

const getStateCTypes = (state: ReduxState): ICTypeWithMetadata[] => {
  return state.cTypes
    .get('cTypes')
    .toList()
    .toArray()
}

const getCTypes = createSelector(
  [getStateCTypes],
  (cTypes: ICTypeWithMetadata[]) => cTypes
)

const getStateCType = (
  state: ReduxState,
  address: ICType['cType']['hash']
): ICTypeWithMetadata | undefined => state.cTypes.get('cTypes').get(address)

const getCType = createSelector(
  [getStateCType],
  (cType: ICTypeWithMetadata) => cType
)

export { Store, getCTypes, getCType }
