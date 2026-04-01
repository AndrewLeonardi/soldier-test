import { useState, useEffect } from 'react'
import { App } from './App'
import { TrainingPage } from './training/TrainingPage'
import { RosterPage } from './roster/RosterPage'

export function Router() {
  const [route, setRoute] = useState(window.location.hash || '#/')

  useEffect(() => {
    const handler = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  if (route.startsWith('#/training')) return <TrainingPage />
  if (route.startsWith('#/roster')) return <RosterPage />
  return <App />
}
