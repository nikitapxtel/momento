import { describe, expect, it } from 'vitest'
import {
  FRONT_SLOT,
  OPEN_SLOT_CARD,
  SIDE_SLOT,
  clampIndex,
  fitWithin,
  itemPose,
  rowOffset,
  slotWidth,
} from './carousel'

describe('slotWidth', () => {
  it('gives the active item the wide front slot', () => {
    expect(slotWidth({ index: 2, active: 2, openIndex: null, isCard: false })).toBe(FRONT_SLOT)
    expect(slotWidth({ index: 1, active: 2, openIndex: null, isCard: false })).toBe(SIDE_SLOT)
  })

  it('makes room for an opened card to unfold', () => {
    expect(slotWidth({ index: 2, active: 2, openIndex: 2, isCard: true })).toBe(OPEN_SLOT_CARD)
  })
})

describe('rowOffset', () => {
  it('centres the active slot', () => {
    const widths = [100, 300, 100]
    // centre of slot 1 is 100 + 150 = 250 from the row's left edge
    expect(rowOffset(widths, 1)).toBe(-250)
    expect(rowOffset(widths, 0)).toBe(-50)
  })
})

describe('itemPose', () => {
  it('faces the active item forwards and fully lit', () => {
    expect(itemPose(3, 3)).toEqual({ rotateY: 0, scale: 1, light: 1 })
  })

  it('turns neighbours towards the centre and dims them with distance', () => {
    const left = itemPose(1, 3)
    const right = itemPose(5, 3)
    expect(left.rotateY).toBeGreaterThan(0)
    expect(right.rotateY).toBeLessThan(0)
    expect(itemPose(2, 3).light).toBeGreaterThan(itemPose(0, 3).light)
    expect(itemPose(0, 20).light).toBeGreaterThanOrEqual(0.62)
  })
})

describe('clampIndex', () => {
  it('keeps the index inside the list', () => {
    expect(clampIndex(-1, 5)).toBe(0)
    expect(clampIndex(9, 5)).toBe(4)
    expect(clampIndex(3, 0)).toBe(0)
  })
})

describe('fitWithin', () => {
  it('keeps aspect ratio inside the box', () => {
    expect(fitWithin(4000, 3000, 300, 300)).toEqual({ w: 300, h: 225 })
    expect(fitWithin(1000, 2000, 300, 300)).toEqual({ w: 150, h: 300 })
  })

  it('falls back to a portrait shape when size is unknown', () => {
    expect(fitWithin(null, null, 300, 400)).toEqual({ w: 300, h: 400 })
  })
})
