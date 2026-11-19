import { STORAGE_BUCKET, supabase } from './supabase'
import { cleanImage } from './image'
import { MEMORY_KINDS, type Memory, type MemoryKind, type MemorySide, type Profile } from './types'

/** Rows as stored in Postgres (see supabase/migrations). */
interface ProfileRow {
  id: string
  handle: string
  display_name: string
  bio: string
  is_public: boolean
}

interface SideRow {
  id: string
  position: number
  label: string
  image_path: string | null
  note: string | null
  width: number | null
  height: number | null
}

interface MemoryRow {
  id: string
  owner_id: string
  kind: string
  title: string
  place: string
  happened_on: string | null
  story: string
  is_shown: boolean
  memory_sides: SideRow[] | null
}

const SIGNED_URL_SECONDS = 60 * 60
export const HANDLE_PATTERN = /^[a-z0-9_]{3,30}$/

function requireClient() {
  if (!supabase) throw new Error('Momento is running in demo mode, so changes are not saved.')
  return supabase
}

export function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    bio: row.bio,
    isPublic: row.is_public,
  }
}

function toKind(value: string): MemoryKind {
  return (MEMORY_KINDS as readonly string[]).includes(value) ? (value as MemoryKind) : 'object'
}

/** Convert rows to app objects, swapping private storage paths for short-lived signed URLs. */
export async function toMemories(rows: MemoryRow[]): Promise<Memory[]> {
  const client = requireClient()
  const paths = rows.flatMap((r) =>
    (r.memory_sides ?? []).map((s) => s.image_path).filter((p): p is string => !!p),
  )
  const urls = new Map<string, string>()
  if (paths.length > 0) {
    const { data, error } = await client.storage
      .from(STORAGE_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_SECONDS)
    if (error) throw error
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl)
    }
  }
  return rows.map((r) => ({
    id: r.id,
    ownerId: r.owner_id,
    kind: toKind(r.kind),
    title: r.title,
    place: r.place,
    happenedOn: r.happened_on,
    story: r.story,
    isShown: r.is_shown,
    sides: [...(r.memory_sides ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((s): MemorySide => ({
        id: s.id,
        position: s.position,
        label: s.label,
        imageUrl: s.image_path ? (urls.get(s.image_path) ?? null) : null,
        note: s.note,
        width: s.width,
        height: s.height,
      })),
  }))
}

const MEMORY_SELECT =
  'id, owner_id, kind, title, place, happened_on, story, is_shown, memory_sides(id, position, label, image_path, note, width, height)'

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const client = requireClient()
  const { data, error } = await client
    .from('profiles')
    .select('id, handle, display_name, bio, is_public')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data ? toProfile(data as ProfileRow) : null
}

export async function updateMyProfile(
  userId: string,
  changes: Partial<Pick<Profile, 'handle' | 'displayName' | 'bio' | 'isPublic'>>,
): Promise<void> {
  const client = requireClient()
  if (changes.handle !== undefined && !HANDLE_PATTERN.test(changes.handle)) {
    throw new Error('Usernames are 3–30 characters: lowercase letters, numbers and underscores.')
  }
  const row: Partial<ProfileRow> = {}
  if (changes.handle !== undefined) row.handle = changes.handle
  if (changes.displayName !== undefined) row.display_name = changes.displayName.slice(0, 80)
  if (changes.bio !== undefined) row.bio = changes.bio.slice(0, 280)
  if (changes.isPublic !== undefined) row.is_public = changes.isPublic
  const { error } = await client.from('profiles').update(row).eq('id', userId)
  if (error) throw error
}

export async function listMyMemories(userId: string): Promise<Memory[]> {
  const client = requireClient()
  const { data, error } = await client
    .from('memories')
    .select(MEMORY_SELECT)
    .eq('owner_id', userId)
    .order('happened_on', { ascending: true, nullsFirst: false })
  if (error) throw error
  return toMemories((data ?? []) as MemoryRow[])
}

export async function listPublicProfiles(): Promise<Profile[]> {
  const client = requireClient()
  const { data, error } = await client
    .from('profiles')
    .select('id, handle, display_name, bio, is_public')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(60)
  if (error) throw error
  return ((data ?? []) as ProfileRow[]).map(toProfile)
}

export async function getPublicBox(
  handle: string,
): Promise<{ profile: Profile; memories: Memory[] } | null> {
  const client = requireClient()
  if (!HANDLE_PATTERN.test(handle)) return null
  const { data: p, error } = await client
    .from('profiles')
    .select('id, handle, display_name, bio, is_public')
    .eq('handle', handle)
    .maybeSingle()
  if (error) throw error
  if (!p) return null
  // Row Level Security only returns shown items of public profiles (or your own).
  const { data, error: mErr } = await client
    .from('memories')
    .select(MEMORY_SELECT)
    .eq('owner_id', (p as ProfileRow).id)
    .eq('is_shown', true)
    .order('happened_on', { ascending: true, nullsFirst: false })
  if (mErr) throw mErr
  return {
    profile: toProfile(p as ProfileRow),
    memories: await toMemories((data ?? []) as MemoryRow[]),
  }
}

export async function setMemoryShown(memoryId: string, isShown: boolean): Promise<void> {
  const client = requireClient()
  const { error } = await client.from('memories').update({ is_shown: isShown }).eq('id', memoryId)
  if (error) throw error
}

export async function deleteMemory(userId: string, memory: Memory): Promise<void> {
  const client = requireClient()
  const { data: files } = await client.storage.from(STORAGE_BUCKET).list(`${userId}/${memory.id}`)
  if (files && files.length > 0) {
    await client.storage
      .from(STORAGE_BUCKET)
      .remove(files.map((f) => `${userId}/${memory.id}/${f.name}`))
  }
  const { error } = await client.from('memories').delete().eq('id', memory.id)
  if (error) throw error
}

export interface NewSide {
  label: string
  file: File | null
  note: string
}

export interface NewMemory {
  kind: MemoryKind
  title: string
  place: string
  happenedOn: string | null
  story: string
  isShown: boolean
  sides: NewSide[]
}

export function validateNewMemory(m: NewMemory): string | null {
  if (!m.title.trim()) return 'Give your memory a title.'
  if (m.title.length > 120) return 'Titles can be up to 120 characters.'
  if (m.story.length > 2000) return 'The story can be up to 2,000 characters.'
  if (m.place.length > 120) return 'The place can be up to 120 characters.'
  if (m.sides.length === 0 || m.sides.length > 6) return 'A memory needs between one and six sides.'
  if (!m.sides[0]?.file) return 'Add a photo or scan of the front.'
  for (const s of m.sides) {
    if (s.note.length > 4000) return 'Notes can be up to 4,000 characters.'
  }
  return null
}

export async function createMemory(userId: string, m: NewMemory): Promise<string> {
  const problem = validateNewMemory(m)
  if (problem) throw new Error(problem)
  const client = requireClient()

  const { data: created, error } = await client
    .from('memories')
    .insert({
      owner_id: userId,
      kind: m.kind,
      title: m.title.trim(),
      place: m.place.trim(),
      happened_on: m.happenedOn || null,
      story: m.story.trim(),
      is_shown: m.isShown,
    })
    .select('id')
    .single()
  if (error) throw error
  const memoryId = (created as { id: string }).id

  try {
    for (const [position, s] of m.sides.entries()) {
      let imagePath: string | null = null
      let width: number | null = null
      let height: number | null = null
      if (s.file) {
        const clean = await cleanImage(s.file)
        imagePath = `${userId}/${memoryId}/${crypto.randomUUID()}.webp`
        const { error: upErr } = await client.storage
          .from(STORAGE_BUCKET)
          .upload(imagePath, clean.blob, { contentType: 'image/webp', upsert: false })
        if (upErr) throw upErr
        width = clean.width
        height = clean.height
      }
      const { error: sErr } = await client.from('memory_sides').insert({
        memory_id: memoryId,
        owner_id: userId,
        position,
        label: s.label.slice(0, 40),
        image_path: imagePath,
        note: s.note.trim() || null,
        width,
        height,
      })
      if (sErr) throw sErr
    }
  } catch (e) {
    // Don't leave a half-saved memory behind.
    await deleteMemory(userId, { id: memoryId } as Memory).catch(() => undefined)
    throw e
  }
  return memoryId
}
