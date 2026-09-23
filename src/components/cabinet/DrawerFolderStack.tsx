import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { contacts } from '../../data/contacts'
import DrawerMiniFolder from './DrawerMiniFolder'
import {
  DRAWER_FOLDER_POP_DELAY_MS,
  drawerFolderCloseSinkProgress,
  drawerFolderCloseY,
  drawerFolderPopCloseTotalDurationMs,
  drawerFolderPopEased,
  drawerFolderPopMaxPull,
  drawerFolderPopProgress,
  drawerFolderPopTotalDurationMs,
  drawerFolderPopY,
  layoutDrawerFolders,
} from './drawerFolderLayout'

interface DrawerFolderStackProps {
  doorPull: number
  doorOpen: boolean
  onFolderCloseComplete?: () => void
  onFolderClick?: (index: number, rects: DOMRect[], names: string[]) => void
}

const slots = layoutDrawerFolders(contacts.slice(0, 8))
const folderCount = slots.length
const folderPopMaxPull = drawerFolderPopMaxPull(folderCount)
const folderPopTotalMs = drawerFolderPopTotalDurationMs(folderCount)
const folderPopCloseTotalMs = drawerFolderPopCloseTotalDurationMs(folderCount)

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function useFolderPopPull(
  doorPull: number,
  doorOpen: boolean,
  onFolderCloseComplete?: () => void,
) {
  const [folderPull, setFolderPull] = useState(0)
  const [isClosing, setIsClosing] = useState(false)
  const [closeElapsedMs, setCloseElapsedMs] = useState(0)
  const folderPullRef = useRef(0)
  const onCloseCompleteRef = useRef(onFolderCloseComplete)
  onCloseCompleteRef.current = onFolderCloseComplete

  const finishClose = () => {
    setIsClosing(false)
    setCloseElapsedMs(0)
    folderPullRef.current = 0
    setFolderPull(0)
    onCloseCompleteRef.current?.()
  }

  useEffect(() => {
    if (doorPull <= 0 && !doorOpen && folderPullRef.current <= 0) {
      setIsClosing(false)
    }
  }, [doorPull, doorOpen])

  useEffect(() => {
    if (!doorOpen) return

    setIsClosing(false)
    setCloseElapsedMs(0)
    let frame = 0
    const delayTimer = setTimeout(() => {
      const from = folderPullRef.current
      const start = performance.now()

      const tick = (now: number) => {
        const t = Math.min((now - start) / folderPopTotalMs, 1)
        const next = from + (folderPopMaxPull - from) * easeInOut(t)
        folderPullRef.current = next
        setFolderPull(next)
        if (t < 1) frame = requestAnimationFrame(tick)
      }

      frame = requestAnimationFrame(tick)
    }, DRAWER_FOLDER_POP_DELAY_MS)

    return () => {
      clearTimeout(delayTimer)
      cancelAnimationFrame(frame)
    }
  }, [doorOpen])

  useEffect(() => {
    if (doorOpen) return

    let frame = 0
    if (folderPullRef.current <= 0) {
      finishClose()
      return
    }

    setIsClosing(true)
    setCloseElapsedMs(0)

    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      setCloseElapsedMs(elapsed)
      if (elapsed < folderPopCloseTotalMs) {
        frame = requestAnimationFrame(tick)
        return
      }
      finishClose()
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [doorOpen])

  return { folderPull, isClosing, closeElapsedMs }
}

export default function DrawerFolderStack({
  doorPull,
  doorOpen,
  onFolderCloseComplete,
  onFolderClick,
}: DrawerFolderStackProps) {
  const slotRefs = useRef<(HTMLDivElement | null)[]>([])
  const { folderPull, isClosing, closeElapsedMs } = useFolderPopPull(
    doorPull,
    doorOpen,
    onFolderCloseComplete,
  )
  const foldersInteractive =
    doorOpen &&
    !isClosing &&
    folderPull >= folderPopMaxPull * 0.92 &&
    Boolean(onFolderClick)

  const handleSlotClick = (index: number, event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (!foldersInteractive) return

    const rects = slotRefs.current
      .slice(0, folderCount)
      .map((element) => element?.getBoundingClientRect())
      .filter((rect): rect is DOMRect => Boolean(rect))

    if (rects.length !== folderCount) return
    onFolderClick?.(index, rects, slots.map((slot) => slot.name))
  }

  if (doorPull <= 0 && folderPull <= 0 && !isClosing) return null

  return (
    <g
      className={`drawer-folders-layer${foldersInteractive ? ' drawer-folders-interactive' : ''}`}
      aria-hidden={doorPull < 0.05 && folderPull <= 0}
    >
      {slots.map((slot, index) => {
        const settledSunk = !doorOpen && !isClosing && folderPull <= 0 && doorPull > 0
        const y =
          isClosing || settledSunk
            ? drawerFolderCloseY(
                slot.y,
                isClosing
                  ? drawerFolderCloseSinkProgress(closeElapsedMs, index, folderCount)
                  : 1,
              )
            : drawerFolderPopY(
                slot.y,
                drawerFolderPopEased(drawerFolderPopProgress(folderPull, index, folderCount)),
              )

        return (
          <foreignObject
            key={slot.id}
            x={slot.x}
            y={y}
            width={slot.width}
            height={slot.height}
            className="drawer-folder-slot"
          >
            <div
              ref={(element) => {
                slotRefs.current[index] = element
              }}
              className="drawer-folder-slot-hit"
              onClick={(event) => handleSlotClick(index, event)}
            >
              <DrawerMiniFolder
                name={slot.name}
                index={index}
                width={slot.width}
                rotateX={slot.rotateX}
                scale={slot.scale}
              />
            </div>
          </foreignObject>
        )
      })}
    </g>
  )
}
