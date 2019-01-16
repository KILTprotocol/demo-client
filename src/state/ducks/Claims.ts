import Immutable from 'immutable'
import { Claim, IClaim } from '@kiltprotocol/prototype-sdk'

import ErrorService from '../../services/ErrorService'
import KiltAction from '../../types/Action'
import { Attestation } from '../../types/Claim' // TODO: Attestation
// from SDK

interface SaveAction extends KiltAction {
  payload: Claim
}

interface RemoveAction extends KiltAction {
  payload: Entry['id']
}

interface AddAttestationAction extends KiltAction {
  payload: {
    id: Entry['id']
    attestation: Attestation
  }
}

interface AddAttestationAction extends KiltAction {
  payload: {
    id: Entry['id']
    attestation: Attestation
  }
}

type Action = SaveAction | RemoveAction | AddAttestationAction

type Entry =  {
  claim: Claim
  attestations: Attestation[]
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
      .map(claim => ({
        claim: JSON.stringify(claim),
        hash: claim.hash,
    attestations: JSON.stringify(i.attestations),
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
    const attestations = JSON.parse(o.attestations) as Attestation[]
        const entry = {
        claim: Claim.fromObject(claim),
        attestations:attestations
    }
        claims[o.hash] = entry
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
        return state.setIn(['claims', claim.hash], {
          claim,
          attestations: [],
        })
      case Store.ACTIONS.REMOVE_CLAIM:
        return state.deleteIn(['claims', (action as RemoveAction).payload])
      case Store.ACTIONS.ADD_ATTESTATION:
        const { claimHash, attestation } =  (action as AddAttestationAction).payload
        let attestations =
          state.getIn(['claims', claimHash, 'attestations']) || []
        attestations = attestations.filter(
          (_attestation: Attestation) =>
            _attestation.signature !== attestation.signature
        )
        return state.setIn(
          ['claims', claimHash, 'attestations'],
          [...attestations, attestation]
        )
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

  public static removeAction(hash: string): RemoveAction {
    return {
      payload: hash,
      type: Store.ACTIONS.REMOVE_CLAIM,
    }
  }

  public static addAttestation(
    hash: string,
    attestation: Attestation
  ): AddAttestationAction {
    return {
      payload: { hash, attestation },
      type: Store.ACTIONS.ADD_ATTESTATION,
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
    ADD_ATTESTATION: 'client/claims/ADD_ATTESTATION',
  }
}

export { Store, ImmutableState, SerializedState, Entry, Action }
