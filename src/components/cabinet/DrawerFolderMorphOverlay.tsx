import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import DrawerMiniFolder from './DrawerMiniFolder'
import {
  FOLDER_CENTER_HOLD_AFTER_GATHER_MS,
  type FolderLayoutSnapshot,
  applyMorphCloneFrame,
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
  stackMeasureActive: boolean
  /** Center-gather runs for the whole exit session (starts on click, no restart at phase change). */
  gatherActive: boolean
  /** Stack morph waits until cabinet fade has finished. */
  stackMorphReady: boolean
  onComplete: () => void
}

export default function DrawerFolderMorphOverlay({
  fromTargets,
  names,
  stackMeasureActive,
  gatherActive,
  stackMorphReady,
  onComplete,
}: DrawerFolderMorphOverlayProps) {
  const completeRef = useRef(onComplete)
  const morphDoneRef = useRef(false)
  const toTargetsRef = useRef<FolderLayoutSnapshot[] | null>(null)
  const fromSnapshotRef = useRef(fromTargets)
  const stackMorphReadyRef = useRef(stackMorphReady)
  const cloneRefs = useRef<(HTMLDivElement | null)[]>([])
  const folderRefs = useRef<(HTMLDivElement | null)[]>([])
  const centerProgressRef = useRef(0)
  const stackProgressRef = useRef(0)
  const stackMorphActiveRef = useRef(false)

  completeRef.current = onComplete
  stackMorphReadyRef.current = stackMorphReady

  if (gatherActive) {
    fromSnapshotRef.current = fromTargets
  }

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

  const morphLayoutRef = useRef({
    gatherFrom,
    gatherShift,
    gatherSizeMult,
    centerSnapshots,
  })
  morphLayoutRef.current = {
    gatherFrom,
    gatherShift,
    gatherSizeMult,
    centerSnapshots,
  }

  const applyFrame = useCallback(
    (centerProgress: number, stackMorphActive: boolean, stackProgress: number) => {
      centerProgressRef.current = centerProgress
      stackProgressRef.current = stackProgress
      stackMorphActiveRef.current = stackMorphActive

      const { gatherFrom: from, gatherShift: shift, gatherSizeMult: sizeMult, centerSnapshots: centers } =
        morphLayoutRef.current
      const targets = toTargetsRef.current
      const folderCount = from.length

      for (let index = 0; index < folderCount; index++) {
        const start = from[index]
        const center = centers[index]
        const to = targets?.[index] ?? center
        const stackLocalT = stackMorphActive
          ? morphProgressForIndex(stackProgress, index, folderCount)
          : 0
        const layout = stackMorphActive
          ? lerpFolderLayout(center, to, stackLocalT)
          : lerpFolderGatherShift(start, shift.dx, shift.dy, centerProgress, sizeMult)

        const cloneEl = cloneRefs.current[index]
        const folderEl = folderRefs.current[index]
        if (!cloneEl || !folderEl) continue

        applyMorphCloneFrame(cloneEl, folderEl, layout, index)
      }
    },
    [],
  )

  useLayoutEffect(() => {
    if (!stackMeasureActive) return

    let cancelled = false
    let attempts = 0

    const commitTargets = (targets: FolderLayoutSnapshot[]) => {
      toTargetsRef.current = targets
      applyFrame(
        centerProgressRef.current,
        stackMorphActiveRef.current,
        stackProgressRef.current,
      )
    }

    const measure = () => {
      if (cancelled) return
      const targets = measureStackFolderTargets(fromTargets.length)
      if (targets.length === fromTargets.length) {
        commitTargets(targets)
        return
      }

      attempts += 1
      if (attempts < 60) {
        requestAnimationFrame(measure)
      }
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(measure)
    })
    return () => {
      cancelled = true
    }
  }, [fromTargets.length, stackMeasureActive, applyFrame])

  useLayoutEffect(() => {
    applyFrame(0, false, 0)
  }, [gatherFrom, applyFrame])

  useEffect(() => {
    if (!gatherActive) return

    morphDoneRef.current = false
    stackMorphActiveRef.current = false
    centerProgressRef.current = 0
    stackProgressRef.current = 0
    applyFrame(0, false, 0)

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

    const waitForStackMorphReady = () =>
      new Promise<void>((resolve) => {
        const poll = () => {
          if (cancelled || morphDoneRef.current) return
          if (stackMorphReadyRef.current) {
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
      stackMorphActiveRef.current = true

      stackControl = runFolderMorphProgress((value) => {
        applyFrame(1, true, value)
        if (areMorphFoldersSettled(value, folderCount)) {
          finishMorph()
        }
      }, folderCount)
      stackControl.then(() => {
        if (!morphDoneRef.current) finishMorph()
      })
    }

    centerControl = runFolderCenterGatherProgress((progress) => {
      applyFrame(progress, false, 0)
    })
    centerControl.then(() => {
      if (morphDoneRef.current || cancelled) return
      void Promise.all([
        waitForCenterHold(),
        waitForStackTargets(),
        waitForStackMorphReady(),
      ]).then(() => {
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
  }, [gatherActive, fromTargets, applyFrame])

  const folderCount = fromTargets.length

  return (
    <div className="drawer-folder-morph-overlay" aria-hidden="true">
      {gatherFrom.map((from, index) => (
        <div
          key={names[index]}
          ref={(el) => {
            cloneRefs.current[index] = el
          }}
          className="drawer-folder-morph-clone"
          style={{
            width: from.width,
            height: from.height,
            zIndex: morphZIndexForIndex(index, folderCount, 0),
            opacity: morphFolderOpacity(),
          }}
        >
          <DrawerMiniFolder
            morphOverlay
            folderRootRef={(el) => {
              folderRefs.current[index] = el
            }}
            name={names[index]}
            index={index}
            width={from.width}
            rotateX={from.rotateX}
            scale={from.scale}
            perspective={from.perspective}
            transformOriginY={from.transformOriginY}
            liftY={from.liftY}
            isLast={index === folderCount - 1}
          />
        </div>
      ))}
    </div>
  )
}
