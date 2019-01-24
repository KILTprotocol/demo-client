import Immutable from 'immutable'
import * as sdk from '@kiltprotocol/prototype-sdk'

import ErrorService from '../../services/ErrorService'
import KiltAction from '../../types/Action'

interface SaveAction extends KiltAction {
  payload: Entry
}

interface RemoveAction extends KiltAction {
  payload: string
}

type Action = SaveAction | RemoveAction

type Entry = {
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
  attestations: Array<string>
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

    console.log(
      'attestationsStateSerialized.attestations',
      attestationsStateSerialized.attestations
    )
    console.log(
      'typeof attestationsStateSerialized.attestations',
      typeof attestationsStateSerialized.attestations
    )
    attestationsStateSerialized.attestations.forEach(
      serializedAttestatation => {
        try {
          const attestationAsJson = JSON.parse(serializedAttestatation)
          console.log('attestationAsJson', attestationAsJson)
          const iAttestation = attestationAsJson.attestation as sdk.IAttestation
          const attestationEntry: Entry = {
            claimerAlias: attestationAsJson.claimerAlias,
            claimerAddress: attestationAsJson.claimerAddress,
            ctypeHash: attestationAsJson.ctypeHash,
            attestation: iAttestation,
          } as Entry
          attestationEntries.push(attestationEntry)
        } catch (e) {
          ErrorService.log('JSON.parse', e)
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
      case Store.ACTIONS.SAVE_ATTESTATION:
        const attestationEntry: Entry = (action as SaveAction).payload
        return state.update('attestations', attestations =>
          attestations.concat(attestationEntry)
        )
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

  public static createState(obj?: State): ImmutableState {
    return Immutable.Record({
      attestations: Immutable.List<Entry>(),
    })(obj)
  }

  private static ACTIONS = {
    SAVE_ATTESTATION: 'client/attestations/SAVE_ATTESTATION',
  }
}

export { Store, ImmutableState, SerializedState, Entry, Action }
