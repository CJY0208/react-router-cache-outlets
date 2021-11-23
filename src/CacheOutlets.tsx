import * as React from 'react'
import { useRef, useContext, useCallback, useMemo, useEffect } from 'react'
import { useOutlet } from 'react-router-dom'
import { Freeze } from 'react-freeze'

import cacheContext from './context'

export interface CacheOutletsProps {
  exclude?: string[]
  max?: number
}

const { Provider: CacheProvider } = cacheContext

function useUpdate(): () => void {
  const [, setTrigger] = useState({})
  const update = useCallback(() => setTrigger({}), [])
  return update
}

export function useCacheOutletsControl() {
  return useContext(cacheContext)
}

export function useCacheOutlets({ exclude = [], max = Infinity }: CacheOutletsProps = {}) {
  const { drop: dropOutside } = useCacheOutletsControl()
  const update = useUpdate()
  const cacheOutlets = useRef<any>({})
  const outletRenderKeys = useRef<any>({})
  const currentOutlet = useOutlet()

  const matchedPath = [...(currentOutlet?.props?.value?.matches ?? [])].pop()?.pathname
  if (matchedPath) {
    cacheOutlets.current[matchedPath] = currentOutlet
    outletRenderKeys.current[matchedPath] = outletRenderKeys.current[matchedPath] ?? Math.random()
  }

  const drop = useCallback((path) => {
    delete cacheOutlets.current[path]
    outletRenderKeys.current[path] = Math.random()

    if (typeof dropOutside === 'function') {
      dropOutside(path)
    }

    update()
  }, [])

  const ctxValue = useMemo(
    () => ({
      drop,
    }),
    [],
  )

  useEffect(() => {
    if (exclude.includes(matchedPath)) {
      return () => drop(matchedPath)
    }
  }, [matchedPath])

  const renderConfigs = Object.entries(cacheOutlets.current).slice(-1 * max) // 限制最大渲染数

  cacheOutlets.current = {} // 先清空，目的是应用最大渲染数

  return (
    <CacheProvider value={ctxValue}>
      {renderConfigs.map(([pathname, element]: any) => {
        cacheOutlets.current[pathname] = element // 恢复幸存内容

        const outletRenderKey = outletRenderKeys.current[pathname]
        const isMatch = currentOutlet === element

        return (
          // @ts-ignore
          <Freeze key={outletRenderKey} freeze={!isMatch}>
            {element}
          </Freeze>
        )
      })}
    </CacheProvider>
  )
}

export default function CacheOutlets(props: CacheOutletsProps) {
  return <>{useCacheOutlets(props)}</>
}
