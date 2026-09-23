import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  animate,
  motionValue,
  type AnimationPlaybackControls,
  type MotionValue,
} from 'framer-motion'
import { ELASTIC_STACK } from '../config/elasticStack'

interface ElasticDragState {
  active: boolean
  pointerId: number | null
  startY: number
  lastY: number
  lastTime: number
  deltaY: number
  velocityY: number
  focusIndex: number | null
  startScrollTop: number
  dragMoved: boolean
  scrollOnly: boolean
  captured: boolean
}

interface UseElasticFolderStackOptions {
  containerRef: React.RefObject<HTMLElement | null>
  itemCount: number
  enabled: boolean
}

interface UseElasticFolderStackResult {
  elasticOffsets: MotionValue<number>[]
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void
  onPointerMove: (e: React.PointerEvent<HTMLElement>) => void
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => void
  suppressNextClick: () => boolean
}

function createInitialDragState(): ElasticDragState {
  return {
    active: false,
    pointerId: null,
    startY: 0,
    lastY: 0,
    lastTime: 0,
    deltaY: 0,
    velocityY: 0,
    focusIndex: null,
    startScrollTop: 0,
    dragMoved: false,
    scrollOnly: false,
    captured: false,
  }
}

type DragTarget =
  | { kind: 'elastic'; focusIndex: number }
  | { kind: 'scroll' }

function resolveDragTarget(event: React.PointerEvent<HTMLElement>): DragTarget | null {
  const target = event.target as HTMLElement

  const folderEl = target.closest<HTMLElement>('[data-folder-index]')
  if (folderEl) {
    const focusIndex = Number(folderEl.dataset.folderIndex)
    return Number.isFinite(focusIndex) ? { kind: 'elastic', focusIndex } : null
  }

  if (
    target.closest('[data-purpose="title-slot"]') ||
    target.closest('#cards-stack') ||
    target.closest('[data-purpose="files-scroll-container"]')
  ) {
    return { kind: 'scroll' }
  }

  return null
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function useElasticFolderStack({
  containerRef,
  itemCount,
  enabled,
}: UseElasticFolderStackOptions): UseElasticFolderStackResult {
  const elasticOffsets = useMemo(
    () => Array.from({ length: itemCount }, () => motionValue(0)),
    [itemCount],
  )

  const dragRef = useRef<ElasticDragState>(createInitialDragState())
  const suppressClickRef = useRef(false)
  const momentumControlsRef = useRef<AnimationPlaybackControls | null>(null)
  const releaseControlsRef = useRef<AnimationPlaybackControls[]>([])
  const frameRef = useRef<number | null>(null)
  const pendingMoveRef = useRef<{
    deltaY: number
    velocityY: number
    focusIndex: number
    startScrollTop: number
    scrollOnly: boolean
  } | null>(null)

  const getStackElement = useCallback(() => {
    return containerRef.current?.querySelector<HTMLElement>('#cards-stack') ?? null
  }, [containerRef])

  const setDraggingVisual = useCallback(
    (active: boolean) => {
      getStackElement()?.classList.toggle('is-elastic-dragging', active)
    },
    [getStackElement],
  )

  const cancelScheduledMove = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
    pendingMoveRef.current = null
  }, [])

  const stopAnimations = useCallback(() => {
    momentumControlsRef.current?.stop()
    momentumControlsRef.current = null
    releaseControlsRef.current.forEach((control) => control.stop())
    releaseControlsRef.current = []
  }, [])

  const resetOffsets = useCallback(() => {
    elasticOffsets.forEach((value) => value.set(0))
  }, [elasticOffsets])

  useEffect(() => {
    if (!enabled) {
      stopAnimations()
      cancelScheduledMove()
      setDraggingVisual(false)
      resetOffsets()
      dragRef.current = createInitialDragState()
    }
  }, [cancelScheduledMove, enabled, resetOffsets, setDraggingVisual, stopAnimations])

  const computeStrength = useCallback((velocityY: number) => {
    const speedRatio = Math.min(Math.abs(velocityY) / 1400, 1)
    return Math.min(1, ELASTIC_STACK.dragStrength + speedRatio * ELASTIC_STACK.velocityBoost)
  }, [])

  const applyElasticOffsets = useCallback(
    (deltaY: number, velocityY: number, focusIndex: number) => {
      const strength = computeStrength(velocityY)

      elasticOffsets.forEach((value, index) => {
        const distance = Math.abs(index - focusIndex)
        const influence = Math.exp(-distance / ELASTIC_STACK.falloff)
        const offset = clamp(
          deltaY * influence * strength,
          -ELASTIC_STACK.maxElasticOffset,
          ELASTIC_STACK.maxElasticOffset,
        )
        value.set(Math.round(offset * 100) / 100)
      })
    },
    [computeStrength, elasticOffsets],
  )

  const flushMove = useCallback(() => {
    frameRef.current = null
    const pending = pendingMoveRef.current
    const container = containerRef.current
    if (!pending || !container || !dragRef.current.active) return

    if (pending.scrollOnly) {
      container.scrollTop = pending.startScrollTop - pending.deltaY
    } else {
      const globalScrollDelta = pending.deltaY * ELASTIC_STACK.globalScrollRatio
      container.scrollTop = pending.startScrollTop - globalScrollDelta
      applyElasticOffsets(pending.deltaY, pending.velocityY, pending.focusIndex)
    }
  }, [applyElasticOffsets, containerRef])

  const scheduleMove = useCallback(
    (
      deltaY: number,
      velocityY: number,
      focusIndex: number,
      startScrollTop: number,
      scrollOnly: boolean,
    ) => {
      pendingMoveRef.current = { deltaY, velocityY, focusIndex, startScrollTop, scrollOnly }

      if (frameRef.current !== null) return

      frameRef.current = requestAnimationFrame(flushMove)
    },
    [flushMove],
  )

  const releaseElasticOffsets = useCallback(() => {
    releaseControlsRef.current.forEach((control) => control.stop())
    releaseControlsRef.current = elasticOffsets.map((value) =>
      animate(value, 0, {
        type: 'spring',
        stiffness: ELASTIC_STACK.releaseSpring.stiffness,
        damping: ELASTIC_STACK.releaseSpring.damping,
      }),
    )
  }, [elasticOffsets])

  const applyMomentum = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const drag = dragRef.current
    let momentumDistance = drag.velocityY * ELASTIC_STACK.momentumMultiplier
    momentumDistance = clamp(
      momentumDistance,
      -ELASTIC_STACK.maxMomentumDistance,
      ELASTIC_STACK.maxMomentumDistance,
    )

    if (Math.abs(momentumDistance) < 1) return

    const maxScroll = container.scrollHeight - container.clientHeight
    const targetScrollTop = clamp(
      container.scrollTop - momentumDistance,
      0,
      maxScroll,
    )

    const scrollProxy = motionValue(container.scrollTop)
    momentumControlsRef.current?.stop()
    momentumControlsRef.current = animate(scrollProxy, targetScrollTop, {
      type: 'spring',
      stiffness: ELASTIC_STACK.momentumSpring.stiffness,
      damping: ELASTIC_STACK.momentumSpring.damping,
      onUpdate: (value) => {
        if (containerRef.current) containerRef.current.scrollTop = value
      },
    })
  }, [containerRef])

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!enabled) return
      if (e.button !== 0) return

      const dragTarget = resolveDragTarget(e)
      if (!dragTarget) return

      stopAnimations()
      resetOffsets()

      const now = performance.now()
      dragRef.current = {
        active: true,
        pointerId: e.pointerId,
        startY: e.clientY,
        lastY: e.clientY,
        lastTime: now,
        deltaY: 0,
        velocityY: 0,
        focusIndex: dragTarget.kind === 'elastic' ? dragTarget.focusIndex : null,
        startScrollTop: containerRef.current?.scrollTop ?? 0,
        dragMoved: false,
        scrollOnly: dragTarget.kind === 'scroll',
        captured: false,
      }
    },
    [containerRef, enabled, resetOffsets, stopAnimations],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const drag = dragRef.current
      if (!drag.active || drag.pointerId !== e.pointerId) return
      if (!drag.scrollOnly && drag.focusIndex === null) return

      const deltaY = e.clientY - drag.startY
      const now = performance.now()
      const frameDelta = e.clientY - drag.lastY
      const dt = Math.max(now - drag.lastTime, 8)
      const rawVelocityY = (frameDelta / dt) * 1000

      drag.velocityY =
        drag.velocityY * (1 - ELASTIC_STACK.velocitySmoothing) +
        rawVelocityY * ELASTIC_STACK.velocitySmoothing
      drag.lastY = e.clientY
      drag.lastTime = now
      drag.deltaY = deltaY

      if (Math.abs(deltaY) <= ELASTIC_STACK.dragThreshold) return

      if (!drag.scrollOnly) {
        const container = containerRef.current
        drag.scrollOnly = true
        drag.startScrollTop = container?.scrollTop ?? drag.startScrollTop
        drag.startY = e.clientY
        drag.deltaY = 0
        drag.focusIndex = null
        resetOffsets()
        setDraggingVisual(false)
      }

      if (!drag.captured) {
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.captured = true
      }

      drag.dragMoved = true
      if (!drag.scrollOnly) setDraggingVisual(true)
      scheduleMove(
        deltaY,
        drag.velocityY,
        drag.focusIndex ?? 0,
        drag.startScrollTop,
        drag.scrollOnly,
      )
    },
    [containerRef, resetOffsets, scheduleMove, setDraggingVisual],
  )

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const drag = dragRef.current
      if (!drag.active || drag.pointerId !== e.pointerId) return

      if (drag.captured && e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }

      cancelScheduledMove()
      setDraggingVisual(false)

      if (drag.dragMoved) {
        suppressClickRef.current = true
        releaseElasticOffsets()
        applyMomentum()
      } else {
        resetOffsets()
      }

      dragRef.current = createInitialDragState()
    },
    [applyMomentum, cancelScheduledMove, releaseElasticOffsets, resetOffsets, setDraggingVisual],
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      endDrag(e)
    },
    [endDrag],
  )

  const suppressNextClick = useCallback(() => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return true
    }
    return false
  }, [])

  return {
    elasticOffsets,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    suppressNextClick,
  }
}
