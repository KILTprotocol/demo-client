import { IAttestation } from '@kiltprotocol/types'

import Immutable from 'immutable'
import { createSelector } from 'reselect'
import errorService from '../../services/ErrorService'
import KiltAction from '../../types/Action'
import { IMyIdentity } from '../../types/Contact'
import { State as ReduxState } from '../PersistentStore'
import * as Wallet from './Wallet'

interface ISaveAction extends KiltAction {
  payload: Entry
}

interface IRemoveAction extends KiltAction {
  payload: IAttestation['claimHash']
}

interface IRevokeAction extends KiltAction {
  payload: IAttestation['claimHash']
}

export type Action = ISaveAction | IRemoveAction

export type Entry = {
  created: number
  claimerAlias: string
  claimerAddress: string
  cTypeHash: string
  attestation: IAttestation
}

type State = {
  attestations: Immutable.List<Entry>
}

export type ImmutableState = Immutable.Record<State>

export type SerializedState = {
  attestations: string[]
}

class Store {
  public static serialize(state: ImmutableState): SerializedState {
    const serialized: SerializedState = {
      attestations: [],
    }

    serialized.attestations = state
      .get('attestations')
      .toList()
      .map((attestationEntry: Entry) => {
        return JSON.stringify(attestationEntry)
      })
      .toArray()

    return serialized
  }

  public static deserialize(
    attestationsStateSerialized: SerializedState
  ): ImmutableState {
    if (!attestationsStateSerialized) {
      return Store.createState({
        attestations: Immutable.List(),
      })
    }

    const attestationEntries: Entry[] = []
    attestationsStateSerialized.attestations.forEach(
      serializedAttestatation => {
        try {
          const attestationAsJson = JSON.parse(serializedAttestatation)
          const iAttestation = attestationAsJson.attestation as IAttestation
          const attestationEntry: Entry = {
            attestation: iAttestation,
            cTypeHash: attestationAsJson.cTypeHash,
            claimerAddress: attestationAsJson.claimerAddress,
            claimerAlias: attestationAsJson.claimerAlias,
            created: attestationAsJson.created,
          } as Entry
          attestationEntries.push(attestationEntry)
        } catch (e) {
          errorService.log({
            error: e,
            message: '',
            origin: 'Attestations.deserialize()',
          })
        }
      }
    )

    return Store.createState({
      attestations: Immutable.List(attestationEntries),
    })
  }

  public static reducer(
    state: ImmutableState = Store.createState(),
    action: Action
  ): ImmutableState {
    switch (action.type) {
      case Store.ACTIONS.SAVE_ATTESTATION: {
        const attestationEntry: Entry = (action as ISaveAction).payload
        return state.update('attestations', attestations => {
          return attestations
            .filter((entry: Entry) => {
              return (
                entry.attestation.claimHash !==
                attestationEntry.attestation.claimHash
              )
            })
            .concat(attestationEntry)
        })
      }
      case Store.ACTIONS.REMOVE_ATTESTATION: {
        const claimHash: IAttestation['claimHash'] = (action as IRemoveAction)
          .payload
        return state.set(
          'attestations',
          state.get('attestations').filter((entry: Entry) => {
            return entry.attestation.claimHash !== claimHash
          })
        )
      }
      case Store.ACTIONS.REVOKE_ATTESTATION: {
        const claimHash: IAttestation['claimHash'] = (action as IRemoveAction)
          .payload

        let attestations = state.get('attestations') || []
        attestations = attestations.map((entry: Entry) => {
          return entry.attestation.claimHash === claimHash
            ? { ...entry, attestation: { ...entry.attestation, revoked: true } }
            : entry
        })

        return state.set('attestations', attestations)
      }
      default:
        return state
    }
  }

  public static saveAttestation(attestationEntry: Entry): ISaveAction {
    return {
      payload: attestationEntry,
      type: Store.ACTIONS.SAVE_ATTESTATION,
    }
  }

  public static removeAttestation(
    claimHash: IAttestation['claimHash']
  ): IRemoveAction {
    return {
      payload: claimHash,
      type: Store.ACTIONS.REMOVE_ATTESTATION,
    }
  }

  public static revokeAttestation(
    claimHash: IAttestation['claimHash']
  ): IRevokeAction {
    return {
      payload: claimHash,
      type: Store.ACTIONS.REVOKE_ATTESTATION,
    }
  }

  public static createState(obj?: State): ImmutableState {
    return Immutable.Record({
      attestations: Immutable.List<Entry>(),
    })(obj)
  }

  private static ACTIONS = {
    REMOVE_ATTESTATION: 'client/attestations/REMOVE_ATTESTATION',
    REVOKE_ATTESTATION: 'client/attestations/REVOKE_ATTESTATION',
    SAVE_ATTESTATION: 'client/attestations/SAVE_ATTESTATION',
  }
}

const getAllAttestations = (state: ReduxState): Entry[] => {
  return state.attestations
    .get('attestations')
    .toList()
    .toArray()
}

const getAttestations = createSelector(
  [Wallet.getSelectedIdentity, getAllAttestations],
  (selectedIdentity: IMyIdentity | undefined, entries: Entry[]): Entry[] => {
    return entries.filter((entry: Entry) => {
      return entry.attestation.owner === selectedIdentity?.identity.address
    })
  }
)

export { Store, getAttestations }
