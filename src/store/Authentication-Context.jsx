import { createContext, useState, useEffect } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const auth = getAuth()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currUser) => {
      setUser(currUser)
    })

    console.log('Authentication status changed')
    return () => unsubscribe()
  }, [auth])

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider