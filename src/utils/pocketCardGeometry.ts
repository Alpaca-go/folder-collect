import {
  designPx,
  FOLDER_DESIGN,
  INNER_CARDS,
  innerCardPeekY,
  innerCardSize,
} from '../config/folderDesign'

export type PocketCardMeasure = {
  x: number
  y: number
  rotate: number
  width: number
  height: number
}

export function spreadStageClusterOrigin(): { x: number; y: number } | null {
  const stage = document.querySelector<HTMLElement>('.folder-spread-cards__stage')
  if (!stage) return null
  const rect = stage.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

/** Matches `.folder-spread-cards` clamp in index.css — usable before overlay mounts. */
export function spreadClusterOriginFromHost(hostEl: HTMLElement): { x: number; y: number } {
  const rect = hostEl.getBoundingClientRect()
  const dvh = window.innerHeight * 0.01
  const topInset = Math.min(Math.max(148, 24 * dvh), rect.height * 0.38)
  const bottomInset = Math.min(Math.max(72, 11 * dvh), rect.height * 0.2)
  const bandHeight = Math.max(0, rect.height - topInset - bottomInset)
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + topInset + bandHeight / 2,
  }
}

/** Pocket inner cards (0–2) in spread-cluster local coordinates. */
export function pocketCardsClusterLocal(
  folderEl: HTMLElement,
  clusterOrigin: { x: number; y: number },
): PocketCardMeasure[] {
  const rect = folderEl.getBoundingClientRect()
  const scale = rect.width / FOLDER_DESIGN.width
  const { width: cardWidth, height: cardHeight } = innerCardSize(scale)
  const pocketBottom = rect.top + rect.height * (1 - 16 / FOLDER_DESIGN.height)
  const peekY = innerCardPeekY(cardHeight, scale)
  const pocketCenterX = rect.left + rect.width / 2

  return INNER_CARDS.map((card) => {
    const cardBottom = pocketBottom + peekY
    const centerY = cardBottom - cardHeight / 2
    const centerX = pocketCenterX + designPx(card.x, scale)
    return {
      x: centerX - clusterOrigin.x,
      y: centerY - clusterOrigin.y,
      rotate: card.rotate,
      width: cardWidth,
      height: cardHeight,
    }
  })
}
