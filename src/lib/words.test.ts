import { describe, expect, it } from 'vitest'
import { formatMonthYear, numberWord, summaryLine } from './words'

describe('numberWord', () => {
  it('spells out small numbers and falls back to digits', () => {
    expect(numberWord(4)).toBe('four')
    expect(numberWord(9, true)).toBe('Nine')
    expect(numberWord(42)).toBe('42')
  })
})

describe('summaryLine', () => {
  it('reads naturally', () => {
    expect(summaryLine(9, 4)).toBe('Nine memories, four of them on your profile.')
    expect(summaryLine(1, 0)).toBe('One memory, none on your profile yet.')
    expect(summaryLine(3, 3)).toBe('Three memories, all on your profile.')
    expect(summaryLine(1, 1)).toBe('One memory, on your profile.')
    expect(summaryLine(0, 0)).toBe('Nothing kept yet.')
  })
})

describe('formatMonthYear', () => {
  it('formats ISO dates in British style', () => {
    expect(formatMonthYear('2019-03-12')).toBe('Mar 2019')
  })

  it('handles missing or bad dates', () => {
    expect(formatMonthYear(null)).toBe('')
    expect(formatMonthYear('not-a-date')).toBe('')
  })
})
