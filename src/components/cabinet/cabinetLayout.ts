/** SVG layout — cabinet viewBox (780 × 890). */
export const CABINET_VIEW = { x: 0, w: 780, h: 890 } as const

const MARK_SIZE = 21.1632

/** A — drawer front. SVG units in cabinet viewBox (780 × 890). */
export const PART_A = { x: 160, y: 614, w: 460, h: 276 }

/** A internals — SVG units relative to PART_A origin (160, 614). */
export const PART_A_SLOT = { x: 142.5, y: 65, w: 176, h: 24, r: 12 }
export const PART_A_HANDLE = { x: 142.5, y: 141, w: 176, h: 36, r: 12 }
export const PART_A_TITLE = {
  x: 160.1182,
  y: 151.8378,
  size: 17.123,
  text: 'Kyries’ secret files',
}
export const PART_A_MARK = { x: 387.9229, y: 168.6162, size: 34.1272, text: 'A' }

/** B — strip above drawer. Origin (160, 596). */
export const PART_B = { x: 160, y: 596, w: 460, h: 18, fill: '#0039FF' }
export const PART_B_MARK = { x: 220.0824, y: 15.8568, size: MARK_SIZE, text: 'B' }

const WALL_WIDTH = 180

/** Cabinet shell depth — E/D/F Z alignment. */
export const CABINET_DEPTH = 536

/** Drawer interior — floor C and wall height. */
export const DRAWER_WALL_HEIGHT = WALL_WIDTH

/**
 * C floor depth — when drawer closed (Z −518), back edge must not pass F back (Z −812).
 * Max depth = 812 − 518 = 294.
 */
export const DRAWER_FLOOR_DEPTH = 294

/** C — drawer floor. */
export const PART_C = { x: 190, y: 556, w: 400, h: DRAWER_FLOOR_DEPTH, fill: '#2EDEFF' }
export const PART_C_MARK = { x: 205.5525, y: 31.1725, size: MARK_SIZE, text: 'C' }

/** Drawer insert depth — B back edge meets E front (536 − 18). */
export const DRAWER_INSERT_Z = CABINET_DEPTH - PART_B.h

/**
 * Drawer open offset — C back stays at E front (Z −536), still inside frame.
 * open Z = −536 + 294 = −242.
 */
export const DRAWER_OPEN_Z = CABINET_DEPTH - DRAWER_FLOOR_DEPTH

/** C1 / C2 — side walls (rendered inside CabinetInterior). */
export const PART_C1_MARK = { size: MARK_SIZE, text: 'C1' }
export const PART_C2_MARK = { size: MARK_SIZE, text: 'C2' }

/** Shift D/E/F down so E bottom aligns with A bottom. */
const DEF_SHIFT_Y = PART_A.y + PART_A.h - (320 + 276)

/** D — inner shelf on E. Origin (180, 340). */
export const PART_D = { x: 180, y: 340 + DEF_SHIFT_Y, w: 420, h: 236, fill: '#E9FF8B' }
export const PART_D_MARK = { x: 215.5525, y: 95.625, size: MARK_SIZE, text: 'D' }

/** E — outer shelf around D. Bottom aligned with A. */
export const PART_E = { x: 160, y: 320 + DEF_SHIFT_Y, w: 460, h: 276, fill: '#FFD573' }
export const PART_E_MARK = { x: 236.6106, y: 18.2266, size: MARK_SIZE, text: 'E' }

/** F — top panel. */
export const PART_F = { x: 160, y: 0 + DEF_SHIFT_Y, w: 460, h: 320, fill: '#73FFAE' }
export const PART_F_MARK = { x: 235.5525, y: 167.5762, size: MARK_SIZE, text: 'F' }

export type CabinetRect = { x: number; y: number; w: number; h: number; fill?: string }
export type CabinetMark = { x: number; y: number; size: number; text: string }

export const toPct = (x: number, y: number, w: number, h: number) => ({
  left: ((x - CABINET_VIEW.x) / CABINET_VIEW.w) * 100,
  top: (y / CABINET_VIEW.h) * 100,
  width: (w / CABINET_VIEW.w) * 100,
  height: (h / CABINET_VIEW.h) * 100,
})

export const toBoxStyle = (x: number, y: number, w: number, h: number) => {
  const p = toPct(x, y, w, h)
  return {
    left: `${p.left}%`,
    top: `${p.top}%`,
    width: `${p.width}%`,
    height: `${p.height}%`,
  }
}
