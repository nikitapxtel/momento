import { lazy, Suspense, type CSSProperties, type ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppStateProvider, TONES, useAppState } from './app/AppState'
import { AuthProvider, useAuth } from './app/AuthProvider'
import { useWeather } from './app/useWeather'
import { Header } from './components/Header'
import { Sky } from './components/Sky'
import { isDemo } from './lib/supabase'
import { Explore } from './pages/Explore'
import { MyBox } from './pages/MyBox'
import { PublicBox } from './pages/PublicBox'

// Pages only needed by signed-in people load on demand.
const AddMemory = lazy(() => import('./pages/AddMemory').then((m) => ({ default: m.AddMemory })))
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })))
const SignIn = lazy(() => import('./pages/SignIn').then((m) => ({ default: m.SignIn })))

function RequireAuth({ children }: { children: ReactNode }) {
  const { userId, loading } = useAuth()
  if (isDemo) return <Navigate to="/" replace />
  if (loading) return <main id="main" aria-busy="true" />
  return userId ? <>{children}</> : <Navigate to="/sign-in" replace />
}

function Shell() {
  const { theme, toneKind } = useAppState()
  const weather = useWeather()
  const bg = TONES[toneKind][theme === 'dark' ? 0 : 1]
  return (
    <div className={`app theme-${theme}`} style={{ '--bg': bg } as CSSProperties}>
      <a href="#main" className="visually-hidden skip-link">
        Skip to content
      </a>
      <Sky mode={weather.mode} theme={theme} />
      <div className="app-content">
        <Header weather={weather} />
        <Suspense fallback={<main id="main" aria-busy="true" />}>
          <Routes>
            <Route path="/" element={<MyBox />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/u/:handle" element={<PublicBox />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route
              path="/add"
              element={
                <RequireAuth>
                  <AddMemory />
                </RequireAuth>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAuth>
                  <Settings />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppStateProvider>
      <AuthProvider>
        <HashRouter>
          <Shell />
        </HashRouter>
      </AuthProvider>
    </AppStateProvider>
  )
}
