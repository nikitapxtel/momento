import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type WheelEvent,
} from 'react'
import { clampIndex, itemPose, rowOffset, slotWidth } from '../lib/carousel'
import { KIND_LABELS, type Memory } from '../lib/types'
import { formatMonthYear } from '../lib/words'
import { MemoryObject, shapeOf } from './MemoryObject'
import { OpenView } from './OpenView'

interface Props {
  memories: Memory[]
  /** Called with the memory in focus, so the page can take on its colour. */
  onActiveChange?: (memory: Memory | undefined) => void
  /** Present only for the owner: lets them show or hide the memory on their profile. */
  onToggleShown?: (memory: Memory) => void
  initialIndex?: number
}

const SWIPE_PX = 50
const WHEEL_GAP_MS = 450

export function Carousel({ memories, onActiveChange, onToggleShown, initialIndex = 0 }: Props) {
  const count = memories.length
  const [active, setActive] = useState(() => clampIndex(initialIndex, count))
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [sideIndex, setSideIndex] = useState(0)
  const dragStart = useRef<number | null>(null)
  const dragged = useRef(false)
  const lastWheel = useRef(0)

  const index = clampIndex(active, count)
  const current = memories[index]
  const opened = openIndex !== null ? memories[openIndex] : undefined

  useEffect(() => {
    onActiveChange?.(current)
  }, [current, onActiveChange])

  const close = useCallback(() => {
    setOpenIndex(null)
    setSideIndex(0)
  }, [])

  const goTo = useCallback(
    (i: number) => {
      close()
      setActive(clampIndex(i, count))
    },
    [close, count],
  )

  const open = useCallback((i: number) => {
    setOpenIndex(i)
    setSideIndex(0)
  }, [])

  const step = useCallback(
    (dir: 1 | -1) => {
      if (opened) {
        setSideIndex((s) => Math.max(0, Math.min(opened.sides.length - 1, s + dir)))
      } else {
        setActive((a) => clampIndex(clampIndex(a, count) + dir, count))
      }
    },
    [opened, count],
  )

  // Clicking anywhere outside the opened memory closes it.
  useEffect(() => {
    if (openIndex === null) return
    const onClick = (e: MouseEvent) => {
      if (dragged.current) return
      const target = e.target as Element | null
      if (target?.closest?.('[data-keep-open]')) return
      close()
    }
    const id = window.setTimeout(() => document.addEventListener('click', onClick), 0)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('click', onClick)
    }
  }, [openIndex, close])

  const onPointerDown = (e: PointerEvent) => {
    dragStart.current = e.clientX
  }
  const onPointerUp = (e: PointerEvent) => {
    if (dragStart.current === null) return
    const dx = e.clientX - dragStart.current
    dragStart.current = null
    if (Math.abs(dx) > SWIPE_PX) {
      dragged.current = true
      window.setTimeout(() => (dragged.current = false), 60)
      step(dx < 0 ? 1 : -1)
    }
  }
  const onWheel = (e: WheelEvent) => {
    if (Math.abs(e.deltaX) < 10 || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return
    const now = Date.now()
    if (now - lastWheel.current < WHEEL_GAP_MS) return
    lastWheel.current = now
    step(e.deltaX > 0 ? 1 : -1)
  }
  const stageRef = useRef<HTMLDivElement>(null)
  // Keep keyboard focus on whichever memory is in front after moving.
  const refocusFront = () =>
    window.requestAnimationFrame(() =>
      stageRef.current?.querySelector<HTMLButtonElement>('[data-front-hit]')?.focus(),
    )

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      step(1)
      refocusFront()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      step(-1)
      refocusFront()
    } else if (e.key === 'Escape' && opened) {
      close()
    }
  }

  const widths = useMemo(
    () =>
      memories.map((m, i) =>
        slotWidth({ index: i, active: index, openIndex, isCard: shapeOf(m) === 'fold' }),
      ),
    [memories, index, openIndex],
  )

  if (!current) return null

  const dotsFor = opened
    ? opened.sides.map((s, i) => ({
        key: s.id,
        label: `${s.label} side`,
        on: i === sideIndex,
        go: () => setSideIndex(i),
      }))
    : memories.map((m, i) => ({ key: m.id, label: m.title, on: i === index, go: () => goTo(i) }))

  const position = `${index + 1} of ${count}`
  const metaParts = [
    position,
    KIND_LABELS[current.kind],
    formatMonthYear(current.happenedOn),
  ].filter(Boolean)

  return (
    <>
      <section
        aria-roledescription="carousel"
        aria-label="Your memories. Use the left and right arrow keys to move, and Enter to open."
      >
        <div
          ref={stageRef}
          className="stage"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onWheel={onWheel}
        >
          <div className="row" style={{ transform: `translateX(${rowOffset(widths, index)}px)` }}>
            {memories.map((m, i) => {
              const isFront = i === index
              const isOpen = i === openIndex
              const pose = itemPose(i, index)
              const shape = shapeOf(m)
              return (
                <div
                  key={m.id}
                  className={`slot ${isFront ? 'is-front' : 'is-side'}`}
                  data-keep-open={isOpen ? 'true' : undefined}
                  style={{
                    flex: `0 0 ${widths[i]}px`,
                    height: isOpen ? 430 : 400,
                    opacity: openIndex !== null && !isOpen ? 0.35 : 1,
                    zIndex: isFront ? 20 : 10,
                  }}
                >
                  {isOpen ? (
                    <OpenView memory={m} sideIndex={sideIndex} />
                  ) : (
                    <div className="lift">
                      <div className="ground" style={{ width: isFront ? 220 : 110 }} />
                      <div className="scene">
                        <div
                          className="pose"
                          style={{
                            transform: `rotateY(${pose.rotateY}deg) rotateX(${isFront ? 0 : 4}deg) scale(${pose.scale})`,
                          }}
                        >
                          <div className={`sway${isFront && shape !== 'fold' ? ' on' : ''}`}>
                            <MemoryObject memory={m} light={pose.light} />
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="hit"
                        style={{
                          width: isFront ? 260 : 118,
                          cursor: isFront ? 'zoom-in' : 'pointer',
                        }}
                        tabIndex={isFront ? 0 : -1}
                        data-front-hit={isFront ? '' : undefined}
                        onKeyDown={onKeyDown}
                        aria-label={isFront ? `Open ${m.title}` : `Show ${m.title}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (dragged.current) return
                          if (isFront) open(i)
                          else goTo(i)
                        }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="details" aria-live="polite">
        <p className="meta">{metaParts.join(' · ')}</p>
        <h2>{current.title}</h2>
        {current.place && <p className="place">{current.place}</p>}
        {current.story && <p className="story">{current.story}</p>}
        <div
          data-keep-open="true"
          style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6 }}
        >
          {opened && (
            <button type="button" className="visually-hidden skip-link" onClick={close}>
              Close
            </button>
          )}
          {onToggleShown && (
            <button
              type="button"
              className="text-btn"
              aria-label={
                current.isShown
                  ? 'Shown on your profile. Select to hide it.'
                  : 'Only visible to you. Select to show it on your profile.'
              }
              onClick={() => onToggleShown(current)}
            >
              {current.isShown ? 'Shown on your profile' : 'Only visible to you'}
            </button>
          )}
        </div>
      </div>

      <div className="dots" data-keep-open="true">
        <fieldset style={{ display: 'flex', border: 0, margin: 0, padding: 0 }}>
          <legend className="visually-hidden">{opened ? 'Sides' : 'Jump to a memory'}</legend>
          {dotsFor.map((d) => (
            <button
              key={d.key}
              type="button"
              className="dot"
              aria-label={d.label}
              aria-current={d.on ? 'true' : undefined}
              onClick={d.go}
            >
              <span style={{ width: d.on ? 22 : 10, opacity: d.on ? 1 : 0.3 }} />
            </button>
          ))}
        </fieldset>
      </div>
    </>
  )
}
