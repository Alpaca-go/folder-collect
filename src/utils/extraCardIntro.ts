import { designPx, SPREAD_PROMOTE } from '../config/folderDesign'
import type { SpreadCardLayout } from './innerCardSpread'
import type { PocketCardMeasure } from './pocketCardGeometry'

type IntroPhase = 'hidden' | 'visible'

/** Staggered stack behind the pinned pocket trio (slot 0 = nearest behind). */
export function extraCardBehindPocketPose(
  slot: number,
  pocketHandoff: PocketCardMeasure[],
  faceScale: number,
) {
  const n = Math.max(1, pocketHandoff.length)
  const cx = pocketHandoff.reduce((s, p) => s + p.x, 0) / n
  const cy = pocketHandoff.reduce((s, p) => s + p.y, 0) / n
  const avgR = pocketHandoff.reduce((s, p) => s + p.rotate, 0) / n

  return {
    x: cx + designPx((slot - 2) * 3.5, faceScale),
    y: cy + designPx(slot * 1.5 + 2, faceScale),
    rotate: avgR * 0.97 + (slot - 2) * 0.65,
    opacity: 1,
    scale: 0.995 - slot * 0.003,
  }
}

/** Five-card fade-in: from a tight cluster into each card's scattered stack slot. */
export function extraCardScatteredPose(
  layout: SpreadCardLayout,
  slot: number,
  faceScale: number,
  phase: IntroPhase,
) {
  const targetX = designPx(layout.x, faceScale)
  const targetY = designPx(layout.y, faceScale)
  const pull = SPREAD_PROMOTE.extraInClusterPull

  if (phase === 'visible') {
    return {
      x: targetX,
      y: targetY,
      rotate: layout.rotate,
      opacity: 1,
      scale: 1,
    }
  }

  const fanX = designPx((slot - 2) * 14, faceScale)
  const fanY = designPx(slot * 10 - 18, faceScale)

  return {
    x: targetX * pull + fanX,
    y: targetY * pull + fanY,
    rotate: layout.rotate * 0.4 + (slot - 2) * 5,
    opacity: 0,
    scale: 0.92,
  }
}
