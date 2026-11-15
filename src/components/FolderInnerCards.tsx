import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, type Transition } from 'framer-motion'
import {
  designPx,
  FOLDER_DESIGN,
  INNER_CARD_INTRO,
  INNER_CARD_SPREAD,
  INNER_CARDS,
  INNER_DOCK_ONLY_COUNT,
  INNER_DOCK_REVEAL,
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
  centerSpinSettledPoses,
  pageCenterFromElement,
  spreadLayoutScreenFixed,
  type ScreenFixedPose,
} from '../utils/pocketCardGeometry'
import { screenFixedPoseFromPocketCard } from '../utils/measureScreenCardPins'
import FolderInnerCardFace from './FolderInnerCardFace'

type PocketSpreadPhase = 'hold' | 'centerSpin' | 'gather' | 'settled' | 'retract'

interface FolderInnerCardsProps {
  closing?: boolean
  viewportPinY?: number
  viewportPinTransition?: Transition
  holdPocketPose?: boolean
  spreadPhase?: PocketSpreadPhase | null
  spreadPromoteStyle?: 'centerSpin' | 'scatter' | null
  spreadLayouts?: SpreadCardLayout[] | null
  spreadOrigin?: { x: number; y: number } | null
  spreadPortalRoot?: HTMLElement | null
  folderDocked?: boolean
  dockSinkPx?: number
  retractUndocksFolder?: boolean
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

/** Exactly one card layer: pocket DOM, or a single portaled screen layer — never both. */
export default function FolderInnerCards({
  closing = false,
  viewportPinY = 0,
  viewportPinTransition,
  holdPocketPose = false,
  spreadPhase = null,
  spreadPromoteStyle = null,
  spreadLayouts = null,
  spreadOrigin = null,
  spreadPortalRoot = null,
  folderDocked = false,
  dockSinkPx = 0,
  retractUndocksFolder = false,
}: FolderInnerCardsProps) {
  const pocketRef = useRef<HTMLDivElement>(null)
  const spreadWasRetractRef = useRef(false)
  /** Flap-open centered pocket — same screen pose as fig.1 before dock. */
  const homeScreenPosesRef = useRef<ScreenFixedPose[] | null>(null)
  const [spreadFrom, setSpreadFrom] = useState<ScreenFixedPose[] | null>(null)
  const [retractTargets, setRetractTargets] = useState<ScreenFixedPose[] | null>(null)
  const [spinPivot, setSpinPivot] = useState<{ x: number; y: number } | null>(null)
  const [pocketRestInstant, setPocketRestInstant] = useState(false)

  const spreadPortalEl =
    spreadPortalRoot ?? (typeof document !== 'undefined' ? document.body : null)

  const useCenterSpinLayout = spreadPromoteStyle === 'centerSpin'

  const screenLiftActive =
    Boolean(spreadFrom?.length) &&
    spreadPhase !== 'hold' &&
    spreadPhase != null

  const screenHandoffActive =
    Boolean(spreadFrom?.length) && spreadPhase == null && spreadWasRetractRef.current

  const showScreenLayer =
    (screenLiftActive || screenHandoffActive) && spreadPortalEl != null && !closing
  const showPocketLayer = !showScreenLayer

  usePocketClipMask(
    pocketRef,
    showPocketLayer,
    folderDocked &&
      spreadPhase !== 'gather' &&
      spreadPhase !== 'settled' &&
      spreadPhase !== 'centerSpin' &&
      spreadPhase !== 'retract',
  )

  useLayoutEffect(() => {
    if (spreadPhase === 'retract') {
      spreadWasRetractRef.current = true
      return
    }
    if (spreadPhase === 'hold') {
      setSpreadFrom(null)
      setRetractTargets(null)
      setSpinPivot(null)
      return
    }
    if (spreadPhase == null) {
      if (spreadWasRetractRef.current) {
        setPocketRestInstant(true)
        const id = requestAnimationFrame(() => {
          spreadWasRetractRef.current = false
          setSpreadFrom(null)
          setSpinPivot(null)
          requestAnimationFrame(() => {
            setRetractTargets(null)
          })
        })
        return () => cancelAnimationFrame(id)
      }
      setSpreadFrom(null)
      setRetractTargets(null)
      setSpinPivot(null)
    }
  }, [spreadPhase])

  useLayoutEffect(() => {
    if (!pocketRestInstant) return
    const id = requestAnimationFrame(() => setPocketRestInstant(false))
    return () => cancelAnimationFrame(id)
  }, [pocketRestInstant])

  useLayoutEffect(() => {
    if (spreadPhase !== 'gather' && spreadPhase !== 'centerSpin') return
    if (spreadPhase === 'gather' && (!spreadLayouts?.length || !spreadOrigin)) return
    const pocket = pocketRef.current
    if (!pocket) return
    const cards = [...pocket.querySelectorAll<HTMLElement>('[data-inner-pocket-card]')]
    if (cards.length < INNER_CARDS.length) return
    const pivot = spreadPortalRoot ? pageCenterFromElement(spreadPortalRoot) : null
    setSpreadFrom(cards.map((el) => screenFixedPoseFromPocketCard(el)))
    if (spreadPhase === 'centerSpin' && pivot) setSpinPivot(pivot)
  }, [spreadPhase, spreadLayouts, spreadOrigin, spreadPortalRoot])

  useLayoutEffect(() => {
    if (spreadPhase !== 'retract' || !spreadOrigin) return
    const folder = pocketRef.current?.closest<HTMLElement>('[data-purpose="contact-card"]')
    if (!folder) return
    if (retractUndocksFolder) {
      if (homeScreenPosesRef.current?.length === INNER_CARDS.length) {
        setRetractTargets(homeScreenPosesRef.current)
        return
      }
      if (dockSinkPx > 0) {
        setRetractTargets(
          pocketScreenFixedPoses(folder, spreadOrigin, 0, -dockSinkPx),
        )
        return
      }
    }
    if (
      useCenterSpinLayout &&
      spreadFrom &&
      spreadFrom.length >= INNER_CARDS.length
    ) {
      setRetractTargets(spreadFrom)
      return
    }
    const pocketPinOffsetY = dockSinkPx > 0 ? -dockSinkPx : 0
    setRetractTargets(pocketScreenFixedPoses(folder, spreadOrigin, pocketPinOffsetY))
  }, [
    spreadPhase,
    spreadOrigin,
    dockSinkPx,
    useCenterSpinLayout,
    spreadFrom,
    retractUndocksFolder,
  ])

  const { scale, folderHeight } = useFolderLayoutMetrics(pocketRef)

  useLayoutEffect(() => {
    if (closing || folderDocked || spreadPhase) return
    if (!showPocketLayer) return
    const pocket = pocketRef.current
    if (!pocket) return
    const cards = [...pocket.querySelectorAll<HTMLElement>('[data-inner-pocket-card]')]
    if (cards.length < INNER_CARDS.length) return
    homeScreenPosesRef.current = cards.map((el) => screenFixedPoseFromPocketCard(el))
  }, [closing, folderDocked, spreadPhase, showPocketLayer, viewportPinY])

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

  const screenTargetForCard = (i: number): ScreenFixedPose | null => {
    const layout = spreadLayouts?.[i]
    const from = spreadFrom?.[i]
    if (!from) return null
    if (!useCenterSpinLayout && (!layout || !spreadOrigin)) return null

    const portalW = from.width ?? cardWidth
    const portalH = from.height ?? cardHeight
    const portalFaceScale = innerCardFaceScaleFromWidth(portalW)

    const settled =
      layout && spreadOrigin
        ? spreadLayoutScreenFixed(layout, spreadOrigin, portalW, portalH, portalFaceScale)
        : from

    if (spreadPhase === 'retract' && retractTargets?.[i]) {
      return { ...retractTargets[i], width: portalW, height: portalH }
    }
    if (useCenterSpinLayout) {
      const pivot =
        spinPivot ??
        (spreadPortalRoot ? pageCenterFromElement(spreadPortalRoot) : { x: 0, y: 0 })
      const fan = centerSpinSettledPoses(
        spreadFrom!,
        pivot,
        portalW,
        portalH,
        portalFaceScale,
        SPREAD_PROMOTE.centerRotateDeg,
      )
      return { ...fan[i], width: portalW, height: portalH }
    }
    return { ...settled, width: portalW, height: portalH }
  }

  const screenOverlay =
    showScreenLayer && spreadFrom ? (
      <div className="pointer-events-none fixed inset-0 z-[55]" data-inner-pocket-spread-portal>
        {INNER_CARDS.map((_, i) => {
          const from = spreadFrom[i]
          const target = screenTargetForCard(i)
          if (!from || !target) return null

          const portalW = from.width ?? cardWidth
          const portalH = from.height ?? cardHeight
          const portalScale = portalW / cardWidth
          const portalRadius = radius * portalScale
          const portalShadowY = shadowY * portalScale
          const portalShadowBlur = shadowBlur * portalScale

          const useGatherSpring = spreadPhase === 'gather'
          const useCenterSpinTween = spreadPhase === 'centerSpin'
          const useRetractTween = spreadPhase === 'retract'

          return (
            <motion.div
              key={`pocket-card-${i}`}
              layout={false}
              data-inner-pocket-card={i}
              className="absolute overflow-hidden border border-neutral-200/80 bg-white"
              style={{
                position: 'fixed',
                width: portalW,
                height: portalH,
                zIndex: 55 + i,
                transformOrigin: '50% 50%',
                borderRadius: portalRadius,
                boxShadow: `0 ${portalShadowY}px ${portalShadowBlur}px rgba(0,0,0,0.14)`,
              }}
              initial={
                useGatherSpring || useCenterSpinTween
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
                    ? useCenterSpinLayout
                      ? {
                          duration: SPREAD_PROMOTE.centerRotateDurationMs / 1000,
                          ease: [0.33, 0, 0.18, 1],
                          delay:
                            (INNER_CARDS.length - 1 - i) * SPREAD_PROMOTE.centerSpinStaggerSec,
                        }
                      : {
                          duration: SPREAD_PROMOTE.undockDurationMs / 1000,
                          ease: [0.42, 0, 0.18, 1],
                          delay: (INNER_CARDS.length - 1 - i) * 0.02,
                        }
                    : useCenterSpinTween
                      ? {
                          duration: SPREAD_PROMOTE.centerRotateDurationMs / 1000,
                          ease: [0.33, 0, 0.18, 1],
                          delay: i * SPREAD_PROMOTE.centerSpinStaggerSec,
                        }
                      : {
                          delay:
                            INNER_CARD_SPREAD.gatherDelayBase +
                            i * INNER_CARD_SPREAD.gatherDelayStep,
                          type: 'spring',
                          stiffness: 255,
                          damping: 27,
                        }
              }
            >
              <FolderInnerCardFace scale={scale * portalScale} />
            </motion.div>
          )
        })}
      </div>
    ) : null

  return (
    <>
      {screenOverlay && spreadPortalEl ? createPortal(screenOverlay, spreadPortalEl) : null}
      <div
        ref={pocketRef}
        className="pointer-events-none absolute z-[15]"
        data-inner-pocket-cards-root
        style={{
          bottom: 0,
          top: '-50vh',
          left: 0,
          right: 0,
          overflow: showPocketLayer ? 'hidden' : 'visible',
        }}
      >
        {showPocketLayer ? (
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
              const dockOnly = 'dockOnly' in card
              /** The trio keeps its intro cadence; deeper cards never play it. */
              const introDelay =
                INNER_CARD_INTRO.rotateDelayBase +
                Math.max(0, i - INNER_DOCK_ONLY_COUNT) * INNER_CARD_INTRO.rotateStaggerSec
              const restRotate = innerCardPocketRestRotate(card.rotate)
              const layerX = sharedLayerX + designPx(card.x, scale)
              const layerY = sharedLayerY + designPx(card.y, scale)
              const tuckedY = buryY + designPx(card.y, scale)
              /** Deeper cards stay inside the pocket until the folder docks. */
              const tucked = dockOnly && !folderDocked
              const revealDelay =
                INNER_DOCK_REVEAL.delayBaseSec + i * INNER_DOCK_REVEAL.delayStepSec
              /** Deeper cards sink first; the trio keeps its back-to-front tuck wave. */
              const closeStep = dockOnly
                ? i * INNER_DOCK_REVEAL.closeStaggerSec
                : (INNER_CARDS.length - 1 - i) * INNER_CARD_INTRO.rotateCloseStaggerSec

              return (
                <motion.div
                  key={`pocket-card-${i}`}
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
                  initial={
                    pocketRestInstant
                      ? false
                      : tucked
                        ? {
                            y: tuckedY,
                            opacity: 0,
                            rotate: restRotate,
                            scale: 0.98,
                            x: layerX,
                          }
                        : {
                            y: layerY,
                            opacity: 1,
                            rotate: introFrom,
                            scale: 0.96,
                            x: layerX,
                          }
                  }
                  animate={
                    closing
                      ? {
                          y: tuckedY,
                          opacity: 0,
                          rotate: introFrom,
                          scale: 0.94,
                          x: layerX,
                        }
                      : tucked
                        ? {
                            y: tuckedY,
                            opacity: 0,
                            rotate: restRotate,
                            scale: 0.98,
                            x: layerX,
                          }
                        : {
                            y: layerY,
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
                            delay: closeStep,
                            type: 'tween',
                            duration: INNER_CARD_INTRO.rotateCloseDurationSec,
                            ease: [...INNER_CARD_INTRO.rotateEaseClose],
                          },
                          y: {
                            delay: closeStep,
                            type: 'tween',
                            duration: INNER_CARD_INTRO.rotateCloseDurationSec,
                            ease: [0.38, 0, 0.16, 1],
                          },
                          opacity: {
                            delay: closeStep + INNER_CARD_INTRO.rotateCloseDurationSec * 0.35,
                            type: 'tween',
                            duration: INNER_CARD_INTRO.rotateCloseTailSec,
                            ease: 'easeIn',
                          },
                          scale: {
                            delay: closeStep,
                            type: 'tween',
                            duration: INNER_CARD_INTRO.rotateCloseDurationSec * 0.9,
                            ease: [0.4, 0, 0.2, 1],
                          },
                        }
                      : dockOnly
                        ? {
                            y: {
                              delay: revealDelay,
                              type: 'tween',
                              duration: INNER_DOCK_REVEAL.durationSec,
                              ease: [0.22, 0, 0.2, 1],
                            },
                            opacity: {
                              delay: revealDelay,
                              type: 'tween',
                              duration: INNER_DOCK_REVEAL.opacityDurationSec,
                              ease: 'easeOut',
                            },
                            rotate: { duration: 0 },
                            scale: { duration: 0 },
                            x: { duration: 0 },
                          }
                        : holdPocketPose || pocketRestInstant
                        ? {
                            rotate: { duration: 0 },
                            scale: { duration: 0 },
                            y: { duration: 0 },
                            x: { duration: 0 },
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
    </>
  )
}