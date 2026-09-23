import { FOLDER_DESIGN } from '../../config/folderDesign'
import type { Contact } from '../../data/contacts'
import { DRAWER_BOTTOM } from './cabinet2Layout'

export const DRAWER_FOLDER_COUNT = 8

const FOLDER_ASPECT = FOLDER_DESIGN.height / FOLDER_DESIGN.width
const DRAWER_STACK_OVERLAP_RATIO = 168 / FOLDER_DESIGN.width
const WIDTH_PADDING = 0.88
const FOLDER_SCALE = 0.98
const FOLDER_ROTATE_X = -40
const DRAWER_TOP_PAD = -6
const DRAWER_BOTTOM_PAD = 46
/** Extra shift toward drawer back (smaller y = up). */
const STACK_VERTICAL_NUDGE = -54
/** Per-folder dip below slot.y at rest — keeps stack shape so folders read as already inside. */
export const DRAWER_FOLDER_POP_REST_OFFSET = 18
/** Delay after door animation starts before folders begin popping (ms). */
export const DRAWER_FOLDER_POP_DELAY_MS = 90
/** Base ms for one folder's pop segment (scaled by total timeline). */
export const DRAWER_FOLDER_POP_DURATION_MS = 400
/** Deeper dip on close — larger travel than open rest offset. */
export const DRAWER_FOLDER_POP_CLOSE_REST_OFFSET = 36
/** Per-folder close timing — each folder eases independently for a smooth wave. */
export const DRAWER_FOLDER_POP_CLOSE_STAGGER_MS = 42
export const DRAWER_FOLDER_POP_CLOSE_ITEM_MS = 300
/** Stagger between each folder's pop-in (timeline units). */
export const DRAWER_FOLDER_POP_STAGGER = 0.18
/** Duration of each individual folder's pop segment (timeline units). */
export const DRAWER_FOLDER_POP_ITEM_DURATION = 0.32

/** Max folderPull needed so every folder completes (depends on count + stagger). */
export function drawerFolderPopMaxPull(count: number) {
  if (count <= 1) return DRAWER_FOLDER_POP_ITEM_DURATION
  return (count - 1) * DRAWER_FOLDER_POP_STAGGER + DRAWER_FOLDER_POP_ITEM_DURATION
}

export function drawerFolderPopTotalDurationMs(count: number) {
  return Math.round(DRAWER_FOLDER_POP_DURATION_MS * drawerFolderPopMaxPull(count))
}

export function drawerFolderPopCloseTotalDurationMs(count: number) {
  if (count <= 1) return DRAWER_FOLDER_POP_CLOSE_ITEM_MS
  return (count - 1) * DRAWER_FOLDER_POP_CLOSE_STAGGER_MS + DRAWER_FOLDER_POP_CLOSE_ITEM_MS
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

/** Top-first sink progress — one smooth ease-out segment per folder. */
export function drawerFolderCloseSinkProgress(elapsedMs: number, index: number, _count: number) {
  const start = index * DRAWER_FOLDER_POP_CLOSE_STAGGER_MS
  const localT = Math.min(Math.max((elapsedMs - start) / DRAWER_FOLDER_POP_CLOSE_ITEM_MS, 0), 1)
  return easeOutCubic(localT)
}

export function drawerFolderCloseY(slotY: number, sink: number) {
  return slotY + sink * DRAWER_FOLDER_POP_CLOSE_REST_OFFSET
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function drawerWidthAtDepth(t: number) {
  const backW = DRAWER_BOTTOM[3].x - DRAWER_BOTTOM[0].x
  const frontW = DRAWER_BOTTOM[2].x - DRAWER_BOTTOM[1].x
  return lerp(backW, frontW, t)
}

function drawerCenterXAtDepth(t: number) {
  const backL = DRAWER_BOTTOM[0].x
  const backR = DRAWER_BOTTOM[3].x
  const frontL = DRAWER_BOTTOM[1].x
  const frontR = DRAWER_BOTTOM[2].x
  return lerp((backL + backR) / 2, (frontL + frontR) / 2, t)
}

export interface DrawerFolderSlot {
  id: string
  name: string
  x: number
  /** Target Y on drawer-bottom plane (local 13 → back, 276 → front). */
  y: number
  width: number
  height: number
  rotateX: number
  scale: number
  zIndex: number
}

/** Vertical stack filling drawer floor from back (top) to front (door). */
export function layoutDrawerFolders(contacts: Contact[]): DrawerFolderSlot[] {
  const count = Math.min(contacts.length, DRAWER_FOLDER_COUNT)
  if (count === 0) return []

  const floorBackY = DRAWER_BOTTOM[0].y
  const drawerTop = floorBackY + DRAWER_TOP_PAD
  const drawerBottom = DRAWER_BOTTOM[1].y - DRAWER_BOTTOM_PAD
  const backDepth = 0.35
  const frontDepth = 0.86

  const slots: DrawerFolderSlot[] = []

  for (let i = 0; i < count; i++) {
    const depth = count === 1 ? 0.75 : backDepth + ((frontDepth - backDepth) * i) / (count - 1)
    const slotWidth = drawerWidthAtDepth(depth) * WIDTH_PADDING
    const slotHeight = slotWidth * FOLDER_ASPECT
    const centerX = drawerCenterXAtDepth(depth)

    slots.push({
      id: contacts[i].id,
      name: contacts[i].name,
      x: centerX - slotWidth / 2,
      y: drawerTop,
      width: slotWidth,
      height: slotHeight,
      rotateX: FOLDER_ROTATE_X,
      scale: FOLDER_SCALE,
      zIndex: i + 1,
    })
  }

  if (count === 1) {
    slots[0].y = drawerTop
    return slots
  }

  const lastHeight = slots[count - 1].height
  const spanNeeded = drawerBottom - drawerTop - lastHeight
  const sumExceptLast = slots.slice(0, -1).reduce((sum, slot) => sum + slot.height, 0)
  const defaultOverlap = slots[0].width * DRAWER_STACK_OVERLAP_RATIO
  const avgHeight = sumExceptLast / (count - 1)
  let overlap = (sumExceptLast - spanNeeded) / (count - 1)
  overlap = Math.max(avgHeight * 0.32, Math.min(defaultOverlap * 1.1, overlap))

  let currentY = drawerTop
  for (let i = 0; i < count; i++) {
    slots[i].y = currentY
    if (i < count - 1) {
      currentY += slots[i].height - overlap
    }
  }

  for (const slot of slots) {
    slot.y += STACK_VERTICAL_NUDGE
  }

  return slots
}

/** Staggered pop-in progress — bottom folder first, then upward. */
export function drawerFolderPopProgress(pull: number, index: number, count: number) {
  const orderFromBottom = count - 1 - index
  const start = orderFromBottom * DRAWER_FOLDER_POP_STAGGER
  return Math.min(1, Math.max(0, (pull - start) / DRAWER_FOLDER_POP_ITEM_DURATION))
}

export function drawerFolderPopY(slotY: number, easedPop: number) {
  return slotY + (1 - easedPop) * DRAWER_FOLDER_POP_REST_OFFSET
}

export function drawerFolderPopEased(progress: number) {
  return 1 - Math.pow(1 - progress, 3)
}

