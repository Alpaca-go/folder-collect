import { useEffect, useRef, useState } from 'react'

interface CabinetDoorCtaProps {
  doorOpen: boolean
}

const ARROW_BLINK_MS = 420

export default function CabinetDoorCta({ doorOpen }: CabinetDoorCtaProps) {
  const [blink, setBlink] = useState(false)
  const skipBlinkRef = useRef(true)

  useEffect(() => {
    if (skipBlinkRef.current) {
      skipBlinkRef.current = false
      return
    }
    setBlink(true)
    const timer = window.setTimeout(() => setBlink(false), ARROW_BLINK_MS)
    return () => window.clearTimeout(timer)
  }, [doorOpen])

  return (
    <>
      <p
        className={`cabinet-home-open${doorOpen ? ' cabinet-home-open--door-open' : ''}`}
        aria-live="polite"
      >
        <span className="cabinet-home-open-line cabinet-home-open-line--open">OPEN DRAWER</span>
        <span className="cabinet-home-open-line cabinet-home-open-line--close">CLOSE DRAWER</span>
      </p>
      <div
        className={`cabinet-home-open-arrow-wrap${doorOpen ? ' cabinet-home-open-arrow-wrap--up' : ''}${blink ? ' cabinet-home-open-arrow-wrap--blink' : ''}`}
        aria-hidden
      >
        <svg className="cabinet-home-open-arrow cabinet-home-open-arrow--down" viewBox="0 0 24 24">
          <path d="M12,15L7,10H17l-5,5Z" fill="currentColor" />
        </svg>
        <svg className="cabinet-home-open-arrow cabinet-home-open-arrow--up" viewBox="0 0 24 24">
          <path d="M12,9L7,14H17L12,9Z" fill="currentColor" />
        </svg>
      </div>
    </>
  )
}
