/** cabinet-2.svg — closed viewBox 460×481, open extends to y=757. */
export const CABINET2_VIEW = { w: 460, h: 757 } as const
export const CABINET2_CLOSED_H = 481

/** Drawer travel along Y from closed to open (SVG units). */
export const DRAWER_TRAVEL_Y = 276

export type Point = { x: number; y: number }

export const toPoly = (pts: Point[]) => pts.map((p) => `${p.x},${p.y}`).join(' ')

/** Static cabinet layers. */
export const CABINET_INNER = [
  { x: 404.9, y: 463.5 },
  { x: 55.1, y: 463.5 },
  { x: 1.38, y: 276 },
  { x: 458.62, y: 276 },
]

export const CABINET_THICKNESS_D =
  'M1.38,276L55.1,463.5h349.8L458.62,276H1.38z M395.1,450.5H64.9L18.63,289h422.74L395.1,450.5z'

export const CABINET_TOP = [
  { x: 437.14, y: 0 },
  { x: 23.52, y: 0 },
  { x: 1.38, y: 276 },
  { x: 458.62, y: 276 },
]

/** Drawer group — closed-state geometry from cabinet-2.svg (moves as one unit). */
export const DRAWER_BOTTOM = [
  { x: 76.27, y: 13 },
  { x: 57.75, y: 276 },
  { x: 402.25, y: 276 },
  { x: 383.73, y: 13 },
]

export const DRAWER_SIDE_LEFT = [
  { x: 35.12, y: 13 },
  { x: 11.64, y: 276 },
  { x: 57.75, y: 276 },
  { x: 76.27, y: 13 },
]

export const DRAWER_SIDE_RIGHT = [
  { x: 424.88, y: 13 },
  { x: 383.73, y: 13 },
  { x: 402.25, y: 276 },
  { x: 448.36, y: 276 },
]

export const DRAWER_THICKNESS = [
  { x: 1.4, y: 276 },
  { x: 0, y: 293.5 },
  { x: 460, y: 293.5 },
  { x: 458.64, y: 276 },
]

export const DRAWER_DOOR = [
  { x: 406.28, y: 481 },
  { x: 53.72, y: 481 },
  { x: 0, y: 293.5 },
  { x: 460, y: 293.5 },
]

export const DRAWER_HANDLE_SLOT_D =
  'M312.07,330.3L312.07,330.3c0.71-6.64-4.49-12.43-11.17-12.43H159.1c-6.68,0-11.88,5.79-11.17,12.43v0c0.61,5.71,5.43,10.04,11.17,10.04h141.8C306.64,340.34,311.46,336.01,312.07,330.3z'

export const DRAWER_HANDLE_LABEL_D =
  'M303.1,414.09l4.03-37.63c0.57-5.33-3.61-9.98-8.96-9.98H161.84c-5.36,0-9.54,4.65-8.96,9.98l4.03,37.63c0.49,4.58,4.36,8.06,8.96,8.06h128.26C298.74,422.14,302.6,418.67,303.1,414.09z'

/** Drawer interior stays at open position. */
export const DRAWER_INTERIOR_Y = DRAWER_TRAVEL_Y

/** Cabinet opening bottom edge (cabinet-top lower edge) in world Y. */
export const CABINET_OPENING_Y = 276

/** Inner top edge of cabinet-thickness frame (opening inset). */
export const CABINET_INNER_OPENING_Y = 289

/** Door-group local Y of lip / door top edge (closed-state coords). */
export const DOOR_GROUP_TOP_Y = 293.5

/** Folder clip top — fixed at cabinet-thickness inner edge. */
export const FOLDER_CLIP_Y = CABINET_INNER_OPENING_Y

/** Clip height tracks drawer lip (doorY) while top stays fixed. */
export function folderClipRect(doorY: number) {
  return {
    x: 0,
    y: FOLDER_CLIP_Y,
    width: CABINET2_VIEW.w,
    height: Math.max(0, doorY + DOOR_GROUP_TOP_Y - FOLDER_CLIP_Y),
  }
}

/** Door + lip travel for pull ∈ [0, 1] (0 = closed, 1 = open). */
export function doorOffsetY(pull: number) {
  return pull * DRAWER_TRAVEL_Y
}

/**
 * Viewport rect in door-group local coords — red-box window from cabinet opening
 * to door top; moves with the door via parent translate.
 */
export function drawerViewportLocalRect(doorY: number) {
  return {
    x: 0,
    y: CABINET_OPENING_Y - doorY,
    width: CABINET2_VIEW.w,
    height: Math.max(0, doorY + DOOR_GROUP_TOP_Y - CABINET_OPENING_Y),
  }
}

/**
 * Clip drawer interior below cabinet-top (even-odd: full canvas minus top face).
 * clipPathUnits="userSpaceOnUse" — fixed in SVG space while drawer-group moves.
 */
export const DRAWER_INTERIOR_CLIP_D = `M0,0H${CABINET2_VIEW.w}V${CABINET2_VIEW.h}H0Z M458.62,276L1.38,276L23.52,0L437.14,0Z`
