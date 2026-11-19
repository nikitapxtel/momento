import { describe, expect, it } from 'vitest'
import { canViewMemory, canViewProfile } from './visibility'

const owner = 'owner-1'
const stranger = 'someone-else'

describe('canViewMemory', () => {
  const cases: Array<[string | null, boolean, boolean, boolean]> = [
    // viewer, profile public, item shown, expected
    [owner, false, false, true],
    [owner, false, true, true],
    [owner, true, false, true],
    [owner, true, true, true],
    [stranger, false, false, false],
    [stranger, false, true, false],
    [stranger, true, false, false],
    [stranger, true, true, true],
    [null, false, false, false],
    [null, false, true, false],
    [null, true, false, false],
    [null, true, true, true],
  ]

  it.each(cases)(
    'viewer %s, public profile %s, shown item %s → %s',
    (viewerId, ownerProfileIsPublic, memoryIsShown, expected) => {
      expect(canViewMemory({ viewerId, ownerId: owner, ownerProfileIsPublic, memoryIsShown })).toBe(
        expected,
      )
    },
  )
})

describe('canViewProfile', () => {
  it('lets anyone see a public profile', () => {
    expect(canViewProfile(null, owner, true)).toBe(true)
    expect(canViewProfile(stranger, owner, true)).toBe(true)
  })

  it('hides a private profile from everyone but its owner', () => {
    expect(canViewProfile(null, owner, false)).toBe(false)
    expect(canViewProfile(stranger, owner, false)).toBe(false)
    expect(canViewProfile(owner, owner, false)).toBe(true)
  })
})
