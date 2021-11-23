import { createContext } from 'react'

export interface CacheContextType {
  drop: (path: string) => void
}

const context = createContext<CacheContextType>({
  drop: () => undefined,
})

export default context
