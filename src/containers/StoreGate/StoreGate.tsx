// import React, { useContext, useEffect, useState } from 'react'
// import { Provider } from 'react-redux'
// import { Store } from 'redux'

// import { persistentStoreInstance } from '../../state/PersistentStore'
// import PasswordContext from '../../utils/PasswordContext/PasswordContext'

// const StoreGate: React.FC = ({ children }) => {
//   const password = useContext(PasswordContext)

//   const [store, setStore] = useState<Store | null>(null)

//   useEffect(() => {
//     const initStore = async (): Promise<void> => {
//       const newStore = await persistentStoreInstance.init(password)
//       setStore(newStore)
//     }

//     initStore()
//   }, [password])

//   if (!store) return null

//   return <Provider store={store}>{children}</Provider>
// }

// export default StoreGate
