import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppState } from '../app/AppState'
import { useAuth } from '../app/AuthProvider'
import { supabase } from '../lib/supabase'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SignIn() {
  const { userId } = useAuth()
  const { setToneKind } = useAppState()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => setToneKind('none'), [setToneKind])

  if (userId) return <Navigate to="/" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    if (!EMAIL.test(email.trim())) {
      setStatus('error')
      setMessage('Please enter a valid email address.')
      return
    }
    setStatus('sending')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}` },
    })
    if (error) {
      setStatus('error')
      // Keep the message generic so the form never reveals whether an account exists.
      setMessage('We couldn’t send the link just now. Please wait a moment and try again.')
    } else {
      setStatus('sent')
      setMessage('Check your inbox: we’ve sent you a link to sign in.')
    }
  }

  return (
    <main id="main">
      <div className="page-head">
        <h1 className="page-title">Welcome to Momento.</h1>
        <p className="page-sub">
          Sign in or create your box with just your email. No password needed.
        </p>
      </div>
      <form className="panel" onSubmit={submit} noValidate style={{ maxWidth: 440 }}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby="email-msg"
          />
        </div>
        <p id="email-msg" className={status === 'error' ? 'error' : 'success'} aria-live="polite">
          {message}
        </p>
        <button type="submit" className="pill solid" disabled={status === 'sending' || !supabase}>
          {status === 'sending' ? 'Sending…' : 'Send me a sign-in link'}
        </button>
      </form>
    </main>
  )
}
