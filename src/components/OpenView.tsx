import { fitWithin } from '../lib/carousel'
import type { Memory } from '../lib/types'
import { MemoryObject, SideFace, shapeOf } from './MemoryObject'

const turn = 'transform 1s cubic-bezier(0.25, 1, 0.3, 1)'
const lift = '0 1px 2px rgba(0,0,0,0.25), 0 30px 50px rgba(0,0,0,0.35)'

/** A memory opened in place: a card unfolds, everything else turns over. */
export function OpenView({ memory, sideIndex }: { memory: Memory; sideIndex: number }) {
  const shape = shapeOf(memory)
  const front = memory.sides[0]

  if (shape === 'fold') {
    const { w, h } = fitWithin(front?.width ?? 220, front?.height ?? 310, 280, 400)
    const inside = sideIndex === 1
    const back = sideIndex >= 2
    return (
      <div
        className="fade-in"
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 0,
          width: w * 2,
          height: h,
          marginLeft: -w,
          perspective: 2000,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: w * 2,
            height: h,
            transition: turn,
            transform: `translateX(${inside ? 0 : -w / 2}px)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: w,
              top: 0,
              width: w,
              height: h,
              transformStyle: 'preserve-3d',
              transition: turn,
              transform: `rotateY(${back ? 180 : 0}deg)`,
            }}
          >
            <SideFace side={memory.sides[1]} noteScale={0.95} style={{ boxShadow: lift }} />
            {memory.sides[2] ? (
              <SideFace
                side={memory.sides[2]}
                style={{ transform: 'rotateY(180deg) translateZ(1px)', boxShadow: lift }}
              />
            ) : (
              <div
                className="face"
                style={{
                  transform: 'rotateY(180deg) translateZ(1px)',
                  background: '#f3eee4',
                  boxShadow: lift,
                }}
              />
            )}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transformOrigin: 'left center',
                transformStyle: 'preserve-3d',
                transition: 'transform 1.1s cubic-bezier(0.25, 1, 0.3, 1)',
                transform: `translateZ(1px) rotateY(${inside ? -178 : 0}deg)`,
              }}
            >
              <div className="face" style={{ boxShadow: lift }}>
                <SideFace side={front} />
                <div className="sheen" />
              </div>
              <div
                className="face"
                style={{ transform: 'rotateY(180deg)', background: '#f7f3eb' }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (memory.sides.length < 2) {
    return (
      <div
        className="scene fade-in"
        style={{ transform: 'scale(1.08)', transformOrigin: '50% 100%' }}
      >
        <div className="pose">
          <div className="sway on">
            <MemoryObject memory={memory} light={1} />
          </div>
        </div>
      </div>
    )
  }

  const { w, h } = fitWithin(front?.width ?? 300, front?.height ?? 230, 340, 410)
  const shown = memory.sides[Math.max(1, sideIndex)]
  const backSize =
    shown?.width && shown.height ? fitWithin(shown.width, shown.height, 340, 410) : { w, h }
  return (
    <div className="fade-in" style={{ position: 'absolute', inset: 0, perspective: 2000 }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: turn,
          transform: `rotateY(${sideIndex > 0 ? 180 : 0}deg)`,
        }}
      >
        <div
          className="face"
          style={{
            overflow: 'visible',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div style={{ position: 'relative', width: w, height: h, boxShadow: lift }}>
            <SideFace side={front} />
            <div className="sheen" />
          </div>
        </div>
        <div
          className="face"
          style={{
            overflow: 'visible',
            transform: 'rotateY(180deg)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            style={{ position: 'relative', width: backSize.w, height: backSize.h, boxShadow: lift }}
          >
            <SideFace side={shown} />
          </div>
        </div>
      </div>
    </div>
  )
}
