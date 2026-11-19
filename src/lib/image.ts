/**
 * Image intake. Every photo is decoded and re-drawn onto a canvas before upload.
 * Re-encoding discards all metadata, including EXIF GPS coordinates that phones
 * embed, so a memory never reveals where someone lives.
 */

export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const MAX_INPUT_BYTES = 15 * 1024 * 1024
export const MAX_EDGE = 2400

export type ValidationResult = { ok: true } | { ok: false; reason: string }

export function validateImageFile(file: { type: string; size: number }): ValidationResult {
  if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, reason: 'Please choose a JPEG, PNG or WebP image.' }
  }
  if (file.size <= 0) return { ok: false, reason: 'That file is empty.' }
  if (file.size > MAX_INPUT_BYTES) {
    return { ok: false, reason: 'That image is over 15 MB. Please choose a smaller one.' }
  }
  return { ok: true }
}

/** Largest size that fits within MAX_EDGE on both sides, never upscaling. */
export function targetSize(width: number, height: number, maxEdge = MAX_EDGE) {
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/** Check the file's real signature, not just the name or claimed type. */
export async function sniffImageType(blob: Blob): Promise<string | null> {
  const b = new Uint8Array(await blob.slice(0, 12).arrayBuffer())
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  )
    return 'image/webp'
  return null
}

export interface CleanImage {
  blob: Blob
  width: number
  height: number
}

/** Decode, honour camera orientation, shrink, and re-encode as WebP with no metadata. */
export async function cleanImage(file: File): Promise<CleanImage> {
  const check = validateImageFile(file)
  if (!check.ok) throw new Error(check.reason)
  const real = await sniffImageType(file)
  if (real === null || real !== file.type) {
    throw new Error('That file does not look like a real image.')
  }
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const { width, height } = targetSize(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not process the image.')
    ctx.drawImage(bitmap, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.88),
    )
    if (!blob) throw new Error('Could not process the image.')
    return { blob, width, height }
  } finally {
    bitmap.close()
  }
}
