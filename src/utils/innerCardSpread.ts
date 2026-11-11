import { INNER_CARD_SPREAD, INNER_CARD_SPREAD_COUNT } from '../config/folderDesign'

export type SpreadCardLayout = {
  rotate: number
  x: number
  y: number
  delay: number
  zIndex: number
}

function mulberry32(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashFolderSeed(id: string) {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 16777619)
  }
  return h >>> 0
}

/** Stable scattered stack per folder; count is configurable in folderDesign. */
export function generateSpreadCardLayouts(
  seed: number,
  count = INNER_CARD_SPREAD_COUNT,
): SpreadCardLayout[] {
  const rand = mulberry32(seed)
  const { rotateMin, rotateMax, offsetX, offsetY, delayBase, delayStep, delayJitter } =
    INNER_CARD_SPREAD

  return Array.from({ length: count }, (_, i) => {
    const rotate = rotateMin + rand() * (rotateMax - rotateMin)
    const x = (rand() - 0.5) * 2 * offsetX
    const y = (rand() - 0.5) * 2 * offsetY
    return {
      rotate,
      x,
      y,
      delay: delayBase + i * delayStep + rand() * delayJitter,
      zIndex: i + 1,
    }
  })
}
