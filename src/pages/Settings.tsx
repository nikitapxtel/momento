import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAppState } from '../app/AppState'
import { useAuth } from '../app/AuthProvider'
import { HANDLE_PATTERN, getMyProfile, updateMyProfile } from '../lib/api'
import type { Profile } from '../lib/types'

export function Settings() {
  const { userId, signOut } = useAuth()
  const { setToneKind } = useAppState()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  useEffect(() => {
    setToneKind('none')
    if (!userId) return
    getMyProfile(userId)
      .then(setProfile)
      .catch(() => setMessage({ kind: 'error', text: 'We couldn’t load your profile.' }))
  }, [userId, setToneKind])

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!userId || !profile) return
    if (!HANDLE_PATTERN.test(profile.handle)) {
      setMessage({
        kind: 'error',
        text: 'Usernames are 3–30 characters: lowercase letters, numbers and underscores.',
      })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await updateMyProfile(userId, profile)
      setMessage({ kind: 'success', text: 'Saved.' })
    } catch (err) {
      const duplicate = (err as { code?: string }).code === '23505'
      setMessage({
        kind: 'error',
        text: duplicate ? 'That username is taken.' : 'That didn’t save. Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!profile) {
    return (
      <main id="main" className="page-head" aria-busy="true">
        {message && <p className="error">{message.text}</p>}
      </main>
    )
  }

  const update = (changes: Partial<Profile>) => setProfile({ ...profile, ...changes })

  return (
    <main id="main">
      <div className="page-head">
        <h1 className="page-title">Your profile.</h1>
        <p className="page-sub">Choose what other people can see.</p>
      </div>
      <form className="panel" onSubmit={save}>
        <div className="field">
          <label htmlFor="handle">Username</label>
          <input
            id="handle"
            type="text"
            autoComplete="username"
            value={profile.handle}
            maxLength={30}
            onChange={(e) => update({ handle: e.target.value.toLowerCase() })}
            aria-describedby="handle-hint"
          />
          <span id="handle-hint" className="hint">
            Your box’s address: /u/{profile.handle || 'username'}
          </span>
        </div>
        <div className="field">
          <label htmlFor="name">Display name</label>
          <input
            id="name"
            type="text"
            value={profile.displayName}
            maxLength={80}
            onChange={(e) => update({ displayName: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="bio">About you</label>
          <textarea
            id="bio"
            value={profile.bio}
            maxLength={280}
            onChange={(e) => update({ bio: e.target.value })}
          />
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={profile.isPublic}
            onChange={(e) => update({ isPublic: e.target.checked })}
          />
          <span>
            Make my profile public
            <span
              className="hint"
              style={{ display: 'block', fontSize: 14, fontStyle: 'italic', opacity: 0.65 }}
            >
              Others will see only the memories you’ve chosen to show. Hidden memories always stay
              private.
            </span>
          </span>
        </label>
        {message && (
          <p className={message.kind} aria-live="polite">
            {message.text}
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
          <button type="submit" className="pill solid" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          {profile.isPublic && (
            <Link to={`/u/${profile.handle}`} className="pill">
              View my public box
            </Link>
          )}
          <button type="button" className="text-btn" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </form>
    </main>
  )
}
