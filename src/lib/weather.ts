export type WeatherMode = 'sunny' | 'cloudy' | 'rain' | 'snow' | 'evening'

export interface WeatherNow {
  mode: WeatherMode
  temperature: number | null
  label: string
}

const LABELS: Record<WeatherMode, string> = {
  sunny: 'Sunny',
  cloudy: 'Cloudy',
  rain: 'Rain',
  snow: 'Snow',
  evening: 'Clear evening',
}

/** Map a WMO weather code (as used by Open-Meteo) plus day/night to a background mode. */
export function modeFromWeatherCode(code: number, isDay: boolean): WeatherMode {
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return 'rain'
  if (code === 2 || code === 3 || code === 45 || code === 48) return 'cloudy'
  return isDay ? 'sunny' : 'evening'
}

/** Fallback when the person hasn't shared a location: daytime is sunny, night is evening. */
export function modeFromClock(date: Date): WeatherMode {
  const h = date.getHours()
  return h >= 7 && h < 18 ? 'sunny' : 'evening'
}

/**
 * Round coordinates to one decimal place (about 11 km) before they leave the device,
 * so the weather service never receives a precise location.
 */
export function coarsen(value: number): number {
  return Math.round(value * 10) / 10
}

export function weatherLabel(mode: WeatherMode, temperature: number | null): string {
  const t = temperature === null ? '' : `${Math.round(temperature)}° `
  return `${t}${LABELS[mode]}`
}

interface OpenMeteoResponse {
  current?: { temperature_2m?: number; weather_code?: number; is_day?: number }
}

export function parseOpenMeteo(json: unknown): WeatherNow | null {
  const cur = (json as OpenMeteoResponse | null)?.current
  if (!cur || typeof cur.weather_code !== 'number') return null
  const mode = modeFromWeatherCode(cur.weather_code, cur.is_day !== 0)
  const temperature = typeof cur.temperature_2m === 'number' ? cur.temperature_2m : null
  return { mode, temperature, label: weatherLabel(mode, temperature) }
}

/**
 * A rough place from the browser's time zone, e.g. "Europe/London" → "London".
 * Lets the sky follow local weather without asking for location at all.
 */
export function cityFromTimeZone(timeZone: string | undefined): string | null {
  if (!timeZone || !timeZone.includes('/') || timeZone.startsWith('Etc/')) return null
  const city = timeZone.split('/').pop()?.replace(/_/g, ' ').trim()
  return city ? city : null
}

export interface Place {
  name: string
  latitude: number
  longitude: number
}

interface GeocodeResponse {
  results?: Array<{ name?: unknown; latitude?: unknown; longitude?: unknown }>
}

export function parseGeocode(json: unknown): Place | null {
  const first = (json as GeocodeResponse | null)?.results?.[0]
  if (!first) return null
  const { name, latitude, longitude } = first
  if (typeof name !== 'string' || typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null
  }
  return { name, latitude, longitude }
}

export async function findPlace(
  name: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Place | null> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', name)
  url.searchParams.set('count', '1')
  url.searchParams.set('language', 'en')
  try {
    const res = await fetchImpl(url.toString(), { referrerPolicy: 'no-referrer' })
    if (!res.ok) return null
    return parseGeocode(await res.json())
  } catch {
    return null
  }
}

export async function fetchWeather(
  lat: number,
  lon: number,
  fetchImpl: typeof fetch = fetch,
): Promise<WeatherNow | null> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(coarsen(lat)))
  url.searchParams.set('longitude', String(coarsen(lon)))
  url.searchParams.set('current', 'temperature_2m,weather_code,is_day')
  try {
    const res = await fetchImpl(url.toString(), { referrerPolicy: 'no-referrer' })
    if (!res.ok) return null
    return parseOpenMeteo(await res.json())
  } catch {
    return null
  }
}
