import * as sdk from '@kiltprotocol/sdk-js'
import Immutable from 'immutable'
import { createSelector } from 'reselect'

import errorService from '../../services/ErrorService'
import KiltAction from '../../types/Action'
import { MyIdentity } from '../../types/Contact'
import { ICType } from '../../types/Ctype'
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

interface RevokeAttestationAction extends KiltAction {
  payload: {
    revokedHash: sdk.IAttestedClaim['request']['hash']
  }
}

type Action =
  | SaveAction
  | RemoveAction
  | AddAttestationAction
  | RevokeAttestationAction

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
      case Store.ACTIONS.CLAIM_SAVE: {
        const { claimId, claim, meta } = (action as SaveAction).payload

        return state.setIn(['claims', claimId], {
          attestations: [],
          claim,
          id: claimId,
          meta,
        } as Entry)
      }
      case Store.ACTIONS.CLAIM_REMOVE: {
        return state.deleteIn(['claims', (action as RemoveAction).payload])
      }
      case Store.ACTIONS.ATTESTATION_ADD: {
        const {
          claimId,
          attestation,
        } = (action as AddAttestationAction).payload

        let attestations =
          state.getIn(['claims', claimId, 'attestations']) || []
        attestations = attestations.filter(
          (_attestation: sdk.IAttestedClaim) =>
            !Store.areAttestationsEqual(attestation, _attestation)
        )

        return state.setIn(
          ['claims', claimId, 'attestations'],
          [...attestations, attestation]
        )
      }
      case Store.ACTIONS.ATTESTATION_REVOKE: {
        const { revokedHash } = (action as RevokeAttestationAction).payload
        const setIns: Array<Iterable<any>> = []

        let claims = state.get('claims')

        claims.map((myClaim: Entry, myClaimHash: string) => {
          if (myClaim.attestations && myClaim.attestations.length) {
            myClaim.attestations.forEach(
              (attestedClaim: sdk.IAttestedClaim, index: number) => {
                if (attestedClaim.request.hash === revokedHash) {
                  // avoid changing claims while iterating
                  setIns.push([
                    myClaimHash,
                    'attestations',
                    index,
                    'attestation',
                    'revoked',
                  ])
                }
              }
            )
          }
        })
        setIns.forEach((keyPath: Iterable<any>) => {
          claims = claims.setIn(keyPath, true)
        })
        return state.setIn(['claims'], claims)
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
      type: Store.ACTIONS.CLAIM_SAVE,
    }
  }

  public static removeAction(claimId: Entry['id']): RemoveAction {
    return {
      payload: claimId,
      type: Store.ACTIONS.CLAIM_REMOVE,
    }
  }

  public static addAttestation(
    attestation: sdk.IAttestedClaim
  ): AddAttestationAction {
    return {
      payload: { claimId: hash(attestation.request.claim), attestation },
      type: Store.ACTIONS.ATTESTATION_ADD,
    }
  }

  public static revokeAttestation(
    revokedHash: sdk.IAttestedClaim['request']['hash']
  ): RevokeAttestationAction {
    return {
      payload: { revokedHash },
      type: Store.ACTIONS.ATTESTATION_REVOKE,
    }
  }

  public static createState(obj?: State): ImmutableState {
    return Immutable.Record({
      claims: Immutable.Map<string, Entry>(),
    })(obj)
  }

  private static ACTIONS = {
    ATTESTATION_ADD: 'client/claims/ATTESTATION_ADD',
    ATTESTATION_REVOKE: 'client/claims/ATTESTATION_REVOKE',
    CLAIM_REMOVE: 'client/claims/CLAIM_REMOVE',
    CLAIM_SAVE: 'client/claims/CLAIM_SAVE',
  }

  private static areAttestationsEqual(
    attestatedClaim1: sdk.IAttestedClaim,
    attestatedClaim2: sdk.IAttestedClaim
  ) {
    const { attestation: attestation1 } = attestatedClaim1
    const { attestation: attestation2 } = attestatedClaim2
    return (
      attestation1.owner === attestation2.owner &&
      attestation1.claimHash === attestation2.claimHash
    )
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

const _getCTypeHash = (
  state: ReduxState,
  cTypeHash: ICType['cType']['hash']
): ICType['cType']['hash'] => cTypeHash

const getClaimsByCTypeHash = createSelector(
  [getClaims, _getCTypeHash],
  (entries: Entry[], cTypeHash: ICType['cType']['hash']) =>
    entries.filter((entry: Entry) => entry.claim.cType === cTypeHash)
)

const _getClaimHash = (state: ReduxState, claim: sdk.IPartialClaim): string =>
  hash(claim)

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
  getClaimsByCTypeHash,
  getClaim,
  hash,
}
