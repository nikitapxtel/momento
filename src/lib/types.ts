export const MEMORY_KINDS = [
  'card',
  'photo',
  'ticket',
  'letter',
  'postcard',
  'flower',
  'object',
] as const

export type MemoryKind = (typeof MEMORY_KINDS)[number]

/** One scanned side of a memory: an image, a typed note, or both. */
export interface MemorySide {
  id: string
  position: number
  label: string
  /** Signed or demo URL ready for an <img>. Never a raw storage path. */
  imageUrl: string | null
  note: string | null
  width: number | null
  height: number | null
}

export interface Memory {
  id: string
  ownerId: string
  kind: MemoryKind
  title: string
  place: string
  /** ISO date (yyyy-mm-dd) of when the memory happened. */
  happenedOn: string | null
  story: string
  isShown: boolean
  sides: MemorySide[]
  /**
   * Optional hand-built 3D form for objects that aren't flat, e.g. a fabric wristband.
   * Not stored in the database yet; used by the sample box.
   */
  model?: 'band'
}

export interface Profile {
  id: string
  handle: string
  displayName: string
  bio: string
  isPublic: boolean
}

/** Default side labels offered when adding each kind of memory. */
export const DEFAULT_SIDES: Record<MemoryKind, string[]> = {
  card: ['Front', 'Inside', 'Back'],
  photo: ['Front', 'Back'],
  ticket: ['Front', 'Back'],
  letter: ['Envelope', 'Letter'],
  postcard: ['Front', 'Back'],
  flower: ['Front', 'Back'],
  object: ['Front'],
}

export const KIND_LABELS: Record<MemoryKind, string> = {
  card: 'Card',
  photo: 'Photo',
  ticket: 'Ticket',
  letter: 'Letter',
  postcard: 'Postcard',
  flower: 'Pressed flower',
  object: 'Object',
}
