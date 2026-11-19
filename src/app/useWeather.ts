import { useCallback, useEffect, useState } from 'react'
import { fetchWeather, modeFromClock, weatherLabel, type WeatherMode } from '../lib/weather'

const CONSENT_KEY = 'momento-local-weather'

function readConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'on'
  } catch {
    return false
  }
}

function writeConsent(on: boolean) {
  try {
    localStorage.setItem(CONSENT_KEY, on ? 'on' : 'off')
  } catch {
    /* storage unavailable */
  }
}

export interface WeatherState {
  mode: WeatherMode
  label: string
  usingLocation: boolean
  enableLocation: () => void
  disableLocation: () => void
}

/**
 * Background weather. Location is only requested after the person opts in, is rounded
 * to about 11 km before it leaves the device, and is never stored or sent to our database.
 * Without consent the sky simply follows the time of day.
 */
export function useWeather(): WeatherState {
  const [usingLocation, setUsingLocation] = useState(readConsent)
  const [mode, setMode] = useState<WeatherMode>(() => modeFromClock(new Date()))
  const [label, setLabel] = useState(() => weatherLabel(modeFromClock(new Date()), null))

  useEffect(() => {
    if (!usingLocation || !('geolocation' in navigator)) return
    let cancelled = false
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const now = await fetchWeather(pos.coords.latitude, pos.coords.longitude)
        if (!cancelled && now) {
          setMode(now.mode)
          setLabel(now.label)
        }
      },
      () => {
        if (!cancelled) {
          setUsingLocation(false)
          writeConsent(false)
        }
      },
      { enableHighAccuracy: false, maximumAge: 30 * 60 * 1000, timeout: 10000 },
    )
    return () => {
      cancelled = true
    }
  }, [usingLocation])

  const enableLocation = useCallback(() => {
    writeConsent(true)
    setUsingLocation(true)
  }, [])

  const disableLocation = useCallback(() => {
    writeConsent(false)
    setUsingLocation(false)
    const m = modeFromClock(new Date())
    setMode(m)
    setLabel(weatherLabel(m, null))
  }, [])

  return { mode, label, usingLocation, enableLocation, disableLocation }
}
