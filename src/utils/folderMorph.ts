import { animate } from 'framer-motion'

export const CABINET_EXIT_DURATION_MS = 420
/** Hold folders-only view before morph begins. */
export const FOLDER_PAUSE_DURATION_MS = 780
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
    width: element.offsetWidth,
    height: element.offsetHeight,
    ...layout,
  }
}

/** Bottom folder first, then upward one by one. */
export function morphProgressForIndex(globalProgress: number, index: number, count: number) {
  const orderFromBottom = count - 1 - index
  const start = orderFromBottom * MORPH_FOLDER_STAGGER
  const local = Math.min(1, Math.max(0, (globalProgress - start) / MORPH_FOLDER_ITEM_DURATION))
  return smoothstep(local)
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

  return Array.from(wrappers)
    .slice(0, count)
    .map((wrapper) => {
      const card = wrapper.querySelector<HTMLElement>('[data-purpose="contact-card"]')
      if (!card) return null

      const rect = wrapper.getBoundingClientRect()

      return {
        left: rect.left,
        top: rect.top,
        width: card.offsetWidth,
        height: card.offsetHeight,
        ...STACK_MORPH_LAYOUT,
      }
    })
    .filter((target): target is FolderLayoutSnapshot => target !== null)
}

export function measureStackFolderRects(count: number) {
  return measureStackFolderTargets(count).map(({ left, top, width, height }) => ({
    left,
    top,
    width,
    height,
  }))
}

export function runFolderMorphProgress(onUpdate: (progress: number) => void) {
  return animate(0, 1, {
    duration: FOLDER_MORPH_DURATION_MS / 1000,
    ease: FOLDER_MORPH_EASE,
    onUpdate,
  })
}
