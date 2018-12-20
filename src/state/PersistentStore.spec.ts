import WalletRedux from './ducks/WalletRedux'
import persistentStore, {
  deserialize,
  serialize,
  State,
} from './PersistentStore'
import { Identity } from '@kiltprotocol/prototype-sdk'

describe('PersistentStore', () => {
  it('should have equal serialized state and deserialized state', () => {
    const assertStateToBeDeserializedAsExpected = (state: State) => {
      const serialized: string = serialize(state)
      const deserialized = deserialize(serialized)
      expect(JSON.stringify(deserialized)).toEqual(JSON.stringify(state))
      expect(state).toBeDefined()
      expect(serialized.length).toBeGreaterThan(0)
      expect(deserialized).toBeDefined()
    }

    const identity = Identity.buildFromMnemonic()
    const saveIdentityAction = WalletRedux.saveIdentityAction('mario', identity)
    const selectActionIdentity = WalletRedux.selectIdentityAction(
      identity.seedAsHex
    )

    const emptyState = deserialize()
    assertStateToBeDeserializedAsExpected(emptyState)

    persistentStore.store.dispatch(saveIdentityAction)
    const stateWithIdentity = persistentStore.store.getState()
    assertStateToBeDeserializedAsExpected(stateWithIdentity)

    persistentStore.store.dispatch(selectActionIdentity)
    const stateWithSelected = persistentStore.store.getState()
    assertStateToBeDeserializedAsExpected(stateWithSelected)
  })
})
