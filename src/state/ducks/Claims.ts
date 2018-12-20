import Immutable from 'immutable'
import ErrorService from '../../services/ErrorService'
import { Claim } from '../../types/Claim'
import Action from '../Action'

interface SaveAction extends Action {
  payload: {
    alias: string
    claim: Claim
  }
}

type ClaimsAction = SaveAction

type ClaimsStateEntry = {
  alias: string
  claim: Claim
}

type ClaimsState = {
  claims: Immutable.Map<string, ClaimsStateEntry>
}

type ImmutableClaimsState = Immutable.Record<ClaimsState>

type ClaimsStateSerialized = {
  claims: Array<{ alias: string; claim: string }>
}

class Claims {
  public static serialize(claimsState: ImmutableClaimsState) {
    const serialized: ClaimsStateSerialized = {
      claims: [],
    }

    serialized.claims = claimsState
      .get('claims')
      .toList()
      .map(i => ({ alias: i.alias, claim: JSON.stringify(i.claim) }))
      .toArray()

    return serialized
  }

  public static deserialize(
    claimsStateSerialized: ClaimsStateSerialized
  ): ImmutableClaimsState {
    if (!claimsStateSerialized) {
      return Claims.createState({
        claims: Immutable.Map(),
      })
    }

    const claims = {}

    Object.keys(claimsStateSerialized.claims).forEach(i => {
      const o = claimsStateSerialized.claims[i]
      try {
        const claim = JSON.parse(o.claim) as Claim
        const entry = { alias: o.alias, claim }
        claims[o.alias] = entry
      } catch (e) {
        ErrorService.log(e)
      }
    })

    return Claims.createState({
      claims: Immutable.Map(claims),
    })
  }

  public static reducer(
    state: ImmutableClaimsState = Claims.createState(),
    action: ClaimsAction
  ): ImmutableClaimsState {
    switch (action.type) {
      case Claims.ACTIONS.SAVE_CLAIM:
        const { alias, claim } = (action as SaveAction).payload
        return state.setIn(['claims', alias], {
          alias,
          claim,
        })
      default:
        return state
    }
  }

  public static saveAction(alias: string, claim: Claim): SaveAction {
    return {
      payload: { alias, claim },
      type: Claims.ACTIONS.SAVE_CLAIM,
    }
  }

  public static createState(obj?: ClaimsState): ImmutableClaimsState {
    return Immutable.Record({
      claims: Immutable.Map<string, ClaimsStateEntry>(),
    })(obj)
  }

  private static ACTIONS = {
    SAVE_CLAIM: 'client/claims/SAVE_CLAIM',
  }
}

export default Claims
export {
  ImmutableClaimsState,
  ClaimsStateSerialized,
  ClaimsStateEntry,
  ClaimsAction,
}
