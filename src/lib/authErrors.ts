/**
 * Turn a Supabase sign-in error into a helpful message.
 * None of these reveal whether an account exists for the email address.
 */
export interface AuthErrorLike {
  code?: string
  status?: number
  message?: string
}

export function signInErrorMessage(error: AuthErrorLike): string {
  const code = error.code ?? ''
  const text = (error.message ?? '').toLowerCase()

  if (
    code === 'over_email_send_rate_limit' ||
    error.status === 429 ||
    text.includes('rate limit')
  ) {
    return 'Too many sign-in emails have been sent recently. Please wait a few minutes and try again.'
  }
  if (error.status === 401 || text.includes('api key')) {
    return 'Momento can’t talk to its sign-in service right now. (Error: invalid key)'
  }
  if (code === 'email_address_invalid' || (text.includes('email') && text.includes('invalid'))) {
    return 'That email address doesn’t look right. Please check it and try again.'
  }
  if (
    code === 'signup_disabled' ||
    code === 'email_provider_disabled' ||
    text.includes('not allowed')
  ) {
    return 'Sign-in by email is switched off for Momento right now.'
  }
  if (error.status === 0 || text.includes('fetch')) {
    return 'We couldn’t reach the server. Please check your connection and try again.'
  }
  const ref = code || (error.status ? String(error.status) : '')
  return `We couldn’t send the link just now. Please try again in a moment.${ref ? ` (Error: ${ref})` : ''}`
}
