import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppState } from '../app/AppState'
import { Carousel } from '../components/Carousel'
import { getPublicBox } from '../lib/api'
import { demoMemories, demoProfile } from '../lib/demo'
import { isDemo } from '../lib/supabase'
import type { Memory, Profile } from '../lib/types'
import { numberWord } from '../lib/words'

type Box = { profile: Profile; memories: Memory[] }

export function PublicBox() {
  const { handle = '' } = useParams()
  const { setToneKind } = useAppState()
  const [loaded, setLoaded] = useState<{ handle: string; box: Box | null } | null>(null)
  const state: Box | null | undefined = isDemo
    ? handle === demoProfile.handle
      ? { profile: demoProfile, memories: demoMemories.filter((m) => m.isShown) }
      : null
    : loaded?.handle === handle
      ? loaded.box
      : undefined

  useEffect(() => {
    if (isDemo) return
    let active = true
    getPublicBox(handle)
      .then((box) => active && setLoaded({ handle, box }))
      .catch(() => active && setLoaded({ handle, box: null }))
    return () => {
      active = false
    }
  }, [handle])

  const onActiveChange = useCallback(
    (m: Memory | undefined) => setToneKind(m?.kind ?? 'none'),
    [setToneKind],
  )

  if (state === undefined) return <main id="main" className="page-head" aria-busy="true" />

  if (state === null) {
    return (
      <main id="main" className="page-head">
        <h1 className="page-title">Nothing to see here.</h1>
        <p className="page-sub">This box is private, or doesn’t exist.</p>
      </main>
    )
  }

  const { profile, memories } = state
  const n = memories.length
  return (
    <main id="main">
      <div className="page-head">
        <h1 className="page-title">{profile.displayName || profile.handle}’s box.</h1>
        <p className="page-sub">
          {profile.bio || `${numberWord(n, true)} ${n === 1 ? 'memory' : 'memories'} shared.`}
        </p>
      </div>
      {n > 0 ? (
        <Carousel memories={memories} onActiveChange={onActiveChange} />
      ) : (
        <p className="notice">Nothing shared yet.</p>
      )}
    </main>
  )
}
