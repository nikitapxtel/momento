import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppState } from '../app/AppState'
import { listPublicProfiles } from '../lib/api'
import { demoProfile } from '../lib/demo'
import { isDemo } from '../lib/supabase'
import type { Profile } from '../lib/types'

export function Explore() {
  const { setToneKind } = useAppState()
  const [people, setPeople] = useState<Profile[] | null>(isDemo ? [demoProfile] : null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setToneKind('none'), [setToneKind])

  useEffect(() => {
    if (isDemo) return
    let active = true
    listPublicProfiles()
      .then((p) => active && setPeople(p))
      .catch(() => active && setError('We couldn’t load other boxes right now.'))
    return () => {
      active = false
    }
  }, [])

  return (
    <main id="main">
      <div className="page-head">
        <h1 className="page-title">Other people’s boxes.</h1>
        <p className="page-sub">Little things others have chosen to share.</p>
      </div>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {people && people.length === 0 && <p className="notice">Nobody has shared a box yet.</p>}
      {people && people.length > 0 && (
        <ul className="people" style={{ listStyle: 'none' }}>
          {people.map((p) => (
            <li key={p.id}>
              <Link to={`/u/${p.handle}`} className="person">
                <h2>{p.displayName || p.handle}</h2>
                <p>@{p.handle}</p>
                {p.bio && <p style={{ marginTop: 8 }}>{p.bio}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
