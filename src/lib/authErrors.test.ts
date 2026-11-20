import { describe, expect, it } from 'vitest'
import { signInErrorMessage } from './authErrors'

describe('signInErrorMessage', () => {
  it('explains rate limits', () => {
    expect(signInErrorMessage({ code: 'over_email_send_rate_limit', status: 429 })).toMatch(
      /Too many/,
    )
    expect(signInErrorMessage({ status: 429 })).toMatch(/Too many/)
    expect(signInErrorMessage({ message: 'email rate limit exceeded' })).toMatch(/Too many/)
  })

  it('explains a bad address', () => {
    expect(signInErrorMessage({ code: 'email_address_invalid' })).toMatch(/doesn’t look right/)
  })

  it('does not blame the email address for a bad API key', () => {
    expect(signInErrorMessage({ status: 401, message: 'Invalid API key' })).toMatch(/invalid key/)
  })

  it('explains when email sign-in is switched off', () => {
    expect(signInErrorMessage({ code: 'signup_disabled' })).toMatch(/switched off/)
    expect(signInErrorMessage({ message: 'Signups not allowed for otp' })).toMatch(/switched off/)
  })

  it('explains connection problems', () => {
    expect(signInErrorMessage({ status: 0, message: 'Failed to fetch' })).toMatch(
      /reach the server/,
    )
  })

  it('includes an error reference for anything else', () => {
    expect(signInErrorMessage({ code: 'unexpected_failure', status: 500 })).toMatch(
      /\(Error: unexpected_failure\)/,
    )
    expect(signInErrorMessage({})).not.toMatch(/Error:/)
  })
})
