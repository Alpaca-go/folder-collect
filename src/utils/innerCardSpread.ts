import {
  INNER_CARD_SPREAD,
  INNER_CARD_SPREAD_COUNT,
  INNER_POCKET_CARD_COUNT,
  INNER_SPREAD_EXTRA_CARD_COUNT,
} from '../config/folderDesign'

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
  const {
    rotateMin,
    rotateMax,
    offsetX,
    offsetY,
    delayBase,
    delayStep,
    delayJitter,
    gatherCenterPullPerStep,
    gatherLeftReachRatio,
    stackRearNudgeX,
    stackRearNudgeY,
  } = INNER_CARD_SPREAD

  return Array.from({ length: count }, (_, i) => {
    const rotate = rotateMin + rand() * (rotateMax - rotateMin)
    const pull = Math.max(0.58, 1 - i * gatherCenterPullPerStep)
    const capX = offsetX * pull
    const capY = offsetY * pull
    const rawX = (rand() - 0.5) * 2 * capX
    const rawY = (rand() - 0.5) * 2 * capY
    let x = Math.max(-capX * gatherLeftReachRatio, Math.min(capX, rawX))
    let y = Math.max(-capY, Math.min(capY, rawY))
    if (i === 0) {
      x += stackRearNudgeX
      y += stackRearNudgeY
    }
    const zIndex =
      i < INNER_POCKET_CARD_COUNT
        ? i + INNER_SPREAD_EXTRA_CARD_COUNT + 1
        : i - INNER_POCKET_CARD_COUNT + 1

    return {
      rotate,
      x,
      y,
      delay: delayBase + i * delayStep + rand() * delayJitter,
      zIndex,
    }
  })
}
