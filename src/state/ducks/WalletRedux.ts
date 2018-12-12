import Immutable from 'immutable'
import Identity from '../../types/Identity'
import Action from '../Action'

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

type WalletState = Immutable.Record<{
  identities: Immutable.Map<string, WalletStateEntry>
  selected: WalletStateEntry | null
}>

class WalletRedux {
  public static reducer(
    state: WalletState = WalletRedux.createState(),
    action: WalletAction
  ): WalletState {
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

  public static createState(obj?: any) {
    return Immutable.Record({
      identities: Immutable.Map<string, WalletStateEntry>(),
      selected: null,
    })(obj)
  }

  private static ACTIONS = {
    REMOVE_IDENTITY: 'client/wallet/REMOVE_IDENTITY',
    SAVE_IDENTITY: 'client/wallet/SAVE_IDENTITY',
    SELECT_IDENTITY: 'client/wallet/SELECT_IDENTITY',
  }
}

export default WalletRedux
export { WalletState, WalletStateEntry, WalletAction }
