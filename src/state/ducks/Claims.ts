import Immutable from 'immutable'
import { Claim, IClaim } from '@kiltprotocol/prototype-sdk'

import ErrorService from '../../services/ErrorService'
import KiltAction from '../../types/Action'

interface SaveAction extends KiltAction {
  payload: Claim
}

interface RemoveAction extends KiltAction {
  payload: string
}

type Action = SaveAction | RemoveAction

type Entry = Claim

type State = {
  claims: Immutable.Map<string, Entry>
}

type ImmutableState = Immutable.Record<State>

type SerializedState = {
  claims: Array<{ id: string; claim: string }>
}

class Store {
  public static serialize(state: ImmutableState) {
    const serialized: SerializedState = {
      claims: [],
    }

    serialized.claims = state
      .get('claims')
      .toList()
      .map(claim => ({
        id: claim.id,
        claim: JSON.stringify(claim),
      }))
      .toArray()

    return serialized
  }

  public static deserialize(
    claimsStateSerialized: SerializedState
  ): ImmutableState {
    if (!claimsStateSerialized) {
      return Store.createState({
        claims: Immutable.Map(),
      })
    }

    const claims = {}

    Object.keys(claimsStateSerialized.claims).forEach(i => {
      const o = claimsStateSerialized.claims[i]
      try {
        const claim = JSON.parse(o.claim) as IClaim
        const entry = Claim.fromObject(claim)
        claims[o.id] = entry
      } catch (e) {
        ErrorService.log('JSON.parse', e)
      }
    })

    return Store.createState({
      claims: Immutable.Map(claims),
    })
  }

  public static reducer(
    state: ImmutableState = Store.createState(),
    action: Action
  ): ImmutableState {
    switch (action.type) {
      case Store.ACTIONS.SAVE_CLAIM:
        const claim = (action as SaveAction).payload
        return state.setIn(['claims', claim.id], claim)
      case Store.ACTIONS.REMOVE_CLAIM:
        return state.deleteIn(['claims', (action as RemoveAction).payload])
      default:
        return state
    }
  }

  public static saveAction(claim: Claim): SaveAction {
    return {
      payload: claim,
      type: Store.ACTIONS.SAVE_CLAIM,
    }
  }

  public static removeAction(id: string): RemoveAction {
    return {
      payload: id,
      type: Store.ACTIONS.REMOVE_CLAIM,
    }
  }

  public static createState(obj?: State): ImmutableState {
    return Immutable.Record({
      claims: Immutable.Map<string, Entry>(),
    })(obj)
  }

  private static ACTIONS = {
    REMOVE_CLAIM: 'client/claims/REMOVE_CLAIM',
    SAVE_CLAIM: 'client/claims/SAVE_CLAIM',
  }
}

export { Store, ImmutableState, SerializedState, Entry, Action }
