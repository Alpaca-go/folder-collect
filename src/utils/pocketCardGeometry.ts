import {
  designPx,
  FOLDER_DESIGN,
  INNER_CARDS,
  innerCardPeekYForPose,
  innerCardPocketRestRotate,
  innerCardSize,
} from '../config/folderDesign'
import type { SpreadCardLayout } from './innerCardSpread'

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

export function rotationDegFromTransform(transform: string): number {
  if (!transform || transform === 'none') return 0
  const raw = transform.startsWith('matrix3d(')
    ? transform.slice(9, -1).split(',').map((s) => parseFloat(s.trim()))
    : transform.startsWith('matrix(')
      ? transform.slice(7, -1).split(',').map((s) => parseFloat(s.trim()))
      : null
  if (!raw || raw.length < 2) return 0
  const a = raw[0]
  const b = raw.length > 1 ? raw[1] : 0
  return (Math.atan2(b, a) * 180) / Math.PI
}

/** Pinned pocket clones on `document.body` → spread-cluster local coords. */
export function pinnedPocketCardsClusterLocal(
  nodes: HTMLElement[],
  clusterOrigin: { x: number; y: number },
): PocketCardMeasure[] {
  return nodes.map((el) => {
    const rect = el.getBoundingClientRect()
    const transform = getComputedStyle(el).transform
    return {
      x: rect.left + rect.width / 2 - clusterOrigin.x,
      y: rect.top + rect.height / 2 - clusterOrigin.y,
      rotate: rotationDegFromTransform(transform),
      width: rect.width,
      height: rect.height,
    }
  })
}

export function pocketCardsClusterLocal(
  folderEl: HTMLElement,
  clusterOrigin: { x: number; y: number },
): PocketCardMeasure[] {
  const rect = folderEl.getBoundingClientRect()
  const scale = rect.width / FOLDER_DESIGN.width
  const { width: cardWidth, height: cardHeight } = innerCardSize(scale)
  const pocketBottom = rect.top + rect.height * (1 - 16 / FOLDER_DESIGN.height)
  const pocketCenterX = rect.left + rect.width / 2

  return INNER_CARDS.map((card) => {
    const restRotate = innerCardPocketRestRotate(card.rotate)
    const peekY = innerCardPeekYForPose(cardWidth, cardHeight, restRotate, scale)
    const anchorX =
      pocketCenterX + designPx(FOLDER_DESIGN.innerCardPocketAnchorX + card.x, scale)
    const pivotY =
      pocketBottom +
      peekY +
      designPx(FOLDER_DESIGN.innerCardPocketAnchorY + card.y, scale)
    const rad = (restRotate * Math.PI) / 180
    const sin = Math.sin(rad)
    const cos = Math.cos(rad)
    const offsetX = cardWidth / 2
    const offsetY = -cardHeight / 2
    const centerX = anchorX + offsetX * cos - offsetY * sin
    const centerY = pivotY + offsetX * sin + offsetY * cos
    return {
      x: centerX - clusterOrigin.x,
      y: centerY - clusterOrigin.y,
      rotate: restRotate,
      width: cardWidth,
      height: cardHeight,
    }
  })
}

export type ScreenFixedPose = {
  left: number
  top: number
  rotate: number
}

export function spreadLayoutScreenFixed(
  layout: Pick<SpreadCardLayout, 'x' | 'y' | 'rotate'>,
  clusterOrigin: { x: number; y: number },
  cardWidth: number,
  cardHeight: number,
  faceScale: number,
): ScreenFixedPose {
  const cx = clusterOrigin.x + designPx(layout.x, faceScale)
  const cy = clusterOrigin.y + designPx(layout.y, faceScale)
  return {
    left: cx - cardWidth / 2,
    top: cy - cardHeight / 2,
    rotate: layout.rotate,
  }
}

export function pocketScreenFixedPoses(
  folderEl: HTMLElement,
  clusterOrigin: { x: number; y: number },
): ScreenFixedPose[] {
  return pocketCardsClusterLocal(folderEl, clusterOrigin).map((p) => ({
    left: clusterOrigin.x + p.x - p.width / 2,
    top: clusterOrigin.y + p.y - p.height / 2,
    rotate: p.rotate,
  }))
}
