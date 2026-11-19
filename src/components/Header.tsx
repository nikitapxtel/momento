import { Link, NavLink } from 'react-router-dom'
import { useAppState } from '../app/AppState'
import { useAuth } from '../app/AuthProvider'
import type { WeatherState } from '../app/useWeather'
import { isDemo } from '../lib/supabase'

const navClass = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? ' active' : ''}`

export function Header({ weather }: { weather: WeatherState }) {
  const { theme, toggleTheme } = useAppState()
  const { userId, session } = useAuth()
  const initial = (session?.user.email ?? '?').charAt(0).toUpperCase()

  return (
    <header className="site-header">
      <Link to="/" className="brand">
        Momento
      </Link>
      <nav aria-label="Main" className="main-nav">
        <NavLink to="/" end className={navClass}>
          My box
        </NavLink>
        <NavLink to="/explore" className={navClass}>
          Explore
        </NavLink>
      </nav>
      <div className="header-tools">
        {weather.usingLocation ? (
          <span className="weather-note">{weather.label}</span>
        ) : (
          <button
            type="button"
            className="weather-note"
            onClick={weather.enableLocation}
            title="Uses your approximate location (about 11 km) to match the sky to your weather. Nothing is stored."
          >
            Show my weather
          </button>
        )}
        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4.2" />
              <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
            </svg>
          )}
        </button>
        {!isDemo && (
          <Link
            to={userId ? '/add' : '/sign-in'}
            className="icon-btn outlined"
            aria-label="Add a memory"
            title="Add a memory"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        )}
        {!isDemo &&
          (userId ? (
            <Link
              to="/settings"
              className="icon-btn outlined avatar"
              aria-label="Your profile and settings"
            >
              {initial}
            </Link>
          ) : (
            <Link to="/sign-in" className="text-btn" style={{ opacity: 0.85 }}>
              Sign in
            </Link>
          ))}
      </div>
    </header>
  )
}
