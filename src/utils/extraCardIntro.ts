import { designPx, SPREAD_PROMOTE } from '../config/folderDesign'
import type { SpreadCardLayout } from './innerCardSpread'

type IntroPhase = 'hidden' | 'visible'

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
