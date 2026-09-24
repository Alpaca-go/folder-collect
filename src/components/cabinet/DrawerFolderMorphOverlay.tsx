import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import DrawerMiniFolder from './DrawerMiniFolder'
import {
  FOLDER_PAUSE_DURATION_MS,
  type FolderLayoutSnapshot,
  areMorphFoldersSettled,
  centerFolderTargetsInViewport,
  lerpFolderLayout,
  measureStackFolderTargets,
  morphFolderOpacity,
  morphProgressForIndex,
  morphZIndexForIndex,
  runFolderMorphProgress,
} from '../../utils/folderMorph'

interface DrawerFolderMorphOverlayProps {
  fromTargets: FolderLayoutSnapshot[]
  names: string[]
  /** Overlay session active — folders snap to viewport center, then stack morph. */
  sessionActive: boolean
  pageUnderlay?: boolean
  onComplete: () => void
}

export default function DrawerFolderMorphOverlay({
  fromTargets,
  names,
  sessionActive,
  pageUnderlay = false,
  onComplete,
}: DrawerFolderMorphOverlayProps) {
  const [toTargets, setToTargets] = useState<FolderLayoutSnapshot[] | null>(null)
  const [stackMorphActive, setStackMorphActive] = useState(false)
  const [stackProgress, setStackProgress] = useState(0)
  const completeRef = useRef(onComplete)
  const morphDoneRef = useRef(false)
  const toTargetsRef = useRef<FolderLayoutSnapshot[] | null>(null)
  completeRef.current = onComplete
  toTargetsRef.current = toTargets

  const centerTargets = useMemo(
    () => centerFolderTargetsInViewport(fromTargets),
    [fromTargets],
  )

  useLayoutEffect(() => {
    if (!sessionActive) return

    let cancelled = false
    let attempts = 0

    const measure = () => {
      if (cancelled) return
      const targets = measureStackFolderTargets(fromTargets.length)
      if (targets.length === fromTargets.length) {
        setToTargets(targets)
        return
      }

      attempts += 1
      if (attempts < 60) {
        requestAnimationFrame(measure)
      }
    }

    measure()
    return () => {
      cancelled = true
    }
  }, [fromTargets.length, sessionActive])

  useEffect(() => {
    if (!sessionActive) return

    morphDoneRef.current = false
    setStackMorphActive(false)
    setStackProgress(0)

    let cancelled = false
    let stackControl: ReturnType<typeof runFolderMorphProgress> | null = null
    let pauseTimer = 0
    let waitFrame = 0
    let stackScheduled = false
    const folderCount = fromTargets.length

    const finishMorph = () => {
      if (morphDoneRef.current) return
      morphDoneRef.current = true
      stackControl?.stop()
      window.clearTimeout(pauseTimer)
      cancelAnimationFrame(waitFrame)
      completeRef.current()
    }

    const startStackMorph = () => {
      if (cancelled || morphDoneRef.current || stackScheduled) return
      stackScheduled = true
      setStackMorphActive(true)

      const waitForTargets = () => {
        if (cancelled || morphDoneRef.current) return
        if (!toTargetsRef.current) {
          waitFrame = requestAnimationFrame(waitForTargets)
          return
        }

        stackControl = runFolderMorphProgress((value) => {
          setStackProgress(value)
          if (areMorphFoldersSettled(value, folderCount)) {
            finishMorph()
          }
        })
        stackControl.then(() => {
          if (!morphDoneRef.current) finishMorph()
        })
      }

      waitForTargets()
    }

    pauseTimer = window.setTimeout(() => {
      if (!cancelled && !morphDoneRef.current) startStackMorph()
    }, FOLDER_PAUSE_DURATION_MS)

    return () => {
      cancelled = true
      stackControl?.stop()
      window.clearTimeout(pauseTimer)
      cancelAnimationFrame(waitFrame)
    }
  }, [sessionActive, fromTargets])

  const folderCount = fromTargets.length

  return (
    <div
      className={`drawer-folder-morph-overlay${
        pageUnderlay ? ' drawer-folder-morph-overlay--page-underlay' : ''
      }`}
      aria-hidden="true"
    >
      {fromTargets.map((_, index) => {
        const center = centerTargets[index]
        const to = toTargets?.[index] ?? center
        const stackLocalT = stackMorphActive
          ? morphProgressForIndex(stackProgress, index, folderCount)
          : 0
        const layout = stackMorphActive
          ? lerpFolderLayout(center, to, stackLocalT)
          : center

        return (
          <div
            key={names[index]}
            className="drawer-folder-morph-clone"
            style={{
              left: layout.left,
              top: layout.top,
              width: layout.width,
              height: layout.height,
              zIndex: morphZIndexForIndex(index, folderCount, stackLocalT),
              opacity: morphFolderOpacity(),
              transform: 'translateZ(0)',
            }}
          >
            <DrawerMiniFolder
              name={names[index]}
              index={index}
              width={layout.width}
              rotateX={layout.rotateX}
              scale={layout.scale}
              perspective={layout.perspective}
              transformOriginY={layout.transformOriginY}
              liftY={layout.liftY}
              isLast={index === folderCount - 1}
            />
          </div>
        )
      })}
    </div>
  )
}
