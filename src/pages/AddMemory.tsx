import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../app/AppState'
import { useAuth } from '../app/AuthProvider'
import { createMemory, validateNewMemory, type NewSide } from '../lib/api'
import { validateImageFile } from '../lib/image'
import { DEFAULT_SIDES, KIND_LABELS, MEMORY_KINDS, type MemoryKind } from '../lib/types'

function sidesFor(kind: MemoryKind): NewSide[] {
  return DEFAULT_SIDES[kind].map((label) => ({ label, file: null, note: '' }))
}

function SideInput({
  side,
  index,
  onChange,
  onRemove,
}: {
  side: NewSide
  index: number
  onChange: (s: NewSide) => void
  onRemove?: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const preview = useMemo(() => (side.file ? URL.createObjectURL(side.file) : null), [side.file])
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )

  const pick = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    const check = validateImageFile(file)
    if (!check.ok) {
      setError(check.reason)
      return
    }
    setError(null)
    onChange({ ...side, file })
  }

  const id = `side-${index}`
  return (
    <div className="side-card">
      <div className="side-preview" aria-hidden="true">
        {preview ? <img src={preview} alt="" /> : 'No image'}
      </div>
      <div>
        <div className="field" style={{ marginBottom: 10 }}>
          <label htmlFor={`${id}-label`}>Side name</label>
          <input
            id={`${id}-label`}
            type="text"
            value={side.label}
            maxLength={40}
            onChange={(e) => onChange({ ...side, label: e.target.value })}
          />
        </div>
        <div className="choice-row" style={{ marginBottom: 10 }}>
          <label className="pill file-btn">
            Scan with camera
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(e) => pick(e.target.files)}
            />
          </label>
          <label className="pill file-btn">
            Upload a photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => pick(e.target.files)}
            />
          </label>
          {side.file && (
            <button
              type="button"
              className="text-btn"
              onClick={() => onChange({ ...side, file: null })}
            >
              Remove image
            </button>
          )}
          {onRemove && (
            <button type="button" className="text-btn" onClick={onRemove}>
              Remove side
            </button>
          )}
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="field">
          <label htmlFor={`${id}-note`}>Words on this side (optional)</label>
          <textarea
            id={`${id}-note`}
            value={side.note}
            maxLength={4000}
            onChange={(e) => onChange({ ...side, note: e.target.value })}
            aria-describedby={`${id}-hint`}
          />
          <span id={`${id}-hint`} className="hint">
            Type out a message so it’s kept even if the handwriting fades.
          </span>
        </div>
      </div>
    </div>
  )
}

export function AddMemory() {
  const { userId } = useAuth()
  const { setToneKind } = useAppState()
  const navigate = useNavigate()
  const [kind, setKind] = useState<MemoryKind>('card')
  const [sides, setSides] = useState<NewSide[]>(() => sidesFor('card'))
  const [title, setTitle] = useState('')
  const [place, setPlace] = useState('')
  const [happenedOn, setHappenedOn] = useState('')
  const [story, setStory] = useState('')
  const [isShown, setIsShown] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setToneKind(kind), [kind, setToneKind])

  const chooseKind = (k: MemoryKind) => {
    setKind(k)
    setSides((prev) => (prev.some((s) => s.file || s.note) ? prev : sidesFor(k)))
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!userId) return
    const draft = { kind, title, place, happenedOn: happenedOn || null, story, isShown, sides }
    const problem = validateNewMemory(draft)
    if (problem) {
      setError(problem)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await createMemory(userId, draft)
      navigate('/')
    } catch (err) {
      setError(
        err instanceof Error && err.message ? err.message : 'That didn’t save. Please try again.',
      )
      setSaving(false)
    }
  }

  return (
    <main id="main">
      <div className="page-head">
        <h1 className="page-title">Keep something new.</h1>
        <p className="page-sub">Scan each side, so nothing is lost if the original is.</p>
      </div>
      <form className="panel" onSubmit={save} noValidate>
        <fieldset style={{ border: 0, padding: 0, margin: '0 0 18px' }}>
          <legend className="label" style={{ fontSize: 15, opacity: 0.75, marginBottom: 6 }}>
            What is it?
          </legend>
          <div className="choice-row">
            {MEMORY_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                className="text-btn"
                aria-pressed={k === kind}
                onClick={() => chooseKind(k)}
              >
                {KIND_LABELS[k]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="place">Where</label>
          <input
            id="place"
            type="text"
            maxLength={120}
            value={place}
            onChange={(e) => setPlace(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="date">When</label>
          <input
            id="date"
            type="date"
            value={happenedOn}
            onChange={(e) => setHappenedOn(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="story">The story</label>
          <textarea
            id="story"
            maxLength={2000}
            value={story}
            onChange={(e) => setStory(e.target.value)}
          />
        </div>

        <h2 style={{ fontWeight: 400, fontSize: 24, margin: '28px 0 4px' }}>Sides</h2>
        <p className="hint" style={{ margin: '0 0 8px', fontStyle: 'italic', opacity: 0.65 }}>
          Photos are cleaned before upload: location and camera details are removed.
        </p>
        {sides.map((s, i) => (
          <SideInput
            key={i}
            side={s}
            index={i}
            onChange={(next) => setSides((all) => all.map((x, j) => (j === i ? next : x)))}
            onRemove={
              sides.length > 1 ? () => setSides((all) => all.filter((_, j) => j !== i)) : undefined
            }
          />
        ))}
        {sides.length < 6 && (
          <button
            type="button"
            className="text-btn"
            onClick={() =>
              setSides((all) => [...all, { label: `Side ${all.length + 1}`, file: null, note: '' }])
            }
          >
            + Add another side
          </button>
        )}

        <label className="check" style={{ marginTop: 20 }}>
          <input type="checkbox" checked={isShown} onChange={(e) => setIsShown(e.target.checked)} />
          <span>
            Show this on my profile
            <span style={{ display: 'block', fontSize: 14, fontStyle: 'italic', opacity: 0.65 }}>
              Off by default. Only people who can see your public profile will see it.
            </span>
          </span>
        </label>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button type="submit" className="pill solid" disabled={saving}>
            {saving ? 'Keeping it safe…' : 'Keep it'}
          </button>
          <button type="button" className="text-btn" onClick={() => navigate('/')}>
            Cancel
          </button>
        </div>
      </form>
    </main>
  )
}
