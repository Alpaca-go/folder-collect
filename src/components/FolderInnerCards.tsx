import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
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
import type { InnerPocketCardArt } from '../config/folderInnerCardArt'
import { innerPocketCardSize } from '../config/folderInnerCardArt'
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
  /** Mirrored stack layer: the cards present the same poses rotated 180° (artwork stays unflipped). */
  mirrored?: boolean
  /** Art per pocket index (replaces placeholder card chrome). Length should match `INNER_CARDS`. */
  innerCardArt?: readonly InnerPocketCardArt[]
  onPileCardFocusChange?: (scrim: PileFocusScrimState) => void
}

export type PileFocusScrimState = {
  /** Scrim should be painted (enter hold or exit fade). */
  active: boolean
  /** Exiting focus — fade scrim out in sync with card return. */
  dismissing: boolean
}

function pocketCardClass(usesArt: boolean) {
  return usesArt
    ? 'absolute overflow-visible'
    : 'absolute overflow-hidden border border-neutral-200/80 bg-white'
}

function placeholderCardBoxShadow(shadowY: number, shadowBlur: number) {
  return `0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,0.13)`
}

function pileStackBrightness(
  cardIndex: number,
  pileShift: number,
  opts: { isPileFront: boolean; isPrevRising?: boolean },
): number {
  if (opts.isPileFront || opts.isPrevRising) return 1
  const pileRank = (cardIndex + pileShift) % INNER_CARDS.length
  const pileDepthFromTop = INNER_CARDS.length - 1 - pileRank
  return Math.max(
    SPREAD_PROMOTE.pileStackDimMin,
    1 - pileDepthFromTop * SPREAD_PROMOTE.pileStackDimStep,
  )
}

function pileStackBrightnessFilter(brightness: number): string | undefined {
  return brightness < 1 ? `brightness(${brightness})` : undefined
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
  mirrored = false,
  innerCardArt,
  onPileCardFocusChange,
}: FolderInnerCardsProps) {
  const pocketRef = useRef<HTMLDivElement>(null)
  const spreadWasRetractRef = useRef(false)
  /** Flap-open centered pocket — same screen pose as fig.1 before dock. */
  const homeScreenPosesRef = useRef<ScreenFixedPose[] | null>(null)
  const [spreadFrom, setSpreadFrom] = useState<ScreenFixedPose[] | null>(null)
  const [retractTargets, setRetractTargets] = useState<ScreenFixedPose[] | null>(null)
  const [spinPivot, setSpinPivot] = useState<{ x: number; y: number } | null>(null)
  const [pocketRestInstant, setPocketRestInstant] = useState(false)
  /** Center pile: how many times the top card has been flipped to the back. */
  const [pileShift, setPileShift] = useState(0)
  const [pileDragY, setPileDragY] = useState(0)
  const [pilePrevProgress, setPilePrevProgress] = useState(0)
  const [focusedCardIndex, setFocusedCardIndex] = useState<number | null>(null)
  const [focusDismissAnimating, setFocusDismissAnimating] = useState(false)
  const focusedCardIndexRef = useRef<number | null>(null)
  const focusDismissTimerRef = useRef<number | null>(null)
  const pileDragRef = useRef<{
    pointerId: number
    startY: number
    startX: number
    cardIndex: number
  } | null>(null)
  const prevDropFrameRef = useRef<number | null>(null)
  const prevDropStartRef = useRef(0)

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

  /** A fresh spin starts the pile from its original order. */
  useLayoutEffect(() => {
    if (spreadPhase !== 'hold' && spreadPhase !== 'gather' && spreadPhase !== 'centerSpin') return
    pileDragRef.current = null
    setPileShift(0)
    setPileDragY(0)
    setPilePrevProgress(0)
  }, [spreadPhase])

  useLayoutEffect(() => {
    if (spreadPhase === 'settled') return
    if (focusDismissTimerRef.current != null) {
      window.clearTimeout(focusDismissTimerRef.current)
      focusDismissTimerRef.current = null
    }
    setFocusDismissAnimating(false)
    setFocusedCardIndex(null)
  }, [spreadPhase])

  useEffect(() => {
    focusedCardIndexRef.current = focusedCardIndex
  }, [focusedCardIndex])

  const dismissCardFocus = useCallback(() => {
    if (focusedCardIndexRef.current === null) return
    setFocusDismissAnimating(true)
    setFocusedCardIndex(null)
    if (focusDismissTimerRef.current != null) {
      window.clearTimeout(focusDismissTimerRef.current)
    }
    focusDismissTimerRef.current = window.setTimeout(() => {
      focusDismissTimerRef.current = null
      setFocusDismissAnimating(false)
    }, SPREAD_PROMOTE.centerFocusDurationSec * 1000)
  }, [])

  const enterCardFocus = useCallback((cardIndex: number) => {
    if (focusDismissTimerRef.current != null) {
      window.clearTimeout(focusDismissTimerRef.current)
      focusDismissTimerRef.current = null
    }
    setFocusDismissAnimating(false)
    setFocusedCardIndex(cardIndex)
  }, [])

  useEffect(() => {
    onPileCardFocusChange?.({
      active: focusedCardIndex !== null || focusDismissAnimating,
      dismissing: focusDismissAnimating,
    })
  }, [focusedCardIndex, focusDismissAnimating, onPileCardFocusChange])

  useEffect(() => {
    if (focusedCardIndex === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismissCardFocus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusedCardIndex, dismissCardFocus])

  useEffect(
    () => () => {
      if (prevDropFrameRef.current != null) cancelAnimationFrame(prevDropFrameRef.current)
      if (focusDismissTimerRef.current != null) window.clearTimeout(focusDismissTimerRef.current)
    },
    [],
  )

  const pileInteractive = spreadPhase === 'settled' && !closing
  const pileFocusActive = focusedCardIndex !== null
  const pileFocusGeometryTween = pileFocusActive || focusDismissAnimating
  const pileDragActive = pileDragRef.current !== null
  const pileSettledYSpring = {
    type: 'spring' as const,
    stiffness: 340,
    damping: 30,
  }
  /** Down-swipe drops the previous card in from above the pile. */
  const pileDownActive = pileDragActive && pileDragY > 0

  /** Time-driven drop, so the incoming card always takes the same beat to land. */
  const stopPrevDrop = () => {
    if (prevDropFrameRef.current != null) {
      cancelAnimationFrame(prevDropFrameRef.current)
      prevDropFrameRef.current = null
    }
  }

  const startPrevDrop = () => {
    if (prevDropFrameRef.current != null) return
    prevDropStartRef.current = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - prevDropStartRef.current) / SPREAD_PROMOTE.pilePrevDropMs)
      setPilePrevProgress(1 - Math.pow(1 - t, 3))
      if (t < 1) {
        prevDropFrameRef.current = requestAnimationFrame(tick)
      } else {
        prevDropFrameRef.current = null
      }
    }
    prevDropFrameRef.current = requestAnimationFrame(tick)
  }

  const resetPrevDrop = () => {
    stopPrevDrop()
    setPilePrevProgress(0)
  }

  const handlePilePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    cardIndex: number,
  ) => {
    if (!pileInteractive) return
    event.stopPropagation()
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      /** Synthetic pointers cannot be captured — the card handlers still track the drag. */
    }
    pileDragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startX: event.clientX,
      cardIndex,
    }
    resetPrevDrop()
    if (!pileFocusActive) setPileDragY(0)
  }

  const handlePilePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pileFocusActive) return
    const drag = pileDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const deltaY = event.clientY - drag.startY
    if (Math.abs(deltaY) < 2) return
    if (deltaY > 0) startPrevDrop()
    setPileDragY(deltaY)
  }

  const finishPileDrag = (
    event: React.PointerEvent<HTMLDivElement>,
    commit: boolean,
    cardIndex: number,
  ) => {
    const drag = pileDragRef.current
    if (!drag || drag.pointerId !== event.pointerId || drag.cardIndex !== cardIndex) return
    pileDragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    const deltaY = event.clientY - drag.startY
    const deltaX = event.clientX - drag.startX
    const tapSlop = SPREAD_PROMOTE.pileFocusTapPx
    const isTap = commit && Math.abs(deltaY) < tapSlop && Math.abs(deltaX) < tapSlop

    if (isTap && pileInteractive) {
      if (focusedCardIndex === cardIndex) {
        dismissCardFocus()
      } else {
        enterCardFocus(cardIndex)
      }
      resetPrevDrop()
      setPileDragY(0)
      return
    }

    if (pileFocusActive) {
      resetPrevDrop()
      setPileDragY(0)
      return
    }

    if (commit && Math.abs(deltaY) >= SPREAD_PROMOTE.pileSwitchDragPx) {
      /** Swipe up = next card (top drops under the pile); swipe down = previous card. */
      setPileShift((shift) => {
        const next = (shift + (deltaY < 0 ? 1 : -1)) % INNER_CARDS.length
        return next < 0 ? next + INNER_CARDS.length : next
      })
    }
    resetPrevDrop()
    setPileDragY(0)
  }

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
          pocketScreenFixedPoses(folder, spreadOrigin, 0, -dockSinkPx, mirrored),
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
    setRetractTargets(
      pocketScreenFixedPoses(folder, spreadOrigin, pocketPinOffsetY, 0, mirrored),
    )
  }, [
    spreadPhase,
    spreadOrigin,
    dockSinkPx,
    useCenterSpinLayout,
    spreadFrom,
    retractUndocksFolder,
    mirrored,
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

  const fallbackCardSize = innerCardSize(scale)
  const pocketCardSizes = INNER_CARDS.map((_, i) => {
    const art = innerCardArt?.[i]
    return art ? innerPocketCardSize(scale, art) : fallbackCardSize
  })
  const cardWidth = fallbackCardSize.width
  const cardHeight = Math.max(...pocketCardSizes.map((s) => s.height))
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
        mirrored ? -SPREAD_PROMOTE.centerRotateDeg : SPREAD_PROMOTE.centerRotateDeg,
        mirrored,
      )
      return { ...fan[i], width: portalW, height: portalH }
    }
    return { ...settled, width: portalW, height: portalH }
  }

  const viewportCenter = spreadPortalRoot
    ? pageCenterFromElement(spreadPortalRoot)
    : typeof window !== 'undefined'
      ? { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      : { x: 0, y: 0 }

  const focusEase = [0.33, 0, 0.18, 1] as const
  const focusTransition = {
    duration: SPREAD_PROMOTE.centerFocusDurationSec,
    ease: focusEase,
  }

  const screenOverlay =
    showScreenLayer && spreadFrom ? (
      <>
        <motion.div
          aria-hidden={!pileFocusActive && !focusDismissAnimating}
          role="presentation"
          className="fixed inset-0 z-[53] cursor-default bg-black"
          initial={false}
          animate={{
            opacity: pileFocusActive ? SPREAD_PROMOTE.pileFocusMaskOpacity : 0,
          }}
          transition={{
            opacity: {
              duration: focusDismissAnimating
                ? SPREAD_PROMOTE.centerFocusDurationSec
                : 0.32,
              ease: focusDismissAnimating ? focusEase : 'easeOut',
            },
          }}
          style={{
            pointerEvents: pileFocusActive || focusDismissAnimating ? 'auto' : 'none',
          }}
          onClick={dismissCardFocus}
          data-inner-pile-focus-mask
        />
        <div
          className="pointer-events-none fixed inset-0 z-[55]"
          data-inner-pocket-spread-portal
        >
        {INNER_CARDS.map((_, i) => {
          const from = spreadFrom[i]
          const target = screenTargetForCard(i)
          if (!from || !target) return null

          const pocketSize = pocketCardSizes[i]
          const portalW = from.width ?? pocketSize.width
          const portalH = from.height ?? pocketSize.height
          const portalScale = portalW / pocketSize.width
          const usesArt = Boolean(innerCardArt?.[i])
          const portalRadius = radius * portalScale
          const portalShadowY = shadowY * portalScale
          const portalShadowBlur = shadowBlur * portalScale

          const useGatherSpring = spreadPhase === 'gather'
          const useCenterSpinTween = spreadPhase === 'centerSpin'
          const useRetractTween = spreadPhase === 'retract'

          /** Stacking rank: dragging the top card flips it to the back of the pile. */
          const pileRank = (i + pileShift) % INNER_CARDS.length
          const isPileFront = pileRank === INNER_CARDS.length - 1
          /** The back card is the one a down-swipe drops back on top. */
          const isPilePrev = pileRank === 0
          const prevRising = pileDownActive && isPilePrev
          const pileY = isPileFront
            ? pileDragY
            : prevRising
              ? -SPREAD_PROMOTE.pilePrevDropPx * (1 - pilePrevProgress)
              : 0
          const pileZ = isPileFront
            ? 55 + INNER_CARDS.length + 10
            : prevRising
              ? 55 + INNER_CARDS.length + 5
              : 55 + pileRank
          const isCardFocused = focusedCardIndex === i
          const isPeerObscured = pileFocusActive && !isCardFocused
          const pileBrightness = pileStackBrightness(i, pileShift, {
            isPileFront,
            isPrevRising: prevRising,
          })
          const cardBrightness = isCardFocused ? 1 : pileBrightness
          const cardZ = isCardFocused ? 60 : pileFocusActive ? 51 : pileZ

          return (
            <motion.div
              key={`pocket-card-${i}`}
              layout={false}
              data-inner-pocket-card={i}
              className={pocketCardClass(usesArt)}
              style={{
                position: 'fixed',
                width: portalW,
                height: portalH,
                zIndex: cardZ,
                transformOrigin: '50% 50%',
                borderRadius: usesArt ? 0 : portalRadius,
                boxShadow: usesArt
                  ? undefined
                  : placeholderCardBoxShadow(portalShadowY, portalShadowBlur),
                pointerEvents:
                  pileInteractive && (!pileFocusActive || isCardFocused) ? 'auto' : 'none',
                touchAction: 'none',
                filter: pileStackBrightnessFilter(cardBrightness),
              }}
              onPointerDown={(event) => handlePilePointerDown(event, i)}
              onPointerMove={handlePilePointerMove}
              onPointerUp={(event) => finishPileDrag(event, true, i)}
              onPointerCancel={(event) => finishPileDrag(event, false, i)}
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
                left: isCardFocused ? viewportCenter.x - portalW / 2 : target.left,
                top: isCardFocused ? viewportCenter.y - portalH / 2 : target.top,
                rotate: isCardFocused ? 0 : target.rotate,
                /** Land with a slight zoom; retract shrinks back to pocket size. */
                scale: spreadPhase === 'retract'
                  ? 1
                  : isCardFocused
                    ? SPREAD_PROMOTE.centerFocusScale
                    : SPREAD_PROMOTE.centerScale,
                opacity: prevRising ? 0.15 + 0.85 * pilePrevProgress : isPeerObscured ? 0 : 1,
                y: pileFocusActive || isCardFocused ? 0 : pileY,
              }}
              transition={
                spreadPhase === 'settled'
                  ? pileFocusGeometryTween
                    ? {
                        left: focusTransition,
                        top: focusTransition,
                        rotate: focusTransition,
                        scale: focusTransition,
                        opacity: { duration: 0.28, ease: 'easeOut' },
                        y: { duration: 0 },
                      }
                    : {
                        duration: 0,
                        y: pileDragActive
                          ? { duration: 0 }
                          : pileSettledYSpring,
                        opacity: pileDragActive
                          ? { duration: 0 }
                          : { duration: 0.22, ease: 'easeOut' },
                      }
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
              <FolderInnerCardFace
                scale={scale * portalScale}
                artSrc={innerCardArt?.[i]?.src}
              />
              {isCardFocused ? (
                <span className="sr-only">Card expanded — tap to close</span>
              ) : null}
            </motion.div>
          )
        })}
        </div>
      </>
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
              const pocketSize = pocketCardSizes[i]
              const usesArt = Boolean(innerCardArt?.[i])
              const cardBuryY =
                innerCardHiddenYForPose(pocketSize.width, pocketSize.height, introFrom, scale) +
                designPx(
                  FOLDER_DESIGN.innerCardPocketAnchorY + FOLDER_DESIGN.innerCardCloseBuryExtra,
                  scale,
                )
              const dockOnly = 'dockOnly' in card
              /** The trio keeps its intro cadence; deeper cards never play it. */
              const introDelay =
                INNER_CARD_INTRO.rotateDelayBase +
                Math.max(0, i - INNER_DOCK_ONLY_COUNT) * INNER_CARD_INTRO.rotateStaggerSec
              /**
               * Mirrored folders present the same pose rotated 180° — pivot on the bottom-right,
               * fan to the left, base angle +90° — while the card artwork itself is never flipped.
               */
              const poseSign = mirrored ? -1 : 1
              const restRotate = poseSign * innerCardPocketRestRotate(card.rotate)
              const poseIntro = poseSign * introFrom
              const layerX = poseSign * (sharedLayerX + designPx(card.x, scale))
              const layerY = sharedLayerY + designPx(card.y, scale)
              const tuckedY = cardBuryY + designPx(card.y, scale)
              /** Deeper cards stay inside the pocket until the folder docks. */
              const tucked = dockOnly && !folderDocked
              const revealDelay =
                INNER_DOCK_REVEAL.delayBaseSec + i * INNER_DOCK_REVEAL.delayStepSec
              /** Deeper cards sink first; the trio keeps its back-to-front tuck wave. */
              const closeStep = dockOnly
                ? i * INNER_DOCK_REVEAL.closeStaggerSec
                : (INNER_CARDS.length - 1 - i) * INNER_CARD_INTRO.rotateCloseStaggerSec
              const pocketPileRank = (i + pileShift) % INNER_CARDS.length
              const pocketPileFront = pocketPileRank === INNER_CARDS.length - 1
              const pocketBrightness =
                tucked || closing
                  ? 1
                  : pileStackBrightness(i, pileShift, { isPileFront: pocketPileFront })

              return (
                <motion.div
                  key={`pocket-card-${i}`}
                  layout={false}
                  data-inner-pocket-card={i}
                  className={pocketCardClass(usesArt)}
                  style={{
                    left: mirrored ? undefined : '50%',
                    right: mirrored ? '50%' : undefined,
                    width: pocketSize.width,
                    height: pocketSize.height,
                    bottom: POCKET_FLOOR_FROM_FOLDER_BOTTOM,
                    zIndex: i + 1,
                    transformOrigin: mirrored ? '100% 100%' : '0% 100%',
                    borderRadius: usesArt ? 0 : radius,
                    boxShadow: usesArt ? undefined : placeholderCardBoxShadow(shadowY, shadowBlur),
                    filter: pileStackBrightnessFilter(pocketBrightness),
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
                            rotate: poseIntro,
                            scale: 0.96,
                            x: layerX,
                          }
                  }
                  animate={
                    closing
                      ? {
                          y: tuckedY,
                          opacity: 0,
                          rotate: poseIntro,
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
                  <FolderInnerCardFace scale={scale} artSrc={innerCardArt?.[i]?.src} />
                </motion.div>
              )
            })}
          </motion.div>
        ) : null}
      </div>
    </>
  )
}
