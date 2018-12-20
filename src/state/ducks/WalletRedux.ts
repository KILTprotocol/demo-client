import Immutable from 'immutable'
import Action from '../Action'
import { Identity } from '@kiltprotocol/prototype-sdk'

interface ISaveAction extends Action {
  payload: {
    alias: string
    identity: Identity
  }
}
interface IRemoveAction extends Action {
  payload: string
}
interface ISelectAction extends Action {
  payload: string
}

type WalletAction = ISaveAction | IRemoveAction | ISelectAction

type WalletStateEntry = {
  alias: string
  identity: Identity
}

type WalletState = {
  identities: Immutable.Map<string, WalletStateEntry>
  selected: WalletStateEntry | null
}

type ImmutableWalletState = Immutable.Record<WalletState>

type WalletStateSerialized = {
  identities: Array<{ alias: string; phrase: string }>
  selectedIdentityAsSeedAsHex?: string
}

class WalletRedux {
  public static serialize(walletState: ImmutableWalletState) {
    const wallet: WalletStateSerialized = {
      identities: [],
    }

    wallet.identities = walletState
      .get('identities')
      .toList()
      .map(i => ({
        alias: i.alias,
        phrase: i.identity.phrase ? i.identity.phrase : '',
      }))
      .toArray()

    const selected = walletState.get('selected')
    if (selected) {
      wallet.selectedIdentityAsSeedAsHex = selected.identity.seedAsHex
    }

    return wallet
  }

  public static deserialize(
    walletStateSerialized: WalletStateSerialized
  ): ImmutableWalletState {
    const identities = {}
    let selected: WalletStateEntry | null = null

    Object.keys(walletStateSerialized.identities).forEach(i => {
      const o = walletStateSerialized.identities[i]
      const identity = Identity.buildFromMnemonic(o.phrase)
      const entry = { alias: o.alias, identity }
      identities[identity.seedAsHex] = entry

      if (
        walletStateSerialized.selectedIdentityAsSeedAsHex &&
        walletStateSerialized.selectedIdentityAsSeedAsHex === identity.seedAsHex
      ) {
        selected = entry
      }
    })

    return WalletRedux.createState({
      identities: Immutable.Map(identities),
      selected,
    })
  }

  public static reducer(
    state: ImmutableWalletState = WalletRedux.createState(),
    action: WalletAction
  ): ImmutableWalletState {
    switch (action.type) {
      case WalletRedux.ACTIONS.SAVE_IDENTITY:
        const { alias, identity } = (action as ISaveAction).payload
        return state.setIn(['identities', identity.seedAsHex], {
          alias,
          identity,
        })
      case WalletRedux.ACTIONS.REMOVE_IDENTITY:
        const seedAsHex1 = (action as IRemoveAction).payload
        return state.deleteIn(['identities', seedAsHex1])
      case WalletRedux.ACTIONS.SELECT_IDENTITY:
        const seedAsHex2 = (action as ISelectAction).payload
        const selectedIdentity = state.getIn(['identities', seedAsHex2])
        return state.set('selected', selectedIdentity)
      default:
        return state
    }
  }

  public static saveIdentityAction(
    alias: string,
    identity: Identity
  ): ISaveAction {
    return {
      payload: { alias, identity },
      type: WalletRedux.ACTIONS.SAVE_IDENTITY,
    }
  }

  public static removeIdentityAction(seedAsHex: string): IRemoveAction {
    return {
      payload: seedAsHex,
      type: WalletRedux.ACTIONS.REMOVE_IDENTITY,
    }
  }

  public static selectIdentityAction(seedAsHex: string): ISelectAction {
    return {
      payload: seedAsHex,
      type: WalletRedux.ACTIONS.SELECT_IDENTITY,
    }
  }

  public static createState(obj?: WalletState): ImmutableWalletState {
    return Immutable.Record({
      identities: Immutable.Map<string, WalletStateEntry>(),
      selected: null,
    } as WalletState)(obj)
  }

  private static ACTIONS = {
    REMOVE_IDENTITY: 'client/wallet/REMOVE_IDENTITY',
    SAVE_IDENTITY: 'client/wallet/SAVE_IDENTITY',
    SELECT_IDENTITY: 'client/wallet/SELECT_IDENTITY',
  }
}

export default WalletRedux
export {
  ImmutableWalletState,
  WalletStateSerialized,
  WalletStateEntry,
  WalletAction,
}
