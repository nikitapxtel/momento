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

export type ObjectShape = 'fold' | 'cutout' | 'slab'

export function shapeOf(memory: Memory): ObjectShape {
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
        {[6, 5, 4, 3, 2, 1].map((i) => (
          <div
            key={i}
            className="leaf3d"
            style={{
              transformOrigin: '50% 100%',
              transform: `translateZ(${-i * 2.6}px) scale(${1 - i * 0.028})`,
              filter: `brightness(${0.42 + (6 - i) * 0.08}) saturate(0.85)`,
            }}
          >
            <SideFace side={front} cutout />
          </div>
        ))}
        <div className="leaf3d" style={lit}>
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
