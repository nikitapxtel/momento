import { useCallback, useEffect, useState } from 'react'
import {
  cityFromTimeZone,
  fetchWeather,
  findPlace,
  modeFromClock,
  weatherLabel,
  type WeatherMode,
} from '../lib/weather'

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

export type WeatherStatus = 'approximate' | 'locating' | 'precise' | 'blocked'

export interface WeatherState {
  mode: WeatherMode
  /** Short text for the header, e.g. "London · 9° Rain". */
  label: string
  status: WeatherStatus
  /** A one-off message to explain what happened, e.g. when location is blocked. */
  message: string | null
  usePreciseLocation: () => void
}

const LOCATION_HELP =
  'Your browser didn’t share a location, so this is the weather for your time zone. To use your exact location, allow it for this site in your browser’s settings.'

/**
 * Background weather.
 * - By default the sky follows the weather for the city in the browser's time zone. No prompt,
 *   and nothing more precise than a city name leaves the device.
 * - If the person chooses, their location is used instead, rounded to about 11 km first.
 * Location is never stored or sent to our database.
 */
export function useWeather(): WeatherState {
  const [mode, setMode] = useState<WeatherMode>(() => modeFromClock(new Date()))
  const [label, setLabel] = useState(() => weatherLabel(modeFromClock(new Date()), null))
  const [status, setStatus] = useState<WeatherStatus>(() =>
    readConsent() ? 'locating' : 'approximate',
  )
  const [message, setMessage] = useState<string | null>(null)

  const flash = useCallback((text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage((m) => (m === text ? null : m)), 9000)
  }, [])

  const show = useCallback(async (lat: number, lon: number, place: string | null) => {
    const now = await fetchWeather(lat, lon)
    if (!now) return false
    setMode(now.mode)
    setLabel(place ? `${place} · ${now.label}` : now.label)
    return true
  }, [])

  const approximate = useCallback(async () => {
    const city = cityFromTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    if (!city) return
    const place = await findPlace(city)
    if (place) await show(place.latitude, place.longitude, place.name)
  }, [show])

  /** Ask the browser for a position. Callers set the 'locating' status first if needed. */
  const requestPosition = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('blocked')
      flash(LOCATION_HELP)
      void approximate()
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const ok = await show(pos.coords.latitude, pos.coords.longitude, null)
        setStatus(ok ? 'precise' : 'approximate')
        if (!ok) void approximate()
      },
      () => {
        writeConsent(false)
        setStatus('blocked')
        flash(LOCATION_HELP)
        void approximate()
      },
      { enableHighAccuracy: false, maximumAge: 30 * 60 * 1000, timeout: 15000 },
    )
  }, [approximate, flash, show])

  useEffect(() => {
    // Only ask for a position on load if the person already chose to share it before.
    const start =
      readConsent() && 'geolocation' in navigator ? requestPosition : () => void approximate()
    const id = window.setTimeout(start, 0)
    return () => window.clearTimeout(id)
  }, [approximate, requestPosition])

  const usePreciseLocation = useCallback(() => {
    writeConsent(true)
    setMessage(null)
    setStatus('locating')
    requestPosition()
  }, [requestPosition])

  return { mode, label, status, message, usePreciseLocation }
}
