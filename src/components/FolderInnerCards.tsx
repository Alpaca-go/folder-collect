import { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  designPx,
  FOLDER_DESIGN,
  INNER_CARD_INTRO,
  INNER_CARDS,
  innerCardHiddenY,
  innerCardPeekY,
  innerCardSizeLandscape,
} from '../config/folderDesign'
import FolderInnerCardFace from './FolderInnerCardFace'

interface FolderInnerCardsProps {
  closing?: boolean
}

/** Scroll container edges — full page width inside the app shell. */
function scrollPageXBounds(scroll: HTMLElement) {
  const scrollRect = scroll.getBoundingClientRect()
  return { left: scrollRect.left, right: scrollRect.right }
}

/** Clip pocket: top = scroll top, bottom = folder bottom, sides = scroll/page edges. */
function usePocketClipMask(pocketRef: React.RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const pocket = pocketRef.current
    if (!pocket) return

    const folder = pocket.closest<HTMLElement>('[data-purpose="contact-card"]')
    const scroll = pocket.closest<HTMLElement>('[data-purpose="files-scroll-container"]')
    if (!folder || !scroll) return

    const apply = () => {
      const folderRect = folder.getBoundingClientRect()
      const scrollRect = scroll.getBoundingClientRect()
      const page = scrollPageXBounds(scroll)
      const extendUp = Math.max(0, folderRect.top - scrollRect.top)
      const extendLeft = Math.max(0, folderRect.left - page.left)
      const extendRight = Math.max(0, page.right - folderRect.right)

      pocket.style.top = `${-extendUp}px`
      pocket.style.bottom = '0'
      pocket.style.left = `${-extendLeft}px`
      pocket.style.right = `${-extendRight}px`
      pocket.style.overflow = 'hidden'
      pocket.style.clipPath = 'none'
      pocket.style.setProperty('--inner-pocket-folder-height', `${folder.offsetHeight}px`)
      pocket.style.setProperty('--inner-pocket-extend-left', `${extendLeft}px`)
      pocket.style.setProperty('--inner-pocket-extend-right', `${extendRight}px`)
    }

    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(folder)
    observer.observe(scroll)
    scroll.addEventListener('scroll', apply, { passive: true })
    window.addEventListener('resize', apply)
    return () => {
      observer.disconnect()
      scroll.removeEventListener('scroll', apply)
      window.removeEventListener('resize', apply)
    }
  }, [pocketRef])
}

function useFolderLayoutMetrics(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(1)
  const [folderHeight, setFolderHeight] = useState(0)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const folder = container.closest<HTMLElement>('[data-purpose="contact-card"]')
    if (!folder) return

    const update = () => {
      setScale(folder.offsetWidth / FOLDER_DESIGN.width)
      setFolderHeight(folder.offsetHeight)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(folder)
    return () => observer.disconnect()
  }, [containerRef])

  return { scale, folderHeight }
}

const POCKET_FLOOR_FROM_FOLDER_BOTTOM = `${(16 / FOLDER_DESIGN.height) * 100}%`

export default function FolderInnerCards({ closing = false }: FolderInnerCardsProps) {
  const pocketRef = useRef<HTMLDivElement>(null)
  usePocketClipMask(pocketRef)
  const { scale, folderHeight } = useFolderLayoutMetrics(pocketRef)

  const { width: cardWidth, height: cardHeight } = innerCardSizeLandscape(scale)
  const hiddenY = innerCardHiddenY(cardHeight, scale)
  const peekY = innerCardPeekY(cardHeight, scale)
  const radius = designPx(FOLDER_DESIGN.innerCardRadius, scale)
  const shadowY = designPx(FOLDER_DESIGN.innerCardShadowY, scale)
  const shadowBlur = designPx(FOLDER_DESIGN.innerCardShadowBlur, scale)

  return (
    <div
      ref={pocketRef}
      className="absolute z-[15] pointer-events-none"
      data-inner-pocket-cards-root
      style={{
        bottom: 0,
        top: '-50vh',
        left: 0,
        right: 0,
        overflow: 'hidden',
      }}
    >
      <div
        className="absolute bottom-0"
        style={{
          height: folderHeight || 'var(--inner-pocket-folder-height, 100%)',
          left: 'var(--inner-pocket-extend-left, 0px)',
          right: 'var(--inner-pocket-extend-right, 0px)',
        }}
        data-inner-pocket-floor
      >
      {INNER_CARDS.map((card, i) => {
        const layerX =
          designPx(FOLDER_DESIGN.innerCardPocketAnchorX + card.x, scale)
        const layerY =
          peekY + designPx(FOLDER_DESIGN.innerCardPocketAnchorY + card.y, scale)
        const buryY =
          hiddenY + designPx(FOLDER_DESIGN.innerCardPocketAnchorY + card.y, scale)
        const introDelay =
          INNER_CARD_INTRO.rotateDelayBase + i * INNER_CARD_INTRO.rotateStaggerSec
        const introFrom = FOLDER_DESIGN.innerCardIntroRotateFrom

        return (
        <motion.div
          key={i}
          layout={false}
          data-inner-pocket-card={i}
          className="absolute overflow-hidden border border-neutral-200/80 bg-white"
          style={{
            left: '50%',
            width: cardWidth,
            height: cardHeight,
            marginLeft: -cardWidth,
            bottom: POCKET_FLOOR_FROM_FOLDER_BOTTOM,
            zIndex: i + 1,
            transformOrigin: '100% 100%',
            borderRadius: radius,
            boxShadow: `0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,0.13)`,
          }}
          initial={{
            y: buryY,
            opacity: 1,
            rotate: introFrom,
            scale: 0.94,
            x: layerX,
          }}
          animate={
            closing
              ? {
                  y: buryY,
                  opacity: 1,
                  rotate: introFrom,
                  scale: 0.94,
                  x: layerX,
                }
              : {
                  y: layerY,
                  opacity: 1,
                  rotate: card.rotate,
                  scale: 1,
                  x: layerX,
                }
          }
          transition={
            closing
              ? {
                  rotate: {
                    delay: (INNER_CARDS.length - 1 - i) * 0.05,
                    type: 'tween',
                    duration: INNER_CARD_INTRO.rotateDurationSec * 0.85,
                    ease: [...INNER_CARD_INTRO.rotateEaseClose],
                  },
                  y: {
                    delay: (INNER_CARDS.length - 1 - i) * 0.05,
                    type: 'tween',
                    duration: INNER_CARD_INTRO.rotateDurationSec * 0.85,
                    ease: [0.4, 0, 0.2, 1],
                  },
                  scale: {
                    delay: (INNER_CARDS.length - 1 - i) * 0.05,
                    type: 'tween',
                    duration: 0.32,
                    ease: [0.4, 0, 0.2, 1],
                  },
                }
              : {
                  rotate: {
                    delay: introDelay,
                    type: 'tween',
                    duration: INNER_CARD_INTRO.rotateDurationSec,
                    ease: [...INNER_CARD_INTRO.rotateEaseOpen],
                  },
                  y: {
                    delay: introDelay + 0.03,
                    type: 'tween',
                    duration: INNER_CARD_INTRO.rotateDurationSec * 0.9,
                    ease: [...INNER_CARD_INTRO.rotateEaseOpen],
                  },
                  scale: {
                    delay: introDelay,
                    type: 'tween',
                    duration: INNER_CARD_INTRO.rotateDurationSec * 0.85,
                    ease: [...INNER_CARD_INTRO.rotateEaseOpen],
                  },
                }
          }
        >
          <FolderInnerCardFace scale={scale} />
        </motion.div>
        )
      })}
      </div>
    </div>
  )
}
