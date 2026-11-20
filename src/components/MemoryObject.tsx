import type { CSSProperties } from 'react'
import { fitWithin } from '../lib/carousel'
import type { Memory, MemoryKind, MemorySide } from '../lib/types'

const THICKNESS: Partial<Record<MemoryKind, number>> = {
  photo: 4,
  ticket: 3,
  postcard: 4,
  letter: 6,
  flower: 6,
  card: 4,
}

const EDGE: Partial<Record<MemoryKind, string>> = {
  photo: '#e4e0d7',
  ticket: '#d6c9ab',
  postcard: '#dccfb6',
  letter: '#cbbd9c',
  flower: '#d8cfbd',
  card: '#e2d8c6',
}

export type ObjectShape = 'fold' | 'cutout' | 'slab' | 'band'

export function shapeOf(memory: Memory): ObjectShape {
  if (memory.model === 'band') return 'band'
  if (memory.kind === 'card' && memory.sides.length >= 2) return 'fold'
  if (memory.kind === 'object') return 'cutout'
  return 'slab'
}

function noteSize(text: string, scale: number): number {
  const base = text.length < 60 ? 26 : text.length < 180 ? 22 : 18
  return Math.round(base * scale)
}

/** One face of a memory: the scanned image, or the typed words if there is no image. */
export function SideFace({
  side,
  cutout = false,
  noteScale = 1,
  style,
}: {
  side: MemorySide | undefined
  cutout?: boolean
  noteScale?: number
  style?: CSSProperties
}) {
  if (side?.imageUrl) {
    return (
      <div className={`face${cutout ? ' cutout' : ''}`} style={style}>
        <img
          src={side.imageUrl}
          alt=""
          draggable={false}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </div>
    )
  }
  return (
    <div className="face" style={style}>
      <div
        className="note-face"
        style={{ fontSize: noteSize(side?.note ?? '', noteScale), padding: 22 * noteScale }}
      >
        {side?.note ?? ''}
      </div>
    </div>
  )
}

const sheen = <div className="sheen" />

/**
 * Solid cut-out objects (shells, stones, trinkets) are built from stacked slices of the photo,
 * slightly tapered towards the front and back so they read as rounded and solid when they turn.
 */
const CUTOUT_DEPTH = 22
const CUTOUT_LAYERS = Array.from({ length: 11 }, (_, i) => {
  const z = -CUTOUT_DEPTH / 2 + i * 2
  const t = Math.abs(z) / (CUTOUT_DEPTH / 2)
  return { z, scale: 1 - t * t * 0.07, light: 0.32 + (1 - t) * 0.28 + (z > 0 ? 0.08 : 0) }
})

/** A woven fabric wristband: a real 3D loop made of curved segments, with a plastic clasp. */
const BAND_SEGMENTS = 20
const BAND_RADIUS = 92
const BAND_HEIGHT = 44
const BAND_SEG_WIDTH = 2 * BAND_RADIUS * Math.tan(Math.PI / BAND_SEGMENTS) + 1.5
const WOVEN =
  'repeating-linear-gradient(90deg, rgba(201,162,74,0.9) 0 2px, rgba(0,0,0,0) 2px 9px), linear-gradient(rgba(0,0,0,0) 0 40%, rgba(194,91,69,0.85) 40% 46%, rgba(0,0,0,0) 46% 54%, rgba(194,91,69,0.85) 54% 60%, rgba(0,0,0,0) 60%)'

function Band({ light }: { light: number }) {
  return (
    <div
      className="obj"
      style={{
        left: '50%',
        top: 'auto',
        bottom: 60,
        width: 0,
        height: BAND_HEIGHT,
        transform: 'rotateX(-16deg)',
      }}
    >
      {Array.from({ length: BAND_SEGMENTS }, (_, i) => {
        const angle = (i * 360) / BAND_SEGMENTS
        const shade = 0.62 + 0.38 * Math.max(0, Math.cos(((angle - 25) * Math.PI) / 180))
        const clasp = i === 0
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: BAND_SEG_WIDTH,
              height: BAND_HEIGHT,
              marginLeft: -BAND_SEG_WIDTH / 2,
              transform: `rotateY(${angle}deg) translateZ(${BAND_RADIUS}px)`,
              filter: `brightness(${(shade * light).toFixed(3)})`,
              ...(clasp
                ? {
                    background: '#d9d6cf',
                    boxShadow:
                      'inset 0 0 0 5px #c4c0b6, inset 0 0 0 9px #d9d6cf, inset 0 0 0 12px #b5b0a5',
                  }
                : { backgroundColor: '#2e4a66', backgroundImage: WOVEN }),
            }}
          />
        )
      })}
    </div>
  )
}

/** A memory as a solid 3D object, standing on the floor of its scene. */
export function MemoryObject({ memory, light }: { memory: Memory; light: number }) {
  const front = memory.sides[0]
  const shape = shapeOf(memory)
  const lit: CSSProperties = { filter: `brightness(${light})`, transition: 'filter 0.85s ease' }

  if (shape === 'fold') {
    const { w, h } = fitWithin(front?.width ?? 220, front?.height ?? 310, 220, 310)
    return (
      <div
        className="obj"
        style={{
          left: '50%',
          top: 'auto',
          bottom: 0,
          width: w,
          height: h,
          marginLeft: -w / 2 - 26,
        }}
      >
        <div className="leaf3d" style={{ transform: 'translateZ(-3px)' }}>
          <SideFace
            side={memory.sides[1]}
            noteScale={0.5}
            style={{
              filter: `brightness(${light < 1 ? 0.7 : 0.94})`,
              boxShadow: 'inset 14px 0 18px rgba(0,0,0,0.12)',
            }}
          />
          <div className="face" style={{ transform: 'rotateY(180deg)', background: '#efe8db' }} />
        </div>
        <div
          className="leaf3d"
          style={{ transformOrigin: 'left center', transform: 'rotateY(-34deg)' }}
        >
          <div className="face" style={{ transform: 'translateZ(1px)', ...lit }}>
            <SideFace side={front} />
            {sheen}
          </div>
          <div
            className="face"
            style={{
              transform: 'rotateY(180deg)',
              background: '#f4efe6',
              filter: 'brightness(0.85)',
            }}
          />
        </div>
      </div>
    )
  }

  if (shape === 'band') return <Band light={light} />

  if (shape === 'cutout') {
    const { w, h } = fitWithin(front?.width ?? 240, front?.height ?? 240, 260, 300)
    const box: CSSProperties = {
      left: '50%',
      top: 'auto',
      bottom: 0,
      width: w,
      height: h,
      marginLeft: -w / 2,
    }
    return (
      <div className="obj" style={box}>
        {CUTOUT_LAYERS.map(({ z, scale, light: l }) => (
          <div
            key={z}
            aria-hidden="true"
            className="leaf3d"
            style={{
              transformOrigin: '50% 100%',
              transform: `translateZ(${z}px) scale(${scale})`,
              filter: `brightness(${l}) saturate(0.85)`,
            }}
          >
            <SideFace side={front} cutout />
          </div>
        ))}
        <div className="leaf3d" style={{ ...lit, transform: `translateZ(${CUTOUT_DEPTH / 2}px)` }}>
          <SideFace side={front} cutout />
        </div>
      </div>
    )
  }

  const { w, h } = fitWithin(front?.width ?? 300, front?.height ?? 230, 300, 330)
  const t = THICKNESS[memory.kind] ?? 4
  const edge = EDGE[memory.kind] ?? '#e4e0d7'
  return (
    <div
      className="obj"
      style={{ left: '50%', top: 'auto', bottom: 0, width: w, height: h, marginLeft: -w / 2 }}
    >
      <div className="face" style={{ transform: `translateZ(${t / 2}px)`, ...lit }}>
        <SideFace side={front} />
        {sheen}
      </div>
      <div
        className="face"
        style={{
          transform: `rotateY(180deg) translateZ(${t / 2}px)`,
          background: '#f4f1ea',
          filter: 'brightness(0.8)',
        }}
      />
      {[90, -90].map((deg) => (
        <div
          key={deg}
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: t,
            height: '100%',
            marginLeft: -t / 2,
            transform: `rotateY(${deg}deg) translateZ(${w / 2}px)`,
            background: edge,
            filter: `brightness(${deg > 0 ? 0.78 : 0.66})`,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          width: '100%',
          height: t,
          marginTop: -t / 2,
          transform: `rotateX(90deg) translateZ(${h / 2}px)`,
          background: edge,
        }}
      />
    </div>
  )
}
