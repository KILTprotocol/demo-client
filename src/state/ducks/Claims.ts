import * as sdk from '@kiltprotocol/prototype-sdk'
import Immutable from 'immutable'

import ErrorService from '../../services/ErrorService'
import KiltAction from '../../types/Action'

interface SaveAction extends KiltAction {
  payload: sdk.IClaim
}

interface RemoveAction extends KiltAction {
  payload: string
}

interface AddAttestationAction extends KiltAction {
  payload: {
    id: string
    attestation: sdk.IAttestation
  }
}

interface AddAttestationAction extends KiltAction {
  payload: {
    id: string
    attestation: sdk.IAttestation
  }
}

type Action = SaveAction | RemoveAction | AddAttestationAction

type Entry = {
  // TODO: use interface instead of class
  claim: sdk.Claim
  attestations: sdk.IAttestation[]
}

type State = {
  claims: Immutable.Map<string, Entry>
}

type ImmutableState = Immutable.Record<State>

type SerializedState = {
  claims: Array<{ hash: string; claim: string }>
}

class Store {
  public static serialize(state: ImmutableState) {
    const serialized: SerializedState = {
      claims: [],
    }

    serialized.claims = state
      .get('claims')
      .toList()
      .map(claimEntry => ({
        attestations: JSON.stringify(claimEntry.attestations),
        claim: JSON.stringify(claimEntry.claim),
        hash: claimEntry.claim.hash,
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
        const claim = JSON.parse(o.claim) as sdk.IClaim
        const attestations: sdk.IAttestation[] = !!o.attestations
          ? (JSON.parse(o.attestations) as sdk.IAttestation[])
          : []
        const entry = {
          attestations,
          claim: sdk.Claim.fromObject(claim),
        }
        claims[o.hash] = entry
      } catch (error) {
        ErrorService.log({
          error,
          message: 'Could not restore Claims from local storage',
          origin: 'Claims.Store.deserialize()',
        })
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
        return state.setIn(['claims', claim.hash], {
          attestations: [],
          claim,
        })
      case Store.ACTIONS.REMOVE_CLAIM:
        return state.deleteIn(['claims', (action as RemoveAction).payload])
      case Store.ACTIONS.ADD_ATTESTATION:
        const { id, attestation } = (action as AddAttestationAction).payload
        let attestations = state.getIn(['claims', id, 'attestations']) || []
        attestations = attestations.filter(
          (_attestation: sdk.IAttestation) =>
            _attestation.signature !== attestation.signature
        )
        return state.setIn(
          ['claims', id, 'attestations'],
          [...attestations, attestation]
        )
      default:
        return state
    }
  }

  public static saveAction(claim: sdk.IClaim): SaveAction {
    return {
      payload: claim,
      type: Store.ACTIONS.SAVE_CLAIM,
    }
  }

  public static removeAction(hash: string): RemoveAction {
    return {
      payload: hash,
      type: Store.ACTIONS.REMOVE_CLAIM,
    }
  }

  public static addAttestation(
    attestation: sdk.IAttestation
  ): AddAttestationAction {
    return {
      payload: { id: attestation.claimHash, attestation },
      type: Store.ACTIONS.ADD_ATTESTATION,
    }
  }

  public static createState(obj?: State): ImmutableState {
    return Immutable.Record({
      claims: Immutable.Map<string, Entry>(),
    })(obj)
  }

  private static ACTIONS = {
    ADD_ATTESTATION: 'client/claims/ADD_ATTESTATION',
    REMOVE_CLAIM: 'client/claims/REMOVE_CLAIM',
    SAVE_CLAIM: 'client/claims/SAVE_CLAIM',
  }
}

export { Store, ImmutableState, SerializedState, Entry, Action }
