import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppState } from '../app/AppState'
import { useAuth } from '../app/AuthProvider'
import { Carousel } from '../components/Carousel'
import { listMyMemories, setMemoryShown } from '../lib/api'
import { demoMemories } from '../lib/demo'
import { isDemo } from '../lib/supabase'
import type { Memory } from '../lib/types'
import { summaryLine } from '../lib/words'

export function MyBox() {
  const { userId, loading: authLoading } = useAuth()
  const { setToneKind } = useAppState()
  const [sample, setSample] = useState<Memory[]>(demoMemories)
  const [mine, setMine] = useState<Memory[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const showingSample = isDemo || (!authLoading && !userId)
  const memories = showingSample ? sample : authLoading ? null : mine
  const setMemories = useCallback(
    (f: (l: Memory[] | null) => Memory[] | null) =>
      showingSample ? setSample((l) => f(l) ?? l) : setMine(f),
    [showingSample],
  )

  useEffect(() => {
    if (authLoading || showingSample) return
    let active = true
    listMyMemories(userId as string)
      .then((m) => active && setMine(m))
      .catch(() => active && setError('We couldn’t load your box. Please try again.'))
    return () => {
      active = false
    }
  }, [authLoading, showingSample, userId])

  const onActiveChange = useCallback(
    (m: Memory | undefined) => setToneKind(m?.kind ?? 'none'),
    [setToneKind],
  )

  const toggleShown = useCallback(
    async (memory: Memory) => {
      const next = !memory.isShown
      setMemories(
        (list) => list?.map((m) => (m.id === memory.id ? { ...m, isShown: next } : m)) ?? null,
      )
      if (showingSample) return
      try {
        await setMemoryShown(memory.id, next)
      } catch {
        setMemories(
          (list) => list?.map((m) => (m.id === memory.id ? { ...m, isShown: !next } : m)) ?? null,
        )
        setError('That change didn’t save. Please try again.')
      }
    },
    [showingSample, setMemories],
  )

  const total = memories?.length ?? 0
  const shown = memories?.filter((m) => m.isShown).length ?? 0

  return (
    <main id="main">
      <div className="page-head">
        <h1 className="page-title">Everything you’ve kept.</h1>
        <p className="page-sub">{memories ? summaryLine(total, shown) : ' '}</p>
      </div>
      {showingSample && (
        <p className="notice">
          {isDemo ? 'This is a sample box, showing how Momento looks.' : 'This is a sample box. '}
          {!isDemo && (
            <>
              <Link to="/sign-in">Sign in</Link> to start keeping your own.
            </>
          )}
        </p>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {memories && memories.length > 0 && (
        <Carousel
          memories={memories}
          onActiveChange={onActiveChange}
          onToggleShown={toggleShown}
          initialIndex={1}
        />
      )}
      {memories && memories.length === 0 && (
        <div className="panel" style={{ textAlign: 'center' }}>
          <p className="page-sub" style={{ marginBottom: 20 }}>
            Your box is empty for now.
          </p>
          <Link to="/add" className="pill">
            Add your first memory
          </Link>
        </div>
      )}
      <p className="page-foot">Keep the little things.</p>
    </main>
  )
}
