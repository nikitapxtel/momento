/** Pure layout maths for the memory row, kept separate so it can be unit tested. */

export const SIDE_SLOT = 118
export const FRONT_SLOT = 360
export const OPEN_SLOT_CARD = 600
export const OPEN_SLOT_OTHER = 360

export interface SlotInput {
  index: number
  active: number
  openIndex: number | null
  isCard: boolean
}

export function slotWidth({ index, active, openIndex, isCard }: SlotInput): number {
  if (openIndex === index) return isCard ? OPEN_SLOT_CARD : OPEN_SLOT_OTHER
  return index === active ? FRONT_SLOT : SIDE_SLOT
}

/** Horizontal offset (px) that puts the centre of the active slot at the middle of the row. */
export function rowOffset(widths: number[], active: number): number {
  let before = 0
  for (let i = 0; i < active; i++) before += widths[i] ?? 0
  return -(before + (widths[active] ?? 0) / 2)
}

export interface ItemPose {
  rotateY: number
  scale: number
  light: number
}

export function itemPose(index: number, active: number): ItemPose {
  const d = index - active
  if (d === 0) return { rotateY: 0, scale: 1, light: 1 }
  return {
    rotateY: d < 0 ? 52 : -52,
    scale: 0.84,
    light: Math.max(0.62, 0.86 - (Math.abs(d) - 1) * 0.06),
  }
}

export function clampIndex(i: number, count: number): number {
  if (count <= 0) return 0
  return Math.max(0, Math.min(count - 1, i))
}

/** Fit an image of the given size inside a box, keeping its aspect ratio. */
export function fitWithin(
  width: number | null,
  height: number | null,
  maxW: number,
  maxH: number,
): { w: number; h: number } {
  const w = width && width > 0 ? width : 3
  const h = height && height > 0 ? height : 4
  const scale = Math.min(maxW / w, maxH / h)
  return { w: Math.round(w * scale), h: Math.round(h * scale) }
}
