import { animate } from 'framer-motion'

export const CABINET_EXIT_DURATION_MS = 420
/** Move drawer pile to viewport center as one group. */
export const FOLDER_CENTER_GATHER_DURATION_MS = 400
/**
 * Size multiplier on morph clone width/height at viewport center.
 * Applied via layout box — not CSS transform scale — so SVG/text stay sharp.
 */
export const FOLDER_CENTER_GATHER_SIZE_MULT = 1.3
/**
 * Idle hold after gather animation has finished (not the gather duration itself).
 * Used in DrawerFolderMorphOverlay after runFolderCenterGatherProgress completes.
 */
export const FOLDER_CENTER_HOLD_AFTER_GATHER_MS = 48
/** @deprecated Use FOLDER_CENTER_HOLD_AFTER_GATHER_MS */
export const FOLDER_PAUSE_DURATION_MS = FOLDER_CENTER_HOLD_AFTER_GATHER_MS
export const FOLDER_MORPH_DURATION_MS = 2200
/** Delay between each folder start, as a fraction of the total morph timeline. */
export const MORPH_FOLDER_STAGGER = 0.075
/** How long each folder takes to reach its target, as a fraction of the total timeline. */
export const MORPH_FOLDER_ITEM_DURATION = 0.475
export const MORPH_FOLDER_COUNT = 8

/** Smooth deceleration — long ease-out tail for spatial movement. */
export const FOLDER_MORPH_EASE = [0.33, 0, 0.2, 1] as const

export const DRAWER_MORPH_LAYOUT = {
  rotateX: -40,
  scale: 0.98,
  perspective: 500,
  transformOriginY: 100,
  liftY: -10,
} as const

export const STACK_MORPH_LAYOUT = {
  rotateX: -40,
  scale: 0.965,
  perspective: 1200,
  transformOriginY: 0,
  liftY: 0,
} as const

export interface FolderLayoutSnapshot {
  left: number
  top: number
  width: number
  height: number
  rotateX: number
  scale: number
  perspective: number
  transformOriginY: number
  liftY: number
}

export function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

export function easeInOutQuart(t: number) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}

export function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/**
 * Layout box for morph clones. FolderCard uses transform-origin 50% 0% — do not
 * center layout box on the transformed visual rect.
 */
function measureElementLayoutBox(
  element: HTMLElement,
  layout: Omit<FolderLayoutSnapshot, 'left' | 'top' | 'width' | 'height'>,
) {
  const rect = element.getBoundingClientRect()

  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    ...layout,
  }
}

/** Layout snapshots from click-time getBoundingClientRect (matches visible drawer slots). */
export function folderLayoutsFromRects(
  rects: DOMRect[],
  count: number,
  layout: Omit<FolderLayoutSnapshot, 'left' | 'top' | 'width' | 'height'> = DRAWER_MORPH_LAYOUT,
): FolderLayoutSnapshot[] {
  return rects.slice(0, count).map((rect) => ({
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    ...layout,
  }))
}

export function computeViewportGatherShift(targets: FolderLayoutSnapshot[]) {
  const cluster = folderClusterCenter(targets)
  const { x: midX, y: midY } = viewportCenter()
  return { dx: midX - cluster.x, dy: midY - cluster.y }
}

/** Grow layout box from its center (keeps DRAWER_MORPH_LAYOUT.scale for 3D only). */
export function scaleFolderSnapshotFromCenter(
  snapshot: FolderLayoutSnapshot,
  sizeMult: number,
): FolderLayoutSnapshot {
  if (sizeMult === 1) return snapshot

  const cx = snapshot.left + snapshot.width / 2
  const cy = snapshot.top + snapshot.height / 2
  const width = snapshot.width * sizeMult
  const height = snapshot.height * sizeMult

  return {
    ...snapshot,
    left: cx - width / 2,
    top: cy - height / 2,
    width,
    height,
  }
}

/** Rigid group translate toward viewport center (single dx/dy for every folder). */
export function lerpFolderGatherShift(
  from: FolderLayoutSnapshot,
  dx: number,
  dy: number,
  t: number,
  sizeMult = FOLDER_CENTER_GATHER_SIZE_MULT,
) {
  const u = easeInOutQuart(t)
  const mul = lerp(1, sizeMult, u)
  const cx = from.left + from.width / 2 + dx * u
  const cy = from.top + from.height / 2 + dy * u
  const width = from.width * mul
  const height = from.height * mul

  return {
    ...from,
    left: cx - width / 2,
    top: cy - height / 2,
    width,
    height,
  }
}

/** Bottom folder first, then upward one by one. */
export function morphProgressForIndex(globalProgress: number, index: number, count: number) {
  const orderFromBottom = count - 1 - index
  const start = orderFromBottom * MORPH_FOLDER_STAGGER
  const local = Math.min(1, Math.max(0, (globalProgress - start) / MORPH_FOLDER_ITEM_DURATION))
  return smoothstep(local)
}

/** True once every folder has visually landed in the stack morph phase. */
export function areMorphFoldersSettled(
  globalProgress: number,
  count: number,
  threshold = 0.96,
) {
  for (let index = 0; index < count; index++) {
    if (morphProgressForIndex(globalProgress, index, count) < threshold) return false
  }
  return globalProgress > 0
}

/** Stack tab order: lower folders sit in front of the ones above. */
export function stackZIndexForIndex(index: number) {
  return index + 1
}

/** Stack tab order throughout morph — no in-flight z-index boost. */
export function morphZIndexForIndex(index: number, _count: number, _localT: number, base = 300) {
  return base + stackZIndexForIndex(index)
}

/** Folders stay visible throughout morph — z-index handles stacking order. */
export function morphFolderOpacity() {
  return 1
}

/** Smooth scale-up when overlay replaces the clipped drawer view. */
export function cabinetExitRevealScale(progress: number, from = 0.9) {
  const t = easeOutCubic(Math.min(1, Math.max(0, progress)))
  return lerp(from, 1, t)
}

export function folderClusterCenter(targets: FolderLayoutSnapshot[]) {
  if (targets.length === 0) return { x: 0, y: 0 }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const target of targets) {
    minX = Math.min(minX, target.left)
    minY = Math.min(minY, target.top)
    maxX = Math.max(maxX, target.left + target.width)
    maxY = Math.max(maxY, target.top + target.height)
  }

  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
}

export function translateFolderTargets(
  targets: FolderLayoutSnapshot[],
  dx: number,
  dy: number,
): FolderLayoutSnapshot[] {
  return targets.map((target) => ({
    ...target,
    left: target.left + dx,
    top: target.top + dy,
  }))
}

export function viewportCenter() {
  const viewport = window.visualViewport
  if (!viewport) {
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  }

  return {
    x: viewport.offsetLeft + viewport.width / 2,
    y: viewport.offsetTop + viewport.height / 2,
  }
}

/** Keep drawer-relative offsets; move the pile centroid to the viewport center. */
export function centerFolderTargetsInViewport(targets: FolderLayoutSnapshot[]) {
  const cluster = folderClusterCenter(targets)
  const { x: midX, y: midY } = viewportCenter()
  const dx = midX - cluster.x
  const dy = midY - cluster.y
  return translateFolderTargets(targets, dx, dy)
}

/** Center-gather: translate only — avoids transform/pivot lerps that skew the path. */
export function lerpFolderLayoutTranslate(
  from: FolderLayoutSnapshot,
  to: FolderLayoutSnapshot,
  t: number,
) {
  const u = easeInOutQuart(t)
  return {
    ...from,
    left: lerp(from.left, to.left, u),
    top: lerp(from.top, to.top, u),
  }
}

export function lerpFolderLayout(from: FolderLayoutSnapshot, to: FolderLayoutSnapshot, t: number) {
  const u = easeInOutQuart(t)
  const originU = easeInOutQuart(Math.min(1, t * 2.2))

  const fromCx = from.left + from.width / 2
  const fromCy = from.top + from.height / 2
  const toCx = to.left + to.width / 2
  const toCy = to.top + to.height / 2

  const width = lerp(from.width, to.width, u)
  const height = lerp(from.height, to.height, u)
  const cx = lerp(fromCx, toCx, u)
  const cy = lerp(fromCy, toCy, u)

  return {
    left: cx - width / 2,
    top: cy - height / 2,
    width,
    height,
    rotateX: lerp(from.rotateX, to.rotateX, u),
    scale: lerp(from.scale, to.scale, u),
    perspective: lerp(from.perspective, to.perspective, u),
    transformOriginY: lerp(from.transformOriginY, to.transformOriginY, originU),
    liftY: lerp(from.liftY, to.liftY, u),
  }
}

export function measureDrawerFolderTargets(count: number): FolderLayoutSnapshot[] {
  const slots = document.querySelectorAll<HTMLElement>('.drawer-folder-slot-hit')

  return Array.from(slots)
    .slice(0, count)
    .map((element) => measureElementLayoutBox(element, DRAWER_MORPH_LAYOUT))
}

export function measureStackFolderTargets(count: number): FolderLayoutSnapshot[] {
  const wrappers = document.querySelectorAll<HTMLElement>('#cards-stack .elastic-folder-wrapper')
  const targets: FolderLayoutSnapshot[] = []

  for (const wrapper of Array.from(wrappers).slice(0, count)) {
    const card = wrapper.querySelector<HTMLElement>('[data-purpose="contact-card"]')
    if (!card) continue

    const rect = wrapper.getBoundingClientRect()

    targets.push({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      ...STACK_MORPH_LAYOUT,
    })
  }

  return targets
}

export function measureStackFolderRects(count: number) {
  return measureStackFolderTargets(count).map(({ left, top, width, height }) => ({
    left,
    top,
    width,
    height,
  }))
}

export function runFolderCenterGatherProgress(onUpdate: (progress: number) => void) {
  return animate(0, 1, {
    duration: FOLDER_CENTER_GATHER_DURATION_MS / 1000,
    // Snappier stop than stack morph — avoids a long “already centered” tail.
    ease: [0.33, 0, 0.2, 1],
    onUpdate,
  })
}

export function runFolderMorphProgress(onUpdate: (progress: number) => void) {
  return animate(0, 1, {
    duration: FOLDER_MORPH_DURATION_MS / 1000,
    ease: FOLDER_MORPH_EASE,
    onUpdate,
  })
}
