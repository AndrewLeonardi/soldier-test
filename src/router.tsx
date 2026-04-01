import { useState, useEffect } from 'react'
import { App } from './App'
import { TrainingPage } from './training/TrainingPage'

export function Router() {
  const [route, setRoute] = useState(window.location.hash || '#/')

  useEffect(() => {
    const handler = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  if (route === '#/training' || route.startsWith('#/training')) {
    return <TrainingPage />
  }
  return <App />
}
