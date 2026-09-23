import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
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

  useEffect(() => {
    if (!cabinetExiting || foldersMorphing) return

    const timer = window.setTimeout(() => {
      onCabinetExitComplete?.()
    }, CABINET_EXIT_DURATION_MS)

    return () => window.clearTimeout(timer)
  }, [cabinetExiting, foldersMorphing, onCabinetExitComplete])

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

  return (
    <div
      className={`cabinet-diagram-wrap${cabinetExiting ? ' cabinet-exiting' : ''}${foldersMorphing ? ' folders-morphing' : ''}`}
      data-purpose="cabinet-diagram"
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
        </defs>

        <g id="cabinet-inner">
          <polygon className="cabinet-fill-inner" points={toPoly(CABINET_INNER)} />
        </g>

        <g id="cabinet-thickness">
          <path className="cabinet-fill-green" d={CABINET_THICKNESS_D} />
        </g>

        <g
          id="drawer-interior-clip-wrap"
          clipPath={cabinetExiting ? undefined : 'url(#drawer-interior-clip)'}
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
                      <polygon className="cabinet-fill-white" points={toPoly(DRAWER_BOTTOM)} />
                    </g>
                    <g id="drawer-side">
                      <polygon className="cabinet-fill-side" points={toPoly(DRAWER_SIDE_LEFT)} />
                      <polygon className="cabinet-fill-side" points={toPoly(DRAWER_SIDE_RIGHT)} />
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
              className={`drawer-folder-clip-mask-inner${cabinetExiting ? ' drawer-folder-clip-released' : ''}`}
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
                  {!foldersMorphing && !drawerFoldersHidden && (
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
            <polygon className="cabinet-fill-drawer-lip" points={toPoly(DRAWER_THICKNESS)} />
          </g>
          <g id="drawer-door">
            <polygon className="cabinet-fill-green" points={toPoly(DRAWER_DOOR)} />
            <path className="cabinet-handle-stroke" d={DRAWER_HANDLE_LABEL_D} />
            <text className="cabinet-label" transform="matrix(1 0 0 1 180.675 397.7065)">
              Kyries&apos; secret files
            </text>
            <path className="cabinet-handle-stroke" d={DRAWER_HANDLE_SLOT_D} />
          </g>
        </g>

        <g id="cabinet-top">
          <polygon className="cabinet-fill-orange" points={toPoly(CABINET_TOP)} />
        </g>
      </svg>
    </div>
  )
}
