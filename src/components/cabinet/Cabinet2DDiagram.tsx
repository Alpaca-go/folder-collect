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

/** Label plate layout in SVG user units (DRAWER_HANDLE_LABEL_D bounds). */
const LABEL_CENTER_X = 226
const LABEL_TEXT_Y = 392.5
const LABEL_RULE = { x1: 198, y: 406.8, x2: 254 }
const LABEL_RIVET = { leftX: 168.5, rightX: 283.5, y: 399.2, r: 2.15 }

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

          <linearGradient
            id="cabinet-grad-top"
            x1="230"
            y1="0"
            x2="230"
            y2="276"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="var(--cabinet-grad-top-a)" />
            <stop offset="100%" stopColor="var(--cabinet-grad-top-b)" />
          </linearGradient>
          <linearGradient
            id="cabinet-grad-front"
            x1="230"
            y1="293.5"
            x2="230"
            y2="481"
            gradientUnits="userSpaceOnUse"
          >
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
          <linearGradient
            id="cabinet-grad-handle"
            x1="235"
            y1="317"
            x2="235"
            y2="341"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="var(--cabinet-handle-top)" />
            <stop offset="32%" stopColor="var(--cabinet-handle-mid)" />
            <stop offset="100%" stopColor="var(--cabinet-handle-bottom)" />
          </linearGradient>
          <clipPath id="cabinet-handle-slot-top-rim" clipPathUnits="userSpaceOnUse">
            <rect x="152" y="316.5" width="165" height="12.5" />
          </clipPath>
          <clipPath id="cabinet-handle-slot-bottom-rim" clipPathUnits="userSpaceOnUse">
            <rect x="152" y="328.5" width="165" height="12.5" />
          </clipPath>

          <filter
            id="cabinet-object-shadow"
            x="-55%"
            y="-35%"
            width="210%"
            height="220%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceAlpha" stdDeviation="22" result="cabinetShadowAmbientBlur" />
            <feOffset in="cabinetShadowAmbientBlur" dx="0" dy="20" result="cabinetShadowAmbientOffset" />
            <feFlood floodColor="var(--cabinet-shadow-color)" floodOpacity="var(--cabinet-shadow-ambient-opacity)" result="cabinetShadowAmbientColor" />
            <feComposite
              in="cabinetShadowAmbientColor"
              in2="cabinetShadowAmbientOffset"
              operator="in"
              result="cabinetShadowAmbient"
            />
            <feGaussianBlur in="SourceAlpha" stdDeviation="9" result="cabinetShadowContactBlur" />
            <feOffset in="cabinetShadowContactBlur" dx="0" dy="10" result="cabinetShadowContactOffset" />
            <feFlood floodColor="var(--cabinet-shadow-color)" floodOpacity="var(--cabinet-shadow-contact-opacity)" result="cabinetShadowContactColor" />
            <feComposite
              in="cabinetShadowContactColor"
              in2="cabinetShadowContactOffset"
              operator="in"
              result="cabinetShadowContact"
            />
            <feMerge>
              <feMergeNode in="cabinetShadowAmbient" />
              <feMergeNode in="cabinetShadowContact" />
            </feMerge>
          </filter>

          <linearGradient
            id="cabinet-grad-label"
            x1={LABEL_CENTER_X}
            y1="376"
            x2={LABEL_CENTER_X}
            y2="422"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="var(--cabinet-label-top)" />
            <stop offset="100%" stopColor="var(--cabinet-label-bottom)" />
          </linearGradient>
          <clipPath id="cabinet-label-top-rim" clipPathUnits="userSpaceOnUse">
            <rect x="160" y="375.5" width="132" height="13" />
          </clipPath>
          <clipPath id="cabinet-label-bottom-rim" clipPathUnits="userSpaceOnUse">
            <rect x="160" y="408" width="132" height="15" />
          </clipPath>
          <clipPath id="cabinet-label-left-rim" clipPathUnits="userSpaceOnUse">
            <rect x="160" y="376" width="10" height="46" />
          </clipPath>
          <clipPath id="cabinet-label-right-rim" clipPathUnits="userSpaceOnUse">
            <rect x="282" y="376" width="10" height="46" />
          </clipPath>
          <filter
            id="cabinet-label-raised"
            x="-12%"
            y="-18%"
            width="124%"
            height="155%"
            colorInterpolationFilters="sRGB"
          >
            <feDropShadow
              dx="0"
              dy="1.1"
              stdDeviation="1.6"
              floodColor="#4a5048"
              floodOpacity="0.1"
              result="labelRaisedShadow"
            />
            <feMerge>
              <feMergeNode in="labelRaisedShadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id="cabinet-label-outer"
            x="-10%"
            y="-12%"
            width="120%"
            height="145%"
            colorInterpolationFilters="sRGB"
          >
            <feDropShadow dx="0" dy="1.2" stdDeviation="2.2" floodColor="#5c6158" floodOpacity="0.065" />
          </filter>
          <filter id="cabinet-label-text-engrave" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="0.55" stdDeviation="0.2" floodColor="#2f332c" floodOpacity="0.22" />
          </filter>
          <filter id="cabinet-label-rivet-raised" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="0.65" stdDeviation="0.55" floodColor="#454a42" floodOpacity="0.14" />
          </filter>
          <filter
            id="cabinet-slot-recess"
            x="-12%"
            y="-55%"
            width="124%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feDropShadow
              dx="0"
              dy="-2.2"
              stdDeviation="2.2"
              floodColor="#2a2f28"
              floodOpacity="0.2"
              result="handleRecessShadow"
            />
            <feDropShadow
              in="SourceGraphic"
              dx="0"
              dy="-0.6"
              stdDeviation="0.9"
              floodColor="#3a4038"
              floodOpacity="0.12"
              result="handleRecessEdge"
            />
            <feMerge>
              <feMergeNode in="handleRecessShadow" />
              <feMergeNode in="handleRecessEdge" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id="cabinet-slot-outer-contact"
            x="-6%"
            y="-8%"
            width="112%"
            height="145%"
            colorInterpolationFilters="sRGB"
          >
            <feDropShadow dx="0" dy="1.4" stdDeviation="2" floodColor="#5c6158" floodOpacity="0.05" />
          </filter>
        </defs>

        <g
          id="cabinet-object-shadow-shape"
          className="cabinet-object-shadow-shape"
          filter="url(#cabinet-object-shadow)"
          pointerEvents="none"
          aria-hidden="true"
        >
          <polygon points={toPoly(CABINET_TOP)} />
          <path d={CABINET_THICKNESS_D} />
          <g transform={`translate(0 ${doorY})`}>
            <polygon points={toPoly(DRAWER_THICKNESS)} />
            <polygon points={toPoly(DRAWER_DOOR)} />
          </g>
        </g>

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
          </g>
          <g id="drawer-door">
            <polygon className="cabinet-part" points={toPoly(DRAWER_DOOR)} />
            <path className="cabinet-seam-line" d="M0,293.5 L460,293.5" />
            <path className="cabinet-edge-highlight" d="M0,292.6 L460,292.6" />
            <g className="cabinet-label-group">
              <path className="cabinet-label-plate" d={DRAWER_HANDLE_LABEL_D} />
              <path
                className="cabinet-label-rim-top"
                d={DRAWER_HANDLE_LABEL_D}
                clipPath="url(#cabinet-label-top-rim)"
              />
              <path
                className="cabinet-label-rim-bottom"
                d={DRAWER_HANDLE_LABEL_D}
                clipPath="url(#cabinet-label-bottom-rim)"
              />
              <path
                className="cabinet-label-rim-left"
                d={DRAWER_HANDLE_LABEL_D}
                clipPath="url(#cabinet-label-left-rim)"
              />
              <path
                className="cabinet-label-rim-right"
                d={DRAWER_HANDLE_LABEL_D}
                clipPath="url(#cabinet-label-right-rim)"
              />
              <path
                className="cabinet-label-outer-contact"
                d={DRAWER_HANDLE_LABEL_D}
                filter="url(#cabinet-label-outer)"
              />
              <circle
                className="cabinet-label-rivet"
                cx={LABEL_RIVET.leftX}
                cy={LABEL_RIVET.y}
                r={LABEL_RIVET.r}
              />
              <circle
                className="cabinet-label-rivet"
                cx={LABEL_RIVET.rightX}
                cy={LABEL_RIVET.y}
                r={LABEL_RIVET.r}
              />
              <path
                className="cabinet-label-rule"
                d={`M${LABEL_RULE.x1},${LABEL_RULE.y} H${LABEL_RULE.x2}`}
              />
              <text
                className="cabinet-label"
                x={LABEL_CENTER_X}
                y={LABEL_TEXT_Y}
                textAnchor="middle"
              >
                PERSONAL ARCHIVE
              </text>
            </g>
            <g className="cabinet-handle-slot-group">
              <path className="cabinet-handle-slot" d={DRAWER_HANDLE_SLOT_D} />
              <path
                className="cabinet-handle-rim-top"
                d={DRAWER_HANDLE_SLOT_D}
                clipPath="url(#cabinet-handle-slot-top-rim)"
              />
              <path
                className="cabinet-handle-rim-bottom"
                d={DRAWER_HANDLE_SLOT_D}
                clipPath="url(#cabinet-handle-slot-bottom-rim)"
              />
              <path
                className="cabinet-handle-outer-contact"
                d={DRAWER_HANDLE_SLOT_D}
                filter="url(#cabinet-slot-outer-contact)"
              />
            </g>
          </g>
        </g>

        <g id="cabinet-top">
          <polygon className="cabinet-part" points={toPoly(CABINET_TOP)} />
          <path className="cabinet-edge-highlight cabinet-edge-highlight--top" d="M1.38,276 L458.62,276" />
        </g>
      </svg>
    </motion.div>
  )
}
