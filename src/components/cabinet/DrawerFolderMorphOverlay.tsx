import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import DrawerMiniFolder from './DrawerMiniFolder'
import {
  CABINET_EXIT_DURATION_MS,
  type FolderLayoutSnapshot,
  cabinetExitRevealScale,
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
  morphActive: boolean
  pageUnderlay?: boolean
  onComplete: () => void
}

export default function DrawerFolderMorphOverlay({
  fromTargets,
  names,
  morphActive,
  pageUnderlay = false,
  onComplete,
}: DrawerFolderMorphOverlayProps) {
  const [toTargets, setToTargets] = useState<FolderLayoutSnapshot[] | null>(null)
  const [progress, setProgress] = useState(0)
  const [exitProgress, setExitProgress] = useState(0)
  const completeRef = useRef(onComplete)
  completeRef.current = onComplete

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
      if (attempts < 24) {
        requestAnimationFrame(measure)
      }
    }

    measure()
    return () => {
      cancelled = true
    }
  }, [fromTargets.length, morphActive])

  useEffect(() => {
    if (morphActive) {
      setExitProgress(1)
      return
    }

    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min((now - start) / CABINET_EXIT_DURATION_MS, 1)
      setExitProgress(t)
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [morphActive])

  useEffect(() => {
    if (!morphActive || !toTargets) return

    let cancelled = false
    let control: ReturnType<typeof runFolderMorphProgress> | null = null
    let frame = 0

    frame = requestAnimationFrame(() => {
      if (cancelled) return
      frame = requestAnimationFrame(() => {
        if (cancelled) return
        control = runFolderMorphProgress(setProgress)
        control.then(() => completeRef.current())
      })
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      control?.stop()
    }
  }, [morphActive, toTargets])

  const folderCount = fromTargets.length
  const revealScale = morphActive ? 1 : cabinetExitRevealScale(exitProgress)

  return (
    <div
      className={`drawer-folder-morph-overlay${
        pageUnderlay ? ' drawer-folder-morph-overlay--page-underlay' : ''
      }`}
      aria-hidden="true"
    >
      {fromTargets.map((from, index) => {
        const to = toTargets?.[index] ?? from
        const localT = morphActive && toTargets
          ? morphProgressForIndex(progress, index, folderCount)
          : 0
        const layout = lerpFolderLayout(from, to, localT)

        return (
          <div
            key={names[index]}
            className="drawer-folder-morph-clone"
            style={{
              left: layout.left,
              top: layout.top,
              width: layout.width,
              height: layout.height,
              zIndex: morphZIndexForIndex(index, folderCount, localT),
              opacity: morphFolderOpacity(),
              transform: `translateZ(0) scale(${revealScale})`,
              transformOrigin: '50% 50%',
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
