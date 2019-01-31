import * as sdk from '@kiltprotocol/prototype-sdk'
import Immutable from 'immutable'
import moment from 'moment'

import errorService from '../../services/ErrorService'
import KiltAction from '../../types/Action'

interface SaveAction extends KiltAction {
  payload: Entry
}

interface RemoveAction extends KiltAction {
  payload: sdk.IAttestation['claimHash']
}

interface RevokeAction extends KiltAction {
  payload: sdk.IAttestation['claimHash']
}

type Action = SaveAction | RemoveAction

type Entry = {
  created: moment.Moment
  claimerAlias: string
  claimerAddress: string
  ctypeHash: string
  ctypeName: string
  attestation: sdk.IAttestation
}

type State = {
  attestations: Immutable.List<Entry>
}

type ImmutableState = Immutable.Record<State>

type SerializedState = {
  attestations: string[]
}

class Store {
  public static serialize(state: ImmutableState) {
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
          const iAttestation = attestationAsJson.attestation as sdk.IAttestation
          const attestationEntry: Entry = {
            attestation: iAttestation,
            claimerAddress: attestationAsJson.claimerAddress,
            claimerAlias: attestationAsJson.claimerAlias,
            created: moment(attestationAsJson.created, moment.defaultFormatUtc),
            ctypeHash: attestationAsJson.ctypeHash,
            ctypeName: attestationAsJson.ctypeName,
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
        const attestationEntry: Entry = (action as SaveAction).payload
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
        const claimHash: sdk.IAttestation['claimHash'] = (action as RemoveAction)
          .payload
        return state.set(
          'attestations',
          state.get('attestations').filter((entry: Entry) => {
            return entry.attestation.claimHash !== claimHash
          })
        )
      }
      case Store.ACTIONS.REVOKE_ATTESTATION: {
        const claimHash: sdk.IAttestation['claimHash'] = (action as RemoveAction)
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

  public static saveAttestation(attestationEntry: Entry): SaveAction {
    return {
      payload: attestationEntry,
      type: Store.ACTIONS.SAVE_ATTESTATION,
    }
  }

  public static removeAttestation(
    claimHash: sdk.IAttestation['claimHash']
  ): RemoveAction {
    return {
      payload: claimHash,
      type: Store.ACTIONS.REMOVE_ATTESTATION,
    }
  }

  public static revokeAttestation(
    claimHash: sdk.IAttestation['claimHash']
  ): RevokeAction {
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

export { Store, ImmutableState, SerializedState, Entry, Action }
