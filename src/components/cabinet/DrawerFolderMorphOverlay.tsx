import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import DrawerMiniFolder from './DrawerMiniFolder'
import {
  FOLDER_CENTER_HOLD_AFTER_GATHER_MS,
  type FolderLayoutSnapshot,
  areMorphFoldersSettled,
  computeResponsiveCenterGatherSizeMult,
  computeViewportGatherShift,
  lerpFolderGatherShift,
  lerpFolderLayout,
  measureStackFolderTargets,
  morphFolderOpacity,
  morphProgressForIndex,
  morphZIndexForIndex,
  runFolderCenterGatherProgress,
  runFolderMorphProgress,
  scaleFolderSnapshotFromCenter,
  translateFolderTargets,
} from '../../utils/folderMorph'

interface DrawerFolderMorphOverlayProps {
  fromTargets: FolderLayoutSnapshot[]
  names: string[]
  /** Overlay session active — smooth center gather, hold, then stack morph. */
  sessionActive: boolean
  onComplete: () => void
}

export default function DrawerFolderMorphOverlay({
  fromTargets,
  names,
  sessionActive,
  onComplete,
}: DrawerFolderMorphOverlayProps) {
  const [toTargets, setToTargets] = useState<FolderLayoutSnapshot[] | null>(null)
  const [centerProgress, setCenterProgress] = useState(0)
  const [stackMorphActive, setStackMorphActive] = useState(false)
  const [stackProgress, setStackProgress] = useState(0)
  const completeRef = useRef(onComplete)
  const morphDoneRef = useRef(false)
  const toTargetsRef = useRef<FolderLayoutSnapshot[] | null>(null)
  const fromSnapshotRef = useRef(fromTargets)
  completeRef.current = onComplete
  toTargetsRef.current = toTargets

  useEffect(() => {
    fromSnapshotRef.current = fromTargets
  }, [fromTargets])

  const gatherFrom = fromSnapshotRef.current
  const gatherShift = useMemo(
    () => computeViewportGatherShift(gatherFrom),
    [gatherFrom],
  )
  const gatherSizeMult = useMemo(
    () => computeResponsiveCenterGatherSizeMult(gatherFrom),
    [gatherFrom],
  )
  const centerSnapshots = useMemo(
    () =>
      translateFolderTargets(gatherFrom, gatherShift.dx, gatherShift.dy).map((target) =>
        scaleFolderSnapshotFromCenter(target, gatherSizeMult),
      ),
    [gatherFrom, gatherShift.dx, gatherShift.dy, gatherSizeMult],
  )

  useLayoutEffect(() => {
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
  }, [fromTargets.length])

  useEffect(() => {
    if (!sessionActive) return

    morphDoneRef.current = false
    setCenterProgress(0)
    setStackMorphActive(false)
    setStackProgress(0)

    let cancelled = false
    let centerControl: ReturnType<typeof runFolderCenterGatherProgress> | null = null
    let stackControl: ReturnType<typeof runFolderMorphProgress> | null = null
    let pauseTimer = 0
    let waitFrame = 0
    let stackScheduled = false
    const folderCount = fromTargets.length

    const finishMorph = () => {
      if (morphDoneRef.current) return
      morphDoneRef.current = true
      centerControl?.stop()
      stackControl?.stop()
      window.clearTimeout(pauseTimer)
      cancelAnimationFrame(waitFrame)
      completeRef.current()
    }

    const waitForStackTargets = () =>
      new Promise<void>((resolve) => {
        const poll = () => {
          if (cancelled || morphDoneRef.current) return
          if (toTargetsRef.current) {
            resolve()
            return
          }
          waitFrame = requestAnimationFrame(poll)
        }
        poll()
      })

    const waitForCenterHold = () =>
      new Promise<void>((resolve) => {
        pauseTimer = window.setTimeout(() => resolve(), FOLDER_CENTER_HOLD_AFTER_GATHER_MS)
      })

    const startStackMorph = () => {
      if (cancelled || morphDoneRef.current || stackScheduled) return
      stackScheduled = true
      setStackMorphActive(true)

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

    centerControl = runFolderCenterGatherProgress(setCenterProgress)
    centerControl.then(() => {
      if (morphDoneRef.current || cancelled) return
      void Promise.all([waitForCenterHold(), waitForStackTargets()]).then(() => {
        if (!cancelled && !morphDoneRef.current) startStackMorph()
      })
    })

    return () => {
      cancelled = true
      centerControl?.stop()
      stackControl?.stop()
      window.clearTimeout(pauseTimer)
      cancelAnimationFrame(waitFrame)
    }
  }, [sessionActive, fromTargets])

  const folderCount = fromTargets.length

  return (
    <div
      className="drawer-folder-morph-overlay"
      aria-hidden="true"
    >
      {gatherFrom.map((from, index) => {
        const center = centerSnapshots[index]
        const to = toTargets?.[index] ?? center
        const stackLocalT = stackMorphActive
          ? morphProgressForIndex(stackProgress, index, folderCount)
          : 0
        const layout = stackMorphActive
          ? lerpFolderLayout(center, to, stackLocalT)
          : lerpFolderGatherShift(
              from,
              gatherShift.dx,
              gatherShift.dy,
              centerProgress,
              gatherSizeMult,
            )

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
