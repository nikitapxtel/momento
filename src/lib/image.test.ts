import { describe, expect, it } from 'vitest'
import { MAX_INPUT_BYTES, sniffImageType, targetSize, validateImageFile } from './image'

describe('validateImageFile', () => {
  it('accepts common photo formats', () => {
    expect(validateImageFile({ type: 'image/jpeg', size: 1000 })).toEqual({ ok: true })
    expect(validateImageFile({ type: 'image/png', size: 1000 })).toEqual({ ok: true })
    expect(validateImageFile({ type: 'image/webp', size: 1000 })).toEqual({ ok: true })
  })

  it('rejects anything that is not a supported image', () => {
    expect(validateImageFile({ type: 'image/svg+xml', size: 10 }).ok).toBe(false)
    expect(validateImageFile({ type: 'text/html', size: 10 }).ok).toBe(false)
    expect(validateImageFile({ type: 'application/pdf', size: 10 }).ok).toBe(false)
  })

  it('rejects empty and oversized files', () => {
    expect(validateImageFile({ type: 'image/png', size: 0 }).ok).toBe(false)
    expect(validateImageFile({ type: 'image/png', size: MAX_INPUT_BYTES + 1 }).ok).toBe(false)
  })
})

describe('targetSize', () => {
  it('shrinks large photos to the maximum edge', () => {
    expect(targetSize(4800, 3600)).toEqual({ width: 2400, height: 1800 })
  })

  it('never enlarges small images', () => {
    expect(targetSize(800, 600)).toEqual({ width: 800, height: 600 })
  })
})

describe('sniffImageType', () => {
  const blobOf = (bytes: number[]) => new Blob([new Uint8Array(bytes)])

  it('recognises real image signatures', async () => {
    expect(await sniffImageType(blobOf([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg')
    expect(await sniffImageType(blobOf([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]))).toBe('image/png')
    expect(
      await sniffImageType(blobOf([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])),
    ).toBe('image/webp')
  })

  it('rejects a file pretending to be an image', async () => {
    const html = new TextEncoder().encode('<html><script>')
    expect(await sniffImageType(new Blob([html]))).toBeNull()
  })
})
