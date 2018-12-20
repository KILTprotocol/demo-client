import { Identity } from '@kiltprotocol/prototype-sdk'
import Immutable from 'immutable'
import KiltAction from '../../types/Action'

interface SaveAction extends KiltAction {
  payload: {
    alias: string
    identity: Identity
  }
}

interface RemoveAction extends KiltAction {
  payload: string
}

interface SelectAction extends KiltAction {
  payload: string
}

type Action = SaveAction | RemoveAction | SelectAction

type Entry = {
  alias: string
  identity: Identity
}

type State = {
  identities: Immutable.Map<string, Entry>
  selected: Entry | null
}

type ImmutableState = Immutable.Record<State>

type SerializedState = {
  identities: Array<{ alias: string; phrase: string }>
  selectedIdentityAsSeedAsHex?: string
}

class Store {
  public static serialize(state: ImmutableState) {
    const wallet: SerializedState = {
      identities: [],
    }

    wallet.identities = state
      .get('identities')
      .toList()
      .map(i => ({
        alias: i.alias,
        phrase: i.identity.phrase ? i.identity.phrase : '',
      }))
      .toArray()

    const selected = state.get('selected')
    if (selected) {
      wallet.selectedIdentityAsSeedAsHex = selected.identity.seedAsHex
    }

    return wallet
  }

  public static deserialize(serializedState: SerializedState): ImmutableState {
    const identities = {}
    let selected: Entry | null = null

    Object.keys(serializedState.identities).forEach(i => {
      const o = serializedState.identities[i]
      const identity = Identity.buildFromMnemonic(o.phrase)
      const entry = { alias: o.alias, identity }
      identities[identity.seedAsHex] = entry

      if (
        serializedState.selectedIdentityAsSeedAsHex &&
        serializedState.selectedIdentityAsSeedAsHex === identity.seedAsHex
      ) {
        selected = entry
      }
    })

    return Store.createState({
      identities: Immutable.Map(identities),
      selected,
    })
  }

  public static reducer(
    state: ImmutableState = Store.createState(),
    action: Action
  ): ImmutableState {
    switch (action.type) {
      case Store.ACTIONS.SAVE_IDENTITY:
        const { alias, identity } = (action as SaveAction).payload
        return state.setIn(['identities', identity.seedAsHex], {
          alias,
          identity,
        })
      case Store.ACTIONS.REMOVE_IDENTITY:
        const seedAsHex1 = (action as RemoveAction).payload
        return state.deleteIn(['identities', seedAsHex1])
      case Store.ACTIONS.SELECT_IDENTITY:
        const seedAsHex2 = (action as SelectAction).payload
        const selectedIdentity = state.getIn(['identities', seedAsHex2])
        return state.set('selected', selectedIdentity)
      default:
        return state
    }
  }

  public static saveIdentityAction(
    alias: string,
    identity: Identity
  ): SaveAction {
    return {
      payload: { alias, identity },
      type: Store.ACTIONS.SAVE_IDENTITY,
    }
  }

  public static removeIdentityAction(seedAsHex: string): RemoveAction {
    return {
      payload: seedAsHex,
      type: Store.ACTIONS.REMOVE_IDENTITY,
    }
  }

  public static selectIdentityAction(seedAsHex: string): SelectAction {
    return {
      payload: seedAsHex,
      type: Store.ACTIONS.SELECT_IDENTITY,
    }
  }

  public static createState(obj?: State): ImmutableState {
    return Immutable.Record({
      identities: Immutable.Map<string, Entry>(),
      selected: null,
    } as State)(obj)
  }

  private static ACTIONS = {
    REMOVE_IDENTITY: 'client/wallet/REMOVE_IDENTITY',
    SAVE_IDENTITY: 'client/wallet/SAVE_IDENTITY',
    SELECT_IDENTITY: 'client/wallet/SELECT_IDENTITY',
  }
}

export { Store, ImmutableState, SerializedState, Entry, Action }
