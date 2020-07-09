import * as sdk from '@kiltprotocol/sdk-js'
import Immutable from 'immutable'
import { createSelector } from 'reselect'

import errorService from '../../services/ErrorService'
import KiltAction from '../../types/Action'
import { IMyIdentity } from '../../types/Contact'
import { ICType } from '../../types/Ctype'
import { State as ReduxState } from '../PersistentStore'
import * as Wallet from './Wallet'

function hash(claim: sdk.IPartialClaim): string {
  return sdk.Crypto.hashStr(JSON.stringify(claim))
}

interface ISaveAction extends KiltAction {
  payload: {
    claimId: Entry['id']
    claim: sdk.IClaim
    meta: {
      alias: string
    }
  }
}

interface IRemoveAction extends KiltAction {
  payload: Entry['id']
}

interface IAddAttestationAction extends KiltAction {
  payload: {
    claimId: Entry['id']
    attestation: sdk.IAttestation
  }
}

interface IRevokeAttestationAction extends KiltAction {
  payload: {
    revokedHash: sdk.IAttestation['claimHash']
  }
}

interface IAddRequestForAttestationAction extends KiltAction {
  payload: {
    claimId: string
    requestForAttestation: sdk.IRequestForAttestation
  }
}

interface IRemoveRequestForAttestationAction extends KiltAction {
  payload: Entry['id']
}

export type Action =
  | ISaveAction
  | IRemoveAction
  | IAddAttestationAction
  | IRevokeAttestationAction
  | IAddRequestForAttestationAction
  | IRemoveRequestForAttestationAction

export type Entry = {
  id: string
  claim: sdk.IClaim
  attestations: sdk.IAttestedClaim[]
  requestForAttestations: sdk.IRequestForAttestation[]
  meta: {
    alias: string
  }
}

type State = {
  claims: Immutable.Map<string, Entry>
}

export type ImmutableState = Immutable.Record<State>

export type SerializedState = {
  claims: Array<{ id: string; claim: string; meta: object }>
}

class Store {
  public static serialize(state: ImmutableState): SerializedState {
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
          requestForAttestations: JSON.stringify(
            claimEntry.requestForAttestations
          ),
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
        const attestations: sdk.IAttestedClaim[] = o.attestations
          ? (JSON.parse(o.attestations) as sdk.IAttestedClaim[])
          : []
        const requestForAttestations: sdk.IRequestForAttestation[] = o.requestForAttestations
          ? JSON.parse(o.requestForAttestations)
          : []
        const entry = {
          attestations,
          requestForAttestations,
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
        const { claimId, claim, meta } = (action as ISaveAction).payload

        return state.setIn(['claims', claimId], {
          attestations: [],
          requestForAttestations: [],
          claim,
          id: claimId,
          meta,
        } as Entry)
      }
      case Store.ACTIONS.CLAIM_REMOVE: {
        return state.deleteIn(['claims', (action as IRemoveAction).payload])
      }
      case Store.ACTIONS.ATTESTATION_ADD: {
        const {
          claimId,
          attestation,
        } = (action as IAddAttestationAction).payload
        let attestations =
          state.getIn(['claims', claimId, 'attestations']) || []
        attestations = attestations.filter(
          (_attestation: sdk.IAttestation) =>
            !Store.areAttestationsEqual(attestation, _attestation)
        )

        return state.setIn(
          ['claims', claimId, 'attestations'],
          [...attestations, attestation]
        )
      }

      case Store.ACTIONS.ATTESTATION_REVOKE: {
        const { revokedHash } = (action as IRevokeAttestationAction).payload
        const setIns: Array<Iterable<any>> = []

        let claims = state.get('claims')

        claims.forEach((myClaim: Entry, myClaimHash: string) => {
          if (myClaim.attestations && myClaim.attestations.length) {
            myClaim.attestations.forEach(
              (attestedClaim: sdk.IAttestedClaim, index: number) => {
                if (attestedClaim.request.rootHash === revokedHash) {
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
      case Store.ACTIONS.REQUEST_FOR_ATTESTATION_ADD: {
        const {
          requestForAttestation,
          claimId,
        } = (action as IAddRequestForAttestationAction).payload

        let requestForAttestations =
          state.getIn([claimId, 'requestForAttestations']) || []

        requestForAttestations = requestForAttestations.filter(
          (_requestForAttestations: sdk.IRequestForAttestation) =>
            !Store.areRequetForAttestationsEqual(
              requestForAttestation,
              _requestForAttestations
            )
        )
        return state.setIn(
          [claimId, 'requestForAttestations'],
          [...requestForAttestations, requestForAttestation]
        )
      }
      case Store.ACTIONS.REQUEST_FOR_ATTESTATION_REMOVE: {
        const claimId = (action as IRemoveRequestForAttestationAction).payload
        const setIns: Array<Iterable<any>> = []
        let claims = state.get('claims')

        claims.forEach((myClaim: Entry, myClaimHash: string) => {
          if (
            myClaim.requestForAttestations &&
            myClaim.requestForAttestations.length
          ) {
            myClaim.requestForAttestations.forEach(
              (
                requestForAttestation: sdk.IRequestForAttestation,
                index: number
              ) => {
                if (requestForAttestation.rootHash === claimId) {
                  setIns.push([
                    myClaimHash,
                    'requestForAttestations',
                    index,
                    'requestForAttesation',
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

  public static saveAction(
    claim: sdk.IClaim,
    meta: Entry['meta']
  ): ISaveAction {
    return {
      payload: {
        claim,
        claimId: hash(claim),
        meta,
      },
      type: Store.ACTIONS.CLAIM_SAVE,
    }
  }

  public static removeAction(claimId: Entry['id']): IRemoveAction {
    return {
      payload: claimId,
      type: Store.ACTIONS.CLAIM_REMOVE,
    }
  }

  public static addAttestation(
    attestation: sdk.IAttestation
  ): IAddAttestationAction {
    return {
      payload: { claimId: attestation.claimHash, attestation },
      type: Store.ACTIONS.ATTESTATION_ADD,
    }
  }

  public static revokeAttestation(
    revokedHash: sdk.IAttestedClaim['request']['rootHash']
  ): IRevokeAttestationAction {
    return {
      payload: { revokedHash },
      type: Store.ACTIONS.ATTESTATION_REVOKE,
    }
  }

  public static addRequestForAttestation(
    requestForAttestation: sdk.IRequestForAttestation
  ): IAddRequestForAttestationAction {
    return {
      payload: {
        claimId: requestForAttestation.rootHash,
        requestForAttestation,
      },
      type: Store.ACTIONS.REQUEST_FOR_ATTESTATION_ADD,
    }
  }

  public static removeRequestForAttestation(
    rootHash: sdk.IAttestedClaim['request']['rootHash']
  ): IRemoveRequestForAttestationAction {
    return {
      payload: rootHash,
      type: Store.ACTIONS.REQUEST_FOR_ATTESTATION_REMOVE,
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
    REQUEST_FOR_ATTESTATION_ADD: 'client/claims/REQUEST_FOR_ATTESTATION_ADD',
    REQUEST_FOR_ATTESTATION_REMOVE:
      'client/claims/REQUEST_FOR_ATTESTATION_REMOVE',
  }

  private static areAttestationsEqual(
    attestation1: sdk.IAttestation,
    attestation2: sdk.IAttestation
  ): boolean {
    return (
      attestation1.owner === attestation2.owner &&
      attestation1.claimHash === attestation2.claimHash
    )
  }

  private static areRequetForAttestationsEqual(
    requestForAttesation1: sdk.IRequestForAttestation,
    requestForAttesation2: sdk.IRequestForAttestation
  ): boolean {
    return (
      requestForAttesation1.claimOwner.hash ===
        requestForAttesation2.claimOwner.hash &&
      requestForAttesation1.rootHash === requestForAttesation2.rootHash
    )
  }
}

const getAllClaims = (state: ReduxState): Entry[] => {
  return state.claims
    .get('claims')
    .toList()
    .toArray()
}

const getClaims = createSelector(
  [Wallet.getSelectedIdentity, getAllClaims],
  (selectedIdentity: IMyIdentity, entries: Entry[]) => {
    return entries.filter((entry: Entry) => {
      return (
        entry &&
        entry.claim &&
        entry.claim.owner === selectedIdentity.identity.getAddress()
      )
    })
  }
)

const getCTypeHash = (
  state: ReduxState,
  cTypeHash: ICType['cType']['hash']
): ICType['cType']['hash'] => cTypeHash

const getClaimsByCTypeHash = createSelector(
  [getClaims, getCTypeHash],
  (entries: Entry[], cTypeHash: ICType['cType']['hash']) =>
    entries.filter((entry: Entry) => entry.claim.cTypeHash === cTypeHash)
)

const getClaimHash = (state: ReduxState, claim: sdk.IPartialClaim): string =>
  hash(claim)

const getClaim = createSelector(
  [getClaimHash, getClaims],
  (claimHash: string, entries: Entry[]) => {
    return entries.find((entry: Entry) => entry.id === claimHash)
  }
)

export { Store, getClaims, getClaimsByCTypeHash, getClaim, hash }
