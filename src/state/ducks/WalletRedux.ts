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

type WalletAction = ISaveAction | IRemoveAction

type WalletStateEntry = {
  alias: string
  identity: Identity
}

type WalletState = Immutable.Map<string, WalletStateEntry>

class WalletRedux {
  public static reducer(
    state: WalletState = Immutable.Map(),
    action: WalletAction
  ): WalletState {
    switch (action.type) {
      case WalletRedux.ACTIONS.SAVE_USER:
        const { alias, identity } = (action as ISaveAction).payload
        return state.set(identity.seedAsHex, { alias, identity })
      case WalletRedux.ACTIONS.REMOVE_USER:
        const key = (action as IRemoveAction).payload
        return state.delete(key)
      default:
        return state
    }
  }

  public static saveUserAction(alias: string, identity: Identity): ISaveAction {
    return { type: WalletRedux.ACTIONS.SAVE_USER, payload: { alias, identity } }
  }

  public static removeUserAction(seedAsHex: string): IRemoveAction {
    return { type: WalletRedux.ACTIONS.REMOVE_USER, payload: seedAsHex }
  }

  private static ACTIONS = {
    REMOVE_USER: 'client/wallet/REMOVE_USER',
    SAVE_USER: 'client/wallet/SAVE_USER',
  }
}

export default WalletRedux
export { WalletState, WalletStateEntry, WalletAction }
