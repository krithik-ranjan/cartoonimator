import { createContext, useContext, useReducer } from "react";

import { initialState } from "./Initial-State";
import { animationReducer } from "./Animation-Reducer";

const AnimationContext = createContext(null);

export const AnimationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(animationReducer, initialState)

  return (
    <AnimationContext.Provider value={{state, dispatch}}>
      {children}
    </AnimationContext.Provider>
  )
}

export const useAnimation = () => {
  const context = useContext(AnimationContext)
  if (!context) {
    throw new Error('useAnimation must be used within AnimationProvider')
  }

  return context
}