import { useEffect, useState } from 'react'
import { useGameStore } from '../store'

export function PhaseBanner() {
  const bannerText = useGameStore(s => s.bannerText)
  const phase = useGameStore(s => s.phase)
  const result = useGameStore(s => s.result)
  const round = useGameStore(s => s.round)
  const gold = useGameStore(s => s.gold)
  const nextRound = useGameStore(s => s.nextRound)
  const reset = useGameStore(s => s.reset)
  const [visible, setVisible] = useState(false)
  const [text, setText] = useState('')

  useEffect(() => {
    if (bannerText) {
      setText(bannerText)
      setVisible(true)
      // Auto-hide non-result banners
      if (phase !== 'result') {
        const timer = setTimeout(() => setVisible(false), 2000)
        return () => clearTimeout(timer)
      }
    } else {
      setVisible(false)
    }
  }, [bannerText, phase])

  if (!visible) return null

  const bannerClass = text.includes('ROUND') ? 'round'
    : text.includes('BATTLE') ? 'battle'
    : text.includes('VICTORY') ? 'victory'
    : text.includes('DEFEAT') ? 'defeat'
    : 'round'

  const isResult = phase === 'result'
  const goldBonus = result === 'victory' ? 200 + round * 50 : 0

  return (
    <>
      {isResult && <div className="result-overlay" />}
      <div className={`phase-banner-overlay ${isResult ? 'clickable' : ''}`}>
        <div className={`phase-banner ${bannerClass}`} key={text}>
          {text}
        </div>
        {isResult && result === 'victory' && goldBonus > 0 && (
          <div className="gold-bonus">+{goldBonus} Gold</div>
        )}
        {isResult && result === 'victory' && (
          <button className="next-round-btn" onClick={nextRound}>
            Next Round
          </button>
        )}
        {isResult && result === 'defeat' && (
          <button className="retry-btn" onClick={reset}>
            Try Again
          </button>
        )}
      </div>
    </>
  )
}
