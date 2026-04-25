'use client'

import { createContext, useContext, ReactNode } from 'react'

type OpenEdgeMenu = (edgeId: string, x: number, y: number) => void

const EdgeMenuContext = createContext<OpenEdgeMenu | null>(null)

export function EdgeMenuProvider({
  value,
  children,
}: {
  value: OpenEdgeMenu
  children: ReactNode
}) {
  return <EdgeMenuContext.Provider value={value}>{children}</EdgeMenuContext.Provider>
}

export function useEdgeMenu(): OpenEdgeMenu | null {
  return useContext(EdgeMenuContext)
}
