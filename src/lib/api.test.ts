import { describe, expect, it } from 'vitest'
import { HANDLE_PATTERN, validateNewMemory, type NewMemory } from './api'

const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'front.jpg', { type: 'image/jpeg' })

function draft(over: Partial<NewMemory> = {}): NewMemory {
  return {
    kind: 'card',
    title: 'Gran’s card',
    place: '',
    happenedOn: null,
    story: '',
    isShown: false,
    sides: [{ label: 'Front', file, note: '' }],
    ...over,
  }
}

describe('validateNewMemory', () => {
  it('accepts a complete memory', () => {
    expect(validateNewMemory(draft())).toBeNull()
  })

  it('needs a title and a front image', () => {
    expect(validateNewMemory(draft({ title: '  ' }))).toMatch(/title/)
    expect(
      validateNewMemory(draft({ sides: [{ label: 'Front', file: null, note: 'hi' }] })),
    ).toMatch(/front/)
  })

  it('enforces the same limits as the database', () => {
    expect(validateNewMemory(draft({ title: 'x'.repeat(121) }))).not.toBeNull()
    expect(validateNewMemory(draft({ story: 'x'.repeat(2001) }))).not.toBeNull()
    expect(validateNewMemory(draft({ place: 'x'.repeat(121) }))).not.toBeNull()
    const seven = Array.from({ length: 7 }, () => ({ label: 'S', file, note: '' }))
    expect(validateNewMemory(draft({ sides: seven }))).not.toBeNull()
  })
})

describe('HANDLE_PATTERN', () => {
  it('matches the database rule for usernames', () => {
    expect(HANDLE_PATTERN.test('nikita_92')).toBe(true)
    expect(HANDLE_PATTERN.test('ab')).toBe(false)
    expect(HANDLE_PATTERN.test('Has Capitals')).toBe(false)
    expect(HANDLE_PATTERN.test('../admin')).toBe(false)
  })
})
