import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from 'react'
import { motion } from 'framer-motion'
import {
  CABINET2_VIEW,
  DRAWER_DOOR,
  DRAWER_INTERIOR_CLIP_D,
  doorOffsetY,
  folderClipRect,
  drawerViewportLocalRect,
  drawerInteriorRasterClipInset,
  toPoly,
} from './cabinet2Layout'
import { PSD_DOC, PSD_LAYERS } from './cabinetImageLayout'
import cabinetStaticUrl from '../../assets/cabinet-static.png'
import drawerInteriorUrl from '../../assets/drawer-interior.png'
import drawerFrontUrl from '../../assets/drawer-front.png'
import DrawerFolderStack from './DrawerFolderStack'
import { CABINET_EXIT_DURATION_MS } from '../../utils/folderMorph'
import './cabinet.css'

const DOOR_OPEN_THRESHOLD = 0.65

function layerStyle(rect: { x: number; y: number; w: number; h: number }): CSSProperties {
  const { w: docW, h: docH } = PSD_DOC
  return {
    '--layer-x': String(rect.x),
    '--layer-y': String(rect.y),
    '--layer-w': String(rect.w),
    '--layer-h': String(rect.h),
    '--psd-doc-w': String(docW),
    '--psd-doc-h': String(docH),
  } as CSSProperties
}

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

function useDrawerTranslateY(stageRef: RefObject<HTMLDivElement | null>, doorY: number) {
  const [px, setPx] = useState(0)

  useLayoutEffect(() => {
    const node = stageRef.current
    if (!node) return

    const update = () => {
      const maxTravel = (doorOffsetY(1) / CABINET2_VIEW.h) * node.clientHeight
      const travel = (doorY / CABINET2_VIEW.h) * node.clientHeight
      setPx(travel - maxTravel)
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(node)
    return () => ro.disconnect()
  }, [doorY, stageRef])

  return px
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
  const stageRef = useRef<HTMLDivElement>(null)
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
  const doorTranslatePx = useDrawerTranslateY(stageRef, doorY)
  const viewport = drawerViewportLocalRect(doorY)
  const folderClip = folderClipRect(doorY)
  const interiorClip = drawerInteriorRasterClipInset(doorY)
  const drawerInteractive = doorPull >= DOOR_OPEN_THRESHOLD
  const folderClipInteractive = drawerInteractive && doorOpen && !cabinetExiting

  const doorMotionStyle: CSSProperties = {
    transform: `translateY(${doorTranslatePx}px)`,
  }

  const drawerInteriorClipStyle: CSSProperties = {
    clipPath: `inset(${interiorClip.topPct}% 0 ${interiorClip.bottomPct}% 0)`,
  }

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
      className={`cabinet-diagram-wrap cabinet-diagram-wrap--raster${cabinetExiting ? ' cabinet-exiting' : ''}${foldersMorphing ? ' folders-morphing' : ''}`}
      data-purpose="cabinet-diagram"
      style={
        {
          '--psd-doc-w': String(PSD_DOC.w),
          '--psd-doc-h': String(PSD_DOC.h),
        } as CSSProperties
      }
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
      <div ref={stageRef} className="cabinet-raster-stage">
        <div
          className="cabinet-raster-layer cabinet-raster-layer--static"
          style={layerStyle(PSD_LAYERS.static)}
        >
          <img src={cabinetStaticUrl} alt="" draggable={false} />
        </div>

        <div className="cabinet-drawer-interior-clip" style={drawerInteriorClipStyle}>
          <div
            className="cabinet-raster-layer cabinet-raster-layer--interior"
            style={layerStyle(PSD_LAYERS.interior)}
          >
            <img src={drawerInteriorUrl} alt="" draggable={false} />
          </div>
        </div>

        <svg
          className="cabinet-interaction-svg"
          viewBox={`0 0 ${CABINET2_VIEW.w} ${CABINET2_VIEW.h}`}
          overflow="visible"
        >
          <defs>
            <clipPath id="drawer-interior-clip" clipPathUnits="userSpaceOnUse">
              <path clipRule="evenodd" d={DRAWER_INTERIOR_CLIP_D} />
            </clipPath>
          </defs>

          <g clipPath="url(#drawer-interior-clip)">
            <g transform={`translate(0 ${doorY})`}>
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
                />
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
            transform={`translate(0 ${doorY})`}
            className="cabinet-door-hit"
            role="button"
            tabIndex={0}
            aria-label={doorOpen ? 'Close drawer door' : 'Open drawer door'}
            aria-pressed={doorOpen}
            onClick={handleDoorClick}
            onKeyDown={handleDoorKeyDown}
          >
            <polygon className="cabinet-door-hit-shape" points={toPoly(DRAWER_DOOR)} fill="transparent" />
          </g>
        </svg>

        <div className="cabinet-drawer-motion cabinet-drawer-motion--front" style={doorMotionStyle}>
          <div
            className="cabinet-raster-layer cabinet-raster-layer--front"
            style={layerStyle(PSD_LAYERS.front)}
          >
            <img src={drawerFrontUrl} alt="" draggable={false} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
