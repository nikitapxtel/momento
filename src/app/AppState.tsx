import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { MemoryKind } from '../lib/types'

export type Theme = 'dark' | 'light'

const THEME_KEY = 'momento-theme'

/** Deep, solid tones the page takes on for the memory in focus: [dark, light]. */
export const TONES: Record<MemoryKind | 'none', [string, string]> = {
  none: ['#0e0e10', '#f2f0eb'],
  card: ['#2a1410', '#f3e4dc'],
  photo: ['#0f1e26', '#e2ecef'],
  ticket: ['#141416', '#e8e6e2'],
  letter: ['#22100f', '#f1e4e2'],
  postcard: ['#241c0c', '#f2eada'],
  flower: ['#151c10', '#e7eedf'],
  object: ['#102224', '#dfeeef'],
}

function readTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY)
    if (v === 'dark' || v === 'light') return v
  } catch {
    /* storage unavailable */
  }
  return 'dark'
}

interface AppState {
  theme: Theme
  toggleTheme: () => void
  toneKind: MemoryKind | 'none'
  setToneKind: (kind: MemoryKind | 'none') => void
}

const Ctx = createContext<AppState | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readTheme)
  const [toneKind, setToneKind] = useState<MemoryKind | 'none'>('none')

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(THEME_KEY, next)
      } catch {
        /* storage unavailable */
      }
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ theme, toggleTheme, toneKind, setToneKind }),
    [theme, toggleTheme, toneKind],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppState(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAppState must be used inside AppStateProvider')
  return v
}
