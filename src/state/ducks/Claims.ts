import * as sdk from '@kiltprotocol/prototype-sdk'
import Immutable from 'immutable'
import { createSelector } from 'reselect'

import errorService from '../../services/ErrorService'
import KiltAction from '../../types/Action'
import { MyIdentity } from '../../types/Contact'
import { State as ReduxState } from '../PersistentStore'
import * as Wallet from './Wallet'

function hash(claim: sdk.IPartialClaim): string {
  return sdk.Crypto.hashStr(JSON.stringify(claim))
}

interface SaveAction extends KiltAction {
  payload: {
    claimId: Entry['id']
    claim: sdk.IClaim
    meta: {
      alias: string
    }
  }
}

interface RemoveAction extends KiltAction {
  payload: Entry['id']
}

interface AddAttestationAction extends KiltAction {
  payload: {
    claimId: Entry['id']
    attestation: sdk.IAttestedClaim
  }
}

interface UpdateAttestationAction extends KiltAction {
  payload: {
    claimId: Entry['id']
    attestation: sdk.IAttestedClaim
  }
}

type Action = SaveAction | RemoveAction | AddAttestationAction

type Entry = {
  id: string
  claim: sdk.IClaim
  attestations: sdk.IAttestedClaim[]
  meta: {
    alias: string
  }
}

type State = {
  claims: Immutable.Map<string, Entry>
}

type ImmutableState = Immutable.Record<State>

type SerializedState = {
  claims: Array<{ id: string; claim: string; meta: object }>
}

class Store {
  public static serialize(state: ImmutableState) {
    const serialized: SerializedState = {
      claims: [],
    }

    serialized.claims = state
      .get('claims')
      .toList()
      .map(claimEntry => {
        return {
          attestations: JSON.stringify(claimEntry.attestations),
          claim: JSON.stringify(claimEntry.claim),
          id: claimEntry.id,
          meta: claimEntry.meta,
        }
      })
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
        const attestations: sdk.IAttestedClaim[] = !!o.attestations
          ? (JSON.parse(o.attestations) as sdk.IAttestedClaim[])
          : []
        const entry = {
          attestations,
          claim,
          id: o.id,
          meta: o.meta,
        } as Entry
        claims[o.id] = entry
      } catch (error) {
        errorService.log({
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
      case Store.ACTIONS.SAVE_CLAIM: {
        const { claimId, claim, meta } = (action as SaveAction).payload

        return state.setIn(['claims', claimId], {
          attestations: [],
          claim,
          id: claimId,
          meta,
        } as Entry)
      }
      case Store.ACTIONS.REMOVE_CLAIM: {
        return state.deleteIn(['claims', (action as RemoveAction).payload])
      }
      case Store.ACTIONS.ADD_ATTESTATION: {
        const {
          claimId,
          attestation,
        } = (action as AddAttestationAction).payload

        let attestations =
          state.getIn(['claims', claimId, 'attestations']) || []
        attestations = attestations.filter(
          (_attestation: sdk.IAttestedClaim) =>
            _attestation.attestation.owner !== attestation.attestation.owner
        )

        return state.setIn(
          ['claims', claimId, 'attestations'],
          [...attestations, attestation]
        )
      }
      case Store.ACTIONS.UPDATE_ATTESTATION: {
        const {
          claimId,
          attestation,
        } = (action as UpdateAttestationAction).payload

        let attestations =
          state.getIn(['claims', claimId, 'attestations']) || []
        attestations = attestations.map((_attestation: sdk.IAttestedClaim) => {
          return _attestation.attestation.owner ===
            attestation.attestation.owner
            ? attestation
            : _attestation
        })

        return state.setIn(
          ['claims', claimId, 'attestations'],
          [...attestations]
        )
      }
      default:
        return state
    }
  }

  public static saveAction(claim: sdk.IClaim, meta: Entry['meta']): SaveAction {
    return {
      payload: {
        claim,
        claimId: hash(claim),
        meta,
      },
      type: Store.ACTIONS.SAVE_CLAIM,
    }
  }

  public static removeAction(claimId: Entry['id']): RemoveAction {
    return {
      payload: claimId,
      type: Store.ACTIONS.REMOVE_CLAIM,
    }
  }

  public static addAttestation(
    attestation: sdk.IAttestedClaim
  ): AddAttestationAction {
    return {
      payload: { claimId: hash(attestation.request.claim), attestation },
      type: Store.ACTIONS.ADD_ATTESTATION,
    }
  }

  public static updateAttestation(
    attestation: sdk.IAttestedClaim
  ): UpdateAttestationAction {
    return {
      payload: { claimId: hash(attestation.request.claim), attestation },
      type: Store.ACTIONS.UPDATE_ATTESTATION,
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
    UPDATE_ATTESTATION: 'client/claims/UPDATE_ATTESTATION',
  }
}

const _getAllClaims = (state: ReduxState): Entry[] => {
  return state.claims
    .get('claims')
    .toList()
    .toArray()
}

const getClaims = createSelector(
  [Wallet.getSelectedIdentity, _getAllClaims],
  (selectedIdentity: MyIdentity, entries: Entry[]) => {
    return entries.filter((entry: Entry) => {
      return (
        entry &&
        entry.claim &&
        entry.claim.owner === selectedIdentity.identity.address
      )
    })
  }
)

const _getClaimHash = (state: ReduxState, claim: sdk.IPartialClaim): string => {
  return hash(claim)
}

const getClaim = createSelector(
  [_getClaimHash, getClaims],
  (claimHash: string, entries: Entry[]) => {
    return entries.find((entry: Entry) => entry.id === claimHash)
  }
)

export {
  Store,
  ImmutableState,
  SerializedState,
  Entry,
  Action,
  getClaims,
  getClaim,
  hash,
}
