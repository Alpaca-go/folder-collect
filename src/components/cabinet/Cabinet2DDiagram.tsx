import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { motion } from 'framer-motion'
import {
  CABINET2_VIEW,
  CABINET_INNER,
  CABINET_OPENING_Y,
  CABINET_THICKNESS_D,
  CABINET_TOP,
  DRAWER_BOTTOM,
  DRAWER_DOOR,
  DRAWER_HANDLE_LABEL_D,
  DRAWER_HANDLE_SLOT_D,
  DRAWER_INTERIOR_CLIP_D,
  DRAWER_INTERIOR_Y,
  folderClipRect,
  DRAWER_SIDE_LEFT,
  DRAWER_SIDE_RIGHT,
  DRAWER_THICKNESS,
  drawerViewportLocalRect,
  doorOffsetY,
  toPoly,
} from './cabinet2Layout'
import DrawerFolderStack from './DrawerFolderStack'
import { CABINET_EXIT_DURATION_MS } from '../../utils/folderMorph'
import './cabinet.css'

const DOOR_OPEN_THRESHOLD = 0.65

function useAnimatedPull(open: boolean) {
  const target = open ? 1 : 0
  const [pull, setPull] = useState(target)
  const pullRef = useRef(target)

  useEffect(() => {
    const from = pullRef.current
    const to = target
    if (from === to) return

    const start = performance.now()
    const duration = 450
    let frame = 0

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      const next = from + (to - from) * eased
      pullRef.current = next
      setPull(next)
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target])

  return pull
}

interface Cabinet2DDiagramProps {
  onOpenFiles?: () => void
  onFolderClick?: (index: number, rects: DOMRect[], names: string[]) => void
  cabinetExiting?: boolean
  foldersMorphing?: boolean
  drawerFoldersHidden?: boolean
  onCabinetExitComplete?: () => void
}

export default function Cabinet2DDiagram({
  onOpenFiles,
  onFolderClick,
  cabinetExiting = false,
  foldersMorphing = false,
  drawerFoldersHidden = false,
  onCabinetExitComplete,
}: Cabinet2DDiagramProps) {
  const [doorOpen, setDoorOpen] = useState(false)
  const [foldersSettled, setFoldersSettled] = useState(true)
  const toggleDoor = () => {
    setDoorOpen((prev) => {
      if (prev) setFoldersSettled(false)
      else setFoldersSettled(true)
      return !prev
    })
  }
  const doorPullTarget = doorOpen ? 1 : foldersSettled ? 0 : 1
  const doorPull = useAnimatedPull(doorPullTarget > 0)
  const doorY = doorOffsetY(doorPull)
  const viewport = drawerViewportLocalRect(doorY)
  const folderClip = folderClipRect(doorY)
  const drawerInteractive = doorPull >= DOOR_OPEN_THRESHOLD
  const folderClipInteractive = drawerInteractive && doorOpen && !cabinetExiting

  const handleDoorClick = (event: MouseEvent<SVGGElement>) => {
    if (cabinetExiting) return
    event.stopPropagation()
    toggleDoor()
  }

  const handleDrawerClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (cabinetExiting) return
    if (drawerInteractive) onOpenFiles?.()
  }

  const handleDoorKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleDoor()
    }
  }

  const handleDrawerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!drawerInteractive) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpenFiles?.()
    }
  }

  const exitEase = [0.22, 0, 0.15, 1] as const
  const exitCompleteSentRef = useRef(false)

  useEffect(() => {
    if (!cabinetExiting) {
      exitCompleteSentRef.current = false
    }
  }, [cabinetExiting])

  return (
    <motion.div
      className={`cabinet-diagram-wrap${cabinetExiting ? ' cabinet-exiting' : ''}${foldersMorphing ? ' folders-morphing' : ''}`}
      data-purpose="cabinet-diagram"
      initial={false}
      animate={{ opacity: cabinetExiting ? 0 : 1 }}
      transition={{
        duration: CABINET_EXIT_DURATION_MS / 1000,
        ease: exitEase,
      }}
      onAnimationComplete={() => {
        if (!cabinetExiting || exitCompleteSentRef.current) return
        exitCompleteSentRef.current = true
        onCabinetExitComplete?.()
      }}
    >
      <svg
        className="cabinet-svg"
        viewBox={`0 0 ${CABINET2_VIEW.w} ${CABINET2_VIEW.h}`}
        overflow="visible"
        aria-hidden="true"
      >
        <defs>
          <clipPath id="drawer-interior-clip" clipPathUnits="userSpaceOnUse">
            <path clipRule="evenodd" d={DRAWER_INTERIOR_CLIP_D} />
          </clipPath>

          <linearGradient id="cabinet-grad-top" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="var(--cabinet-grad-top-a)" />
            <stop offset="100%" stopColor="var(--cabinet-grad-top-b)" />
          </linearGradient>
          <linearGradient id="cabinet-grad-front" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="var(--cabinet-grad-front-a)" />
            <stop offset="100%" stopColor="var(--cabinet-grad-front-b)" />
          </linearGradient>
          <linearGradient id="cabinet-grad-side" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="var(--cabinet-grad-side-a)" />
            <stop offset="100%" stopColor="var(--cabinet-grad-side-b)" />
          </linearGradient>
          <linearGradient id="cabinet-grad-inner" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="var(--cabinet-grad-inner-a)" />
            <stop offset="100%" stopColor="var(--cabinet-grad-inner-b)" />
          </linearGradient>

          <filter
            id="cabinet-label-contact"
            x="-12%"
            y="-18%"
            width="124%"
            height="136%"
            colorInterpolationFilters="sRGB"
          >
            <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#000000" floodOpacity="0.045" />
          </filter>
          <filter
            id="cabinet-slot-inset"
            x="-8%"
            y="-30%"
            width="116%"
            height="160%"
            colorInterpolationFilters="sRGB"
          >
            <feDropShadow dx="0" dy="-1" stdDeviation="1" floodColor="#000000" floodOpacity="0.06" />
            <feDropShadow dx="0" dy="0.5" stdDeviation="0.6" floodColor="#ffffff" floodOpacity="0.07" />
          </filter>
        </defs>

        <g id="cabinet-inner">
          <polygon className="cabinet-part" points={toPoly(CABINET_INNER)} />
        </g>

        <g id="cabinet-thickness">
          <path className="cabinet-part" d={CABINET_THICKNESS_D} />
        </g>

        <g
          id="drawer-interior-clip-wrap"
          clipPath="url(#drawer-interior-clip)"
        >
          <g id="drawer-viewport" transform={`translate(0 ${doorY})`}>
            <foreignObject
              className="drawer-viewport"
              x={viewport.x}
              y={viewport.y}
              width={viewport.width}
              height={viewport.height}
            >
              <div
                className={`drawer-viewport-inner${drawerInteractive ? ' drawer-viewport-interactive' : ''}`}
                role={drawerInteractive ? 'button' : undefined}
                tabIndex={drawerInteractive ? 0 : -1}
                aria-label={drawerInteractive ? 'Open folder stack' : undefined}
                onClick={handleDrawerClick}
                onKeyDown={handleDrawerKeyDown}
              >
                <svg
                  className="drawer-viewport-svg"
                  viewBox={`0 0 ${CABINET2_VIEW.w} ${CABINET2_VIEW.h}`}
                  width={CABINET2_VIEW.w}
                  height={CABINET2_VIEW.h}
                  style={{ marginTop: -CABINET_OPENING_Y }}
                >
                  <g id="drawer-interior" transform={`translate(0 ${DRAWER_INTERIOR_Y})`}>
                    <g id="drawer-bottom">
                      <polygon className="cabinet-part" points={toPoly(DRAWER_BOTTOM)} />
                    </g>
                    <g id="drawer-side">
                      <polygon className="cabinet-part" points={toPoly(DRAWER_SIDE_LEFT)} />
                      <polygon className="cabinet-part" points={toPoly(DRAWER_SIDE_RIGHT)} />
                    </g>
                  </g>
                </svg>
              </div>
            </foreignObject>
          </g>

          <foreignObject
            id="drawer-folder-clip-mask"
            className={`drawer-folder-clip-mask${folderClipInteractive ? ' drawer-folder-clip-interactive' : ''}${cabinetExiting ? ' drawer-folder-clip-released' : ''}`}
            x={folderClip.x}
            y={folderClip.y}
            width={folderClip.width}
            height={folderClip.height}
          >
            <div
              className={`drawer-folder-clip-mask-inner${cabinetExiting ? ' drawer-folder-clip-released' : ''}${drawerFoldersHidden ? ' drawer-folders-suppressed' : ''}`}
            >
              <div
                className="drawer-folder-clip-content"
                style={{ transform: `translateY(${doorY}px)` }}
              >
                <svg
                  className="drawer-folder-clip-svg"
                  viewBox={`0 0 ${CABINET2_VIEW.w} ${CABINET2_VIEW.h}`}
                  width={CABINET2_VIEW.w}
                  height={CABINET2_VIEW.h}
                >
                  {!foldersMorphing && (
                    <DrawerFolderStack
                      doorPull={doorPull}
                      doorOpen={doorOpen}
                      onFolderCloseComplete={() => setFoldersSettled(true)}
                      onFolderClick={cabinetExiting ? undefined : onFolderClick}
                    />
                  )}
                </svg>
              </div>
            </div>
          </foreignObject>
        </g>

        <g
          id="drawer-front"
          transform={`translate(0 ${doorY})`}
          className="cabinet-door-hit"
          role="button"
          tabIndex={0}
          aria-label={doorOpen ? 'Close drawer door' : 'Open drawer door'}
          aria-pressed={doorOpen}
          onClick={handleDoorClick}
          onKeyDown={handleDoorKeyDown}
        >
          <g id="drawer-thickness">
            <polygon className="cabinet-part" points={toPoly(DRAWER_THICKNESS)} />
            <path className="cabinet-seam-line" d="M0,293.5 L460,293.5" />
          </g>
          <g id="drawer-door">
            <polygon className="cabinet-part" points={toPoly(DRAWER_DOOR)} />
            <path className="cabinet-edge-highlight" d="M0,293.5 L460,293.5" />
            <path className="cabinet-part cabinet-handle cabinet-handle--label" d={DRAWER_HANDLE_LABEL_D} />
            <text className="cabinet-label" transform="matrix(1 0 0 1 180.675 397.7065)">
              Kyries&apos; secret files
            </text>
            <path className="cabinet-part cabinet-handle cabinet-handle--slot" d={DRAWER_HANDLE_SLOT_D} />
          </g>
        </g>

        <g id="cabinet-top">
          <polygon className="cabinet-part" points={toPoly(CABINET_TOP)} />
          <path className="cabinet-edge-highlight" d="M1.38,276 L458.62,276" />
        </g>
      </svg>
    </motion.div>
  )
}
