import { describe, expect, it, vi } from 'vitest'
import {
  cityFromTimeZone,
  coarsen,
  findPlace,
  parseGeocode,
  fetchWeather,
  modeFromClock,
  modeFromWeatherCode,
  parseOpenMeteo,
  weatherLabel,
} from './weather'

describe('modeFromWeatherCode', () => {
  it.each([
    [0, true, 'sunny'],
    [0, false, 'evening'],
    [1, true, 'sunny'],
    [3, true, 'cloudy'],
    [45, true, 'cloudy'],
    [61, true, 'rain'],
    [81, false, 'rain'],
    [95, true, 'rain'],
    [73, true, 'snow'],
    [86, false, 'snow'],
  ] as const)('code %i (day %s) → %s', (code, isDay, mode) => {
    expect(modeFromWeatherCode(code, isDay)).toBe(mode)
  })
})

describe('modeFromClock', () => {
  it('uses sunny in the day and evening at night', () => {
    expect(modeFromClock(new Date(2026, 0, 1, 12))).toBe('sunny')
    expect(modeFromClock(new Date(2026, 0, 1, 21))).toBe('evening')
    expect(modeFromClock(new Date(2026, 0, 1, 3))).toBe('evening')
  })
})

describe('coarsen', () => {
  it('rounds to one decimal place so precise location never leaves the device', () => {
    expect(coarsen(51.50735)).toBe(51.5)
    expect(coarsen(-0.12776)).toBe(-0.1)
  })
})

describe('parseOpenMeteo', () => {
  it('reads the current conditions', () => {
    expect(
      parseOpenMeteo({ current: { temperature_2m: 15.6, weather_code: 0, is_day: 1 } }),
    ).toEqual({ mode: 'sunny', temperature: 15.6, label: '16° Sunny' })
  })

  it('returns null for unexpected data', () => {
    expect(parseOpenMeteo(null)).toBeNull()
    expect(parseOpenMeteo({})).toBeNull()
    expect(parseOpenMeteo({ current: { weather_code: 'x' } })).toBeNull()
  })
})

describe('weatherLabel', () => {
  it('omits the temperature when unknown', () => {
    expect(weatherLabel('rain', null)).toBe('Rain')
  })
})

describe('fetchWeather', () => {
  it('only ever sends coarsened coordinates', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ current: { temperature_2m: 9, weather_code: 61, is_day: 1 } }),
    })) as unknown as typeof fetch
    const result = await fetchWeather(51.507351, -0.127758, fetchImpl)
    const calledWith = String((fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0])
    expect(calledWith).toContain('latitude=51.5')
    expect(calledWith).toContain('longitude=-0.1')
    expect(calledWith).not.toContain('51.507')
    expect(result?.mode).toBe('rain')
  })

  it('returns null when the request fails', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('offline')
    }) as unknown as typeof fetch
    expect(await fetchWeather(1, 1, fetchImpl)).toBeNull()
  })
})

describe('cityFromTimeZone', () => {
  it('turns a time zone into a city name', () => {
    expect(cityFromTimeZone('Europe/London')).toBe('London')
    expect(cityFromTimeZone('America/New_York')).toBe('New York')
    expect(cityFromTimeZone('America/Argentina/Buenos_Aires')).toBe('Buenos Aires')
  })

  it('gives up on zones that are not places', () => {
    expect(cityFromTimeZone('UTC')).toBeNull()
    expect(cityFromTimeZone('Etc/GMT+1')).toBeNull()
    expect(cityFromTimeZone(undefined)).toBeNull()
  })
})

describe('parseGeocode', () => {
  it('reads the first match', () => {
    expect(
      parseGeocode({ results: [{ name: 'London', latitude: 51.5, longitude: -0.12 }] }),
    ).toEqual({
      name: 'London',
      latitude: 51.5,
      longitude: -0.12,
    })
  })

  it('returns null for no or bad matches', () => {
    expect(parseGeocode({})).toBeNull()
    expect(parseGeocode({ results: [{ name: 'X', latitude: '1', longitude: 2 }] })).toBeNull()
  })
})

describe('findPlace', () => {
  it('sends only the city name', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ results: [{ name: 'London', latitude: 51.5, longitude: -0.12 }] }),
    })) as unknown as typeof fetch
    const place = await findPlace('London', fetchImpl)
    const url = String((fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0])
    expect(url).toContain('geocoding-api.open-meteo.com')
    expect(url).toContain('name=London')
    expect(place?.name).toBe('London')
  })
})
