import { useLayoutEffect, useRef, useState } from 'react'
import { motion, type Transition } from 'framer-motion'
import {
  designPx,
  FOLDER_DESIGN,
  INNER_CARD_INTRO,
  INNER_CARD_SPREAD,
  INNER_CARDS,
  SPREAD_PROMOTE,
  innerCardFaceScaleFromWidth,
  innerCardHiddenYForPose,
  innerCardPeekYForPose,
  innerCardPocketIntroRotate,
  innerCardPocketRestRotate,
  innerCardSize,
} from '../config/folderDesign'
import type { SpreadCardLayout } from '../utils/innerCardSpread'
import {
  pocketScreenFixedPoses,
  rotationDegFromTransform,
  spreadLayoutScreenFixed,
  type ScreenFixedPose,
} from '../utils/pocketCardGeometry'
import FolderInnerCardFace from './FolderInnerCardFace'

type PocketSpreadPhase = 'hold' | 'gather' | 'settled' | 'retract'

interface FolderInnerCardsProps {
  closing?: boolean
  viewportPinY?: number
  viewportPinTransition?: Transition
  holdPocketPose?: boolean
  spreadPhase?: PocketSpreadPhase | null
  spreadLayouts?: SpreadCardLayout[] | null
  spreadOrigin?: { x: number; y: number } | null
  /** Dock dive: clip top stays on page top; bottom still follows folder. */
  folderDocked?: boolean
}

function scrollPageXBounds(scroll: HTMLElement) {
  const scrollRect = scroll.getBoundingClientRect()
  return { left: scrollRect.left, right: scrollRect.right }
}

function usePocketClipMask(
  pocketRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
  pinMaskTopToPage: boolean,
) {
  useLayoutEffect(() => {
    const pocket = pocketRef.current
    if (!pocket || !enabled) return

    const folder = pocket.closest<HTMLElement>('[data-purpose="contact-card"]')
    const scroll = pocket.closest<HTMLElement>('[data-purpose="files-scroll-container"]')
    if (!folder || !scroll) return

    const apply = () => {
      const folderRect = folder.getBoundingClientRect()
      const scrollRect = scroll.getBoundingClientRect()
      const page = scrollPageXBounds(scroll)
      const maskTopY = pinMaskTopToPage ? 0 : scrollRect.top
      let extendUp = Math.max(0, folderRect.top - maskTopY)

      if (pinMaskTopToPage) {
        const cards = pocket.querySelectorAll<HTMLElement>('[data-inner-pocket-card]')
        for (const el of cards) {
          const cardTop = el.getBoundingClientRect().top
          extendUp = Math.max(extendUp, folderRect.top - cardTop + 20)
        }
      }

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

    let rafId = 0
    const trackDockMask = () => {
      apply()
      if (pinMaskTopToPage) rafId = requestAnimationFrame(trackDockMask)
    }
    if (pinMaskTopToPage) rafId = requestAnimationFrame(trackDockMask)

    return () => {
      observer.disconnect()
      scroll.removeEventListener('scroll', apply)
      window.removeEventListener('resize', apply)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [pocketRef, enabled, pinMaskTopToPage])
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

export default function FolderInnerCards({
  closing = false,
  viewportPinY = 0,
  viewportPinTransition,
  holdPocketPose = false,
  spreadPhase = null,
  spreadLayouts = null,
  spreadOrigin = null,
  folderDocked = false,
}: FolderInnerCardsProps) {
  const pocketRef = useRef<HTMLDivElement>(null)
  const [spreadFrom, setSpreadFrom] = useState<ScreenFixedPose[] | null>(null)
  const [retractTargets, setRetractTargets] = useState<ScreenFixedPose[] | null>(null)

  const screenSpreadActive =
    spreadFrom != null &&
    (spreadPhase === 'gather' || spreadPhase === 'settled' || spreadPhase === 'retract')

  usePocketClipMask(
    pocketRef,
    !screenSpreadActive && !closing,
    folderDocked && spreadPhase !== 'gather' && spreadPhase !== 'settled',
  )

  useLayoutEffect(() => {
    if (spreadPhase === 'hold' || spreadPhase == null) {
      setSpreadFrom(null)
      setRetractTargets(null)
    }
  }, [spreadPhase])

  useLayoutEffect(() => {
    if (spreadPhase !== 'gather' || !spreadLayouts?.length || !spreadOrigin) return
    const pocket = pocketRef.current
    if (!pocket) return
    const cards = [...pocket.querySelectorAll<HTMLElement>('[data-inner-pocket-card]')]
    if (cards.length < INNER_CARDS.length) return
    setSpreadFrom(
      cards.map((el) => {
        const rect = el.getBoundingClientRect()
        return {
          left: rect.left,
          top: rect.top,
          rotate: rotationDegFromTransform(getComputedStyle(el).transform),
        }
      }),
    )
  }, [spreadPhase, spreadLayouts, spreadOrigin])

  useLayoutEffect(() => {
    if (spreadPhase !== 'retract' || !spreadOrigin) return
    const folder = pocketRef.current?.closest<HTMLElement>('[data-purpose="contact-card"]')
    if (!folder) return
    setRetractTargets(pocketScreenFixedPoses(folder, spreadOrigin))
  }, [spreadPhase, spreadOrigin])

  const { scale, folderHeight } = useFolderLayoutMetrics(pocketRef)
  const faceScale = innerCardFaceScaleFromWidth(innerCardSize(scale).width)

  const { width: cardWidth, height: cardHeight } = innerCardSize(scale)
  const introFrom = innerCardPocketIntroRotate()
  const radius = designPx(FOLDER_DESIGN.innerCardRadius, scale)
  const shadowY = designPx(FOLDER_DESIGN.innerCardShadowY, scale)
  const shadowBlur = designPx(FOLDER_DESIGN.innerCardShadowBlur, scale)
  const pocketFanMaxDeg = Math.max(...INNER_CARDS.map((c) => c.rotate))
  const sharedPeekY = innerCardPeekYForPose(
    cardWidth,
    cardHeight,
    innerCardPocketRestRotate(pocketFanMaxDeg),
    scale,
  )
  const sharedLayerY = sharedPeekY + designPx(FOLDER_DESIGN.innerCardPocketAnchorY, scale)
  const sharedLayerX = designPx(FOLDER_DESIGN.innerCardPocketAnchorX, scale)
  const buryY =
    innerCardHiddenYForPose(cardWidth, cardHeight, introFrom, scale) +
    designPx(FOLDER_DESIGN.innerCardPocketAnchorY + FOLDER_DESIGN.innerCardCloseBuryExtra, scale)

  const renderScreenSpreadCard = (i: number) => {
    const layout = spreadLayouts?.[i]
    if (!layout || !spreadOrigin || !spreadFrom?.[i]) return null

    const settled = spreadLayoutScreenFixed(layout, spreadOrigin, cardWidth, cardHeight, faceScale)
    const from = spreadFrom[i]
    let target = settled
    if (spreadPhase === 'retract' && retractTargets?.[i]) {
      target = retractTargets[i]
    }

    const useGatherSpring = spreadPhase === 'gather'
    const useRetractTween = spreadPhase === 'retract'

    return (
      <motion.div
        key={i}
        layout={false}
        data-inner-pocket-card={i}
        className="absolute overflow-hidden border border-neutral-200/80 bg-white"
        style={{
          position: 'fixed',
          width: cardWidth,
          height: cardHeight,
          zIndex: 55 + i,
          transformOrigin: '50% 50%',
          borderRadius: radius,
          boxShadow: `0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,0.14)`,
        }}
        initial={
          useGatherSpring
            ? {
                left: from.left,
                top: from.top,
                rotate: from.rotate,
                scale: 1,
                opacity: 1,
              }
            : false
        }
        animate={{
          left: target.left,
          top: target.top,
          rotate: target.rotate,
          scale: 1,
          opacity: 1,
        }}
        transition={
          spreadPhase === 'settled'
            ? { duration: 0 }
            : useRetractTween
              ? {
                  duration: SPREAD_PROMOTE.undockDurationMs / 1000,
                  ease: [0.42, 0, 0.18, 1],
                  delay: (INNER_CARDS.length - 1 - i) * 0.02,
                }
              : {
                  delay: INNER_CARD_SPREAD.gatherDelayBase + i * INNER_CARD_SPREAD.gatherDelayStep,
                  type: 'spring',
                  stiffness: 255,
                  damping: 27,
                }
        }
      >
        <FolderInnerCardFace scale={scale} />
      </motion.div>
    )
  }

  return (
    <div
      ref={pocketRef}
      className={`pointer-events-none ${screenSpreadActive ? 'fixed inset-0 z-[55]' : 'absolute z-[15]'}`}
      data-inner-pocket-cards-root
      style={
        screenSpreadActive
          ? undefined
          : {
              bottom: 0,
              top: '-50vh',
              left: 0,
              right: 0,
              overflow: 'hidden',
            }
      }
    >
      {screenSpreadActive
        ? INNER_CARDS.map((_, i) => renderScreenSpreadCard(i))
        : null}

      {!screenSpreadActive ? (
        <motion.div
          className="absolute bottom-0"
          style={{
            height: folderHeight || 'var(--inner-pocket-folder-height, 100%)',
            left: 'var(--inner-pocket-extend-left, 0px)',
            right: 'var(--inner-pocket-extend-right, 0px)',
          }}
          data-inner-pocket-floor
          initial={false}
          animate={{ y: closing ? 0 : viewportPinY }}
          transition={
            closing
              ? { duration: 0 }
              : viewportPinTransition
                ? { y: viewportPinTransition }
                : undefined
          }
        >
          {INNER_CARDS.map((card, i) => {
            const introDelay =
              INNER_CARD_INTRO.rotateDelayBase + i * INNER_CARD_INTRO.rotateStaggerSec
            const restRotate = innerCardPocketRestRotate(card.rotate)
            const layerX = sharedLayerX + designPx(card.x, scale)

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
                  bottom: POCKET_FLOOR_FROM_FOLDER_BOTTOM,
                  zIndex: i + 1,
                  transformOrigin: '0% 100%',
                  borderRadius: radius,
                  boxShadow: `0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,0.13)`,
                }}
                initial={{
                  y: sharedLayerY,
                  opacity: 1,
                  rotate: introFrom,
                  scale: 0.96,
                  x: layerX,
                }}
                animate={
                  closing
                    ? {
                        y: buryY,
                        opacity: 0,
                        rotate: introFrom,
                        scale: 0.94,
                        x: layerX,
                      }
                    : {
                        y: sharedLayerY,
                        opacity: 1,
                        rotate: restRotate,
                        scale: 1,
                        x: layerX,
                      }
                }
                transition={
                  closing
                    ? {
                        rotate: {
                          delay:
                            (INNER_CARDS.length - 1 - i) * INNER_CARD_INTRO.rotateCloseStaggerSec,
                          type: 'tween',
                          duration: INNER_CARD_INTRO.rotateCloseDurationSec,
                          ease: [...INNER_CARD_INTRO.rotateEaseClose],
                        },
                        y: {
                          delay:
                            (INNER_CARDS.length - 1 - i) * INNER_CARD_INTRO.rotateCloseStaggerSec,
                          type: 'tween',
                          duration: INNER_CARD_INTRO.rotateCloseDurationSec,
                          ease: [0.38, 0, 0.16, 1],
                        },
                        opacity: {
                          delay:
                            (INNER_CARDS.length - 1 - i) * INNER_CARD_INTRO.rotateCloseStaggerSec +
                            INNER_CARD_INTRO.rotateCloseDurationSec * 0.35,
                          type: 'tween',
                          duration: INNER_CARD_INTRO.rotateCloseTailSec,
                          ease: 'easeIn',
                        },
                        scale: {
                          delay:
                            (INNER_CARDS.length - 1 - i) * INNER_CARD_INTRO.rotateCloseStaggerSec,
                          type: 'tween',
                          duration: INNER_CARD_INTRO.rotateCloseDurationSec * 0.9,
                          ease: [0.4, 0, 0.2, 1],
                        },
                      }
                    : holdPocketPose
                      ? {
                          rotate: { duration: 0 },
                          scale: { duration: 0 },
                        }
                      : {
                          rotate: {
                            delay: introDelay,
                            type: 'tween',
                            duration: INNER_CARD_INTRO.rotateDurationSec,
                            ease: [...INNER_CARD_INTRO.rotateEaseOpen],
                          },
                          scale: {
                            delay: introDelay,
                            type: 'tween',
                            duration: INNER_CARD_INTRO.rotateDurationSec * 0.75,
                            ease: [0.45, 0, 0.25, 1],
                          },
                        }
                }
              >
                <FolderInnerCardFace scale={scale} />
              </motion.div>
            )
          })}
        </motion.div>
      ) : null}
    </div>
  )
}