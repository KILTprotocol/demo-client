import { Identity, PublicIdentity } from '@kiltprotocol/sdk-js'
import Immutable from 'immutable'
import { createSelector } from 'reselect'

import KiltAction from '../../types/Action'
import { IMyIdentity } from '../../types/Contact'
import { State as ReduxState } from '../PersistentStore'

interface ISaveAction extends KiltAction {
  payload: IMyIdentity
}

interface IUpdateAction extends KiltAction {
  payload: {
    address: IMyIdentity['identity']['address']
    partialMyIdentity: Partial<IMyIdentity>
  }
}

interface IRemoveAction extends KiltAction {
  payload: IMyIdentity['identity']['address']
}

interface ISelectAction extends KiltAction {
  payload: IMyIdentity['identity']['address']
}

export type Action = ISaveAction | IUpdateAction | IRemoveAction | ISelectAction

export type Entry = IMyIdentity

type State = {
  identities: Immutable.Map<IMyIdentity['identity']['address'], IMyIdentity>
  selectedIdentity: IMyIdentity['identity']['address'] | null
}

export type ImmutableState = Immutable.Record<State>

type SerializedIdentity = {
  did?: IMyIdentity['did']
  name: IMyIdentity['metaData']['name']
  phrase: IMyIdentity['phrase']
  keypairType: IMyIdentity['keypairType']
  createdAt?: IMyIdentity['createdAt']
}

export type SerializedState = {
  identities: SerializedIdentity[]
  selectedAddress?: IMyIdentity['identity']['address']
}

class Store {
  public static serialize(state: ImmutableState): SerializedState {
    const wallet: SerializedState = {
      identities: [],
    }

    wallet.identities = state
      .get('identities')
      .toList()
      .map((myIdentity: IMyIdentity) => ({
        createdAt: myIdentity.createdAt,
        did: myIdentity.did,
        name: myIdentity.metaData.name,
        keypairType: myIdentity.keypairType,
        phrase: myIdentity.phrase,
      }))
      .toArray()

    const selectedIdentity: IMyIdentity['identity']['address'] | null =
      state.get('selectedIdentity')
    if (selectedIdentity) {
      wallet.selectedAddress = selectedIdentity
    }

    return wallet
  }

  public static deserialize(serializedState: SerializedState): ImmutableState {
    const serializedIdentities: SerializedIdentity[] =
      serializedState &&
      serializedState.identities &&
      Array.isArray(serializedState.identities)
        ? serializedState.identities
        : []
    const identities: { [key: string]: IMyIdentity } = {}

    serializedIdentities.forEach((serializedIdentity: SerializedIdentity) => {
      const { did, name, phrase, createdAt, keypairType } = serializedIdentity

      // TODO: use real wallet later instead of stored phrase

      const identity = Identity.buildFromMnemonic(phrase, {
        signingKeyPairType: keypairType,
      })

      const myIdentity: IMyIdentity = {
        createdAt,
        did,
        identity,
        metaData: {
          name,
        },
        phrase,
        keypairType,
      }

      identities[identity.address] = myIdentity
    })

    const { selectedAddress } = serializedState
    let selectedIdentity = null
    if (selectedAddress) {
      selectedIdentity = selectedAddress
    }

    return Store.createState({
      identities: Immutable.Map(identities),
      selectedIdentity,
    })
  }

  public static reducer(
    state: ImmutableState = Store.createState(),
    action: Action
  ): ImmutableState {
    switch (action.type) {
      case Store.ACTIONS.SAVE_IDENTITY: {
        const myIdentity = (action as ISaveAction).payload
        return state.setIn(['identities', myIdentity.identity.address], {
          ...myIdentity,
          createdAt: Date.now(),
        })
      }
      case Store.ACTIONS.UPDATE_IDENTITY: {
        const { address, partialMyIdentity } = (action as IUpdateAction).payload
        const myIdentity = state.getIn(['identities', address])

        const updatedIdentity = {
          ...myIdentity,
          ...partialMyIdentity,
        }

        return state.setIn(['identities', address], updatedIdentity)
      }
      case Store.ACTIONS.REMOVE_IDENTITY: {
        const removeAddress = (action as IRemoveAction).payload
        return state.deleteIn(['identities', removeAddress])
      }
      case Store.ACTIONS.SELECT_IDENTITY: {
        const selectAddress = (action as ISelectAction).payload

        return state.set('selectedIdentity', selectAddress)
      }
      default:
        return state
    }
  }

  public static saveIdentityAction(myIdentity: IMyIdentity): ISaveAction {
    return {
      payload: myIdentity,
      type: Store.ACTIONS.SAVE_IDENTITY,
    }
  }

  public static updateIdentityAction(
    address: IMyIdentity['identity']['address'],
    partialMyIdentity: Partial<IMyIdentity>
  ): IUpdateAction {
    return {
      payload: { address, partialMyIdentity },
      type: Store.ACTIONS.UPDATE_IDENTITY,
    }
  }

  public static removeIdentityAction(
    address: IMyIdentity['identity']['address']
  ): IRemoveAction {
    return {
      payload: address,
      type: Store.ACTIONS.REMOVE_IDENTITY,
    }
  }

  public static selectIdentityAction(
    address: IMyIdentity['identity']['address']
  ): ISelectAction {
    return {
      payload: address,
      type: Store.ACTIONS.SELECT_IDENTITY,
    }
  }

  public static createState(obj?: State): ImmutableState {
    return Immutable.Record({
      identities: Immutable.Map<
        IMyIdentity['identity']['address'],
        IMyIdentity
      >(),
      selectedIdentity: null,
    } as State)(obj)
  }

  private static ACTIONS = {
    REMOVE_IDENTITY: 'client/wallet/REMOVE_IDENTITY',
    SAVE_IDENTITY: 'client/wallet/SAVE_IDENTITY',
    SELECT_IDENTITY: 'client/wallet/SELECT_IDENTITY',
    UPDATE_IDENTITY: 'client/wallet/UPDATE_IDENTITY',
  }
}

const getStateSelectedIdentity = (
  state: ReduxState
): IMyIdentity['identity']['address'] | null =>
  state.wallet.get('selectedIdentity')

const getStateIdentities = (state: ReduxState): State['identities'] =>
  state.wallet.get('identities')

const getSelectedIdentity = createSelector(
  [getStateSelectedIdentity, getStateIdentities],
  (
    selectedIdentity: IMyIdentity['identity']['address'] | null,
    identities: State['identities']
  ) => {
    if (!selectedIdentity) {
      return undefined
    }
    return identities.get(selectedIdentity)
  }
)

const getStateAllIdentities = (state: ReduxState): IMyIdentity[] =>
  state.wallet.get('identities').toList().toArray()

const getAllIdentities = createSelector(
  [getStateAllIdentities],
  (entries: Entry[]) =>
    entries.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) {
        return 0
      }
      if (!a.createdAt) {
        return 1
      }
      if (!b.createdAt) {
        return -1
      }
      return a.createdAt - b.createdAt
    })
)

const getStateIdentity = (
  state: ReduxState,
  address: PublicIdentity['address']
): IMyIdentity | undefined => state.wallet.get('identities').get(address)

const getIdentity = createSelector(
  [getStateIdentity],
  (entry: Entry | undefined) => entry
)

export { Store, getSelectedIdentity, getAllIdentities, getIdentity }
