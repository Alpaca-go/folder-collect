import { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { designPx, FOLDER_DESIGN, INNER_CARDS } from '../config/folderDesign'

interface FolderInnerCardsProps {
  closing?: boolean
}

function useFolderLayoutScale(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const folder = container.closest<HTMLElement>('[data-purpose="contact-card"]')
    if (!folder) return

    const update = () => {
      setScale(folder.offsetWidth / FOLDER_DESIGN.width)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(folder)
    return () => observer.disconnect()
  }, [containerRef])

  return scale
}

export default function FolderInnerCards({ closing = false }: FolderInnerCardsProps) {
  const pocketRef = useRef<HTMLDivElement>(null)
  const scale = useFolderLayoutScale(pocketRef)

  const cardHeight = designPx(FOLDER_DESIGN.innerCardHeight, scale)
  const hiddenY = designPx(FOLDER_DESIGN.innerCardHiddenY, scale)
  const peekY = designPx(FOLDER_DESIGN.innerCardPeekY, scale)
  const insetX = designPx(FOLDER_DESIGN.innerCardInsetX, scale)
  const radius = designPx(FOLDER_DESIGN.innerCardRadius, scale)
  const shadowY = designPx(FOLDER_DESIGN.innerCardShadowY, scale)
  const shadowBlur = designPx(FOLDER_DESIGN.innerCardShadowBlur, scale)
  const skeletonPad = designPx(FOLDER_DESIGN.innerCardSkeletonPad, scale)
  const skeletonLinePrimary = designPx(FOLDER_DESIGN.innerCardSkeletonLinePrimary, scale)
  const skeletonLineSecondary = designPx(FOLDER_DESIGN.innerCardSkeletonLineSecondary, scale)
  const skeletonGap = designPx(FOLDER_DESIGN.innerCardSkeletonGap, scale)
  const skeletonBlockGap = designPx(FOLDER_DESIGN.innerCardSkeletonBlockGap, scale)

  return (
    <div
      ref={pocketRef}
      className="absolute left-[8%] right-[8%] z-[15] pointer-events-none"
      style={{
        top: `${(76 / FOLDER_DESIGN.height) * 100}%`,
        bottom: `${(16 / FOLDER_DESIGN.height) * 100}%`,
        clipPath: 'inset(-150% -18% 0 -18%)',
      }}
    >
      {INNER_CARDS.map((card, i) => (
        <motion.div
          key={i}
          className="absolute overflow-hidden border border-neutral-200/80 bg-white"
          style={{
            left: insetX,
            right: insetX,
            height: cardHeight,
            bottom: 0,
            zIndex: i + 1,
            transformOrigin: '50% 100%',
            borderRadius: radius,
            boxShadow: `0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,0.1)`,
          }}
          initial={{ y: hiddenY, opacity: 0, rotate: 0, scale: 0.92, x: 0 }}
          animate={
            closing
              ? { y: hiddenY, opacity: 0, rotate: 0, scale: 0.92, x: 0 }
              : {
                  y: peekY,
                  opacity: 1,
                  rotate: card.rotate,
                  scale: 1,
                  x: designPx(card.x, scale),
                }
          }
          transition={{
            delay: closing ? (INNER_CARDS.length - 1 - i) * 0.07 : card.delay,
            type: 'spring',
            stiffness: closing ? 380 : 320,
            damping: closing ? 32 : 24,
          }}
        >
          <div
            className="pointer-events-none select-none"
            style={{
              paddingLeft: skeletonPad,
              paddingRight: skeletonPad,
              paddingTop: skeletonPad,
            }}
          >
            <div
              className="rounded-full bg-neutral-200/90"
              style={{
                marginBottom: skeletonGap,
                height: skeletonLinePrimary,
                width: '38%',
              }}
            />
            <div
              className="rounded-full bg-neutral-100"
              style={{ height: skeletonLineSecondary, width: '58%' }}
            />
            <div
              className="rounded-full bg-neutral-100/80"
              style={{
                marginTop: skeletonBlockGap,
                height: skeletonLineSecondary,
                width: '44%',
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  )
}
