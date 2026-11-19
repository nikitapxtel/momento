/**
 * Who may see a memory. This mirrors the database Row Level Security policies in
 * supabase/migrations so the UI never offers something the database will refuse.
 * The database is the real gatekeeper; this function is only for display decisions.
 */
export interface VisibilityInput {
  viewerId: string | null
  ownerId: string
  ownerProfileIsPublic: boolean
  memoryIsShown: boolean
}

export function canViewMemory({
  viewerId,
  ownerId,
  ownerProfileIsPublic,
  memoryIsShown,
}: VisibilityInput): boolean {
  if (viewerId !== null && viewerId === ownerId) return true
  return ownerProfileIsPublic && memoryIsShown
}

export function canViewProfile(
  viewerId: string | null,
  profileId: string,
  isPublic: boolean,
): boolean {
  return isPublic || (viewerId !== null && viewerId === profileId)
}
