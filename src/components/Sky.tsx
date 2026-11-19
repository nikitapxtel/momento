import { useMemo } from 'react'
import type { Theme } from '../app/AppState'
import type { WeatherMode } from '../lib/weather'

function seeded(i: number): number {
  const x = Math.sin(i * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

/** Decorative weather layer behind the page. Purely visual, hidden from assistive tech. */
export function Sky({ mode, theme }: { mode: WeatherMode; theme: Theme }) {
  const dark = theme === 'dark'
  const parts = useMemo(() => {
    const clouds = (count: number) =>
      Array.from({ length: count }, (_, i) => {
        const w = Math.round(240 + seeded(i + 41) * 220)
        const dur = Math.round(80 + seeded(i + 81) * 70)
        return {
          top: `${Math.round(seeded(i + 21) * 46 - 4)}%`,
          w,
          h: Math.round(w * 0.46),
          dur,
          delay: -seeded(i + 11) * dur,
        }
      })
    return {
      clouds9: clouds(9),
      clouds7: clouds(7),
      drops: Array.from({ length: 80 }, (_, i) => ({
        left: `${(seeded(i + 101) * 104 - 2).toFixed(2)}%`,
        h: Math.round(50 + seeded(i + 201) * 50),
        dur: 0.7 + seeded(i + 301) * 0.6,
        delay: -seeded(i + 401) * 2,
      })),
      flakes: Array.from({ length: 70 }, (_, i) => ({
        left: `${(seeded(i + 601) * 100).toFixed(2)}%`,
        size: Math.round(3 + seeded(i + 501) * 5),
        dur: 9 + seeded(i + 701) * 9,
        delay: -seeded(i + 801) * 18,
      })),
      fireflies: Array.from({ length: 16 }, (_, i) => ({
        left: `${(seeded(i + 901) * 96 + 2).toFixed(1)}%`,
        top: `${(40 + seeded(i + 951) * 55).toFixed(1)}%`,
        dur: 5 + seeded(i + 991) * 5,
        delay: -seeded(i + 1031) * 8,
      })),
    }
  }, [])

  const cloudTint = mode === 'rain' ? (dark ? '#7f8894' : '#dce2e8') : dark ? '#8e97a3' : '#ffffff'
  const cloudOpacity = dark ? 0.22 : 0.95
  const clouds = mode === 'cloudy' ? parts.clouds9 : mode === 'rain' ? parts.clouds7 : []

  return (
    <div className="sky" aria-hidden="true" data-weather={mode}>
      {mode === 'sunny' && (
        <div
          style={{
            top: -200,
            right: '6%',
            width: 680,
            height: 680,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,204,120,0.5) 0%, rgba(255,220,160,0.2) 40%, rgba(255,220,160,0) 68%)',
            animation: 'glow 9s ease-in-out infinite alternate',
          }}
        />
      )}
      {mode === 'evening' && (
        <>
          <div
            style={{
              bottom: -360,
              left: '10%',
              width: 1100,
              height: 700,
              borderRadius: '50%',
              background:
                'radial-gradient(ellipse, rgba(246,160,120,0.35) 0%, rgba(246,170,130,0.12) 45%, rgba(246,170,130,0) 70%)',
              animation: 'glow 12s ease-in-out infinite alternate',
            }}
          />
          <div
            style={{
              top: 120,
              right: '12%',
              width: 64,
              height: 64,
              borderRadius: '50%',
              boxShadow: 'inset -16px 8px 0 0 #fff2d2',
              filter: 'drop-shadow(0 0 18px rgba(255,236,190,0.7))',
              animation: 'bob 7s ease-in-out infinite',
            }}
          />
          {parts.fireflies.map((f, i) => (
            <div
              key={`f${i}`}
              className="moving"
              style={{
                left: f.left,
                top: f.top,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#ffe29a',
                boxShadow: '0 0 10px 3px rgba(255,214,120,0.7)',
                animation: `firefly ${f.dur}s ease-in-out ${f.delay}s infinite`,
              }}
            />
          ))}
        </>
      )}
      {clouds.map((c, i) => (
        <div
          key={`c${i}`}
          style={{
            left: 0,
            top: c.top,
            width: c.w,
            height: c.h,
            opacity: cloudOpacity,
            filter: 'drop-shadow(0 16px 22px rgba(80,96,118,0.16))',
            animation: `drift ${c.dur}s linear ${c.delay}s infinite`,
          }}
        >
          {[
            ['0', '34%', '46%', '66%'],
            ['20%', '0', '56%', '100%'],
            ['54%', '22%', '46%', '78%'],
          ].map(([l, t, w, h], j) => (
            <div
              key={j}
              style={{
                position: 'absolute',
                left: l,
                top: t,
                width: w,
                height: h,
                borderRadius: '50%',
                background: `radial-gradient(circle at 50% 40%, ${cloudTint} 0%, ${cloudTint} 52%, rgba(255,255,255,0) 71%)`,
              }}
            />
          ))}
        </div>
      ))}
      {mode === 'rain' &&
        parts.drops.map((d, i) => (
          <div
            key={`r${i}`}
            className="moving"
            style={{
              top: 0,
              left: d.left,
              width: 1,
              height: d.h,
              background: `linear-gradient(rgba(0,0,0,0), ${dark ? 'rgba(205,218,232,0.4)' : 'rgba(70,92,112,0.42)'})`,
              animation: `fall ${d.dur}s linear ${d.delay}s infinite`,
            }}
          />
        ))}
      {mode === 'snow' &&
        parts.flakes.map((f, i) => (
          <div
            key={`s${i}`}
            className="moving"
            style={{
              top: 0,
              left: f.left,
              width: f.size,
              height: f.size,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 0 3px rgba(60,80,100,0.2)',
              animation: `snow ${f.dur}s linear ${f.delay}s infinite`,
            }}
          />
        ))}
      {mode === 'sunny' &&
        [
          { top: 120, size: 26, dur: 38, delay: -6 },
          { top: 150, size: 18, dur: 44, delay: -9 },
          { top: 96, size: 20, dur: 52, delay: -30 },
        ].map((b, i) => (
          <div
            key={`b${i}`}
            className="moving"
            style={{ left: 0, top: b.top, animation: `fly ${b.dur}s linear ${b.delay}s infinite` }}
          >
            <svg
              width={b.size}
              height={b.size}
              viewBox="0 0 24 12"
              style={{ overflow: 'visible', animation: 'flap 0.9s ease-in-out infinite' }}
            >
              <path
                d="M1 3 Q 6 0 12 8 Q 18 0 23 3"
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.7}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
            </svg>
          </div>
        ))}
    </div>
  )
}
