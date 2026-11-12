export const FOLDER_DESIGN = {
  width: 352,
  height: 232,
  tabHitHeight: 72,
  labelTop: 7,
  labelLeft: 18,
  labelFontSize: 13.5,
  stackOverlap: 160,
  stackBottomTrim: 170,
  /** Card width = folder width × ratio; height = width × heightPerWidth (2:3 portrait). */
  innerCardWidthOfFolder: 0.5,
  innerCardHeightPerWidth: 1.5,
  /** Visible strip above pocket floor when folder is open (design px @ folder width). */
  innerCardPeekVisibleHeight: 200,
  /** Bottom-right fan pivot: offset right from folder center (design px @ folder width). */
  innerCardPocketAnchorX: 104,
  /** Nudge pocket fan down from floor line (design px @ folder width; positive = lower). */
  innerCardPocketAnchorY: 28,
  /** Open: tucked angle (deg) before fanning about bottom-right. */
  innerCardIntroRotateFrom: -34,
  innerCardInsetX: 8,
  innerCardRadius: 12,
  innerCardShadowY: 4,
  innerCardShadowBlur: 14,
  innerCardSkeletonPad: 14,
  innerCardSkeletonLinePrimary: 10,
  innerCardSkeletonLineSecondary: 8,
  innerCardSkeletonGap: 8,
  innerCardSkeletonBlockGap: 12,
  spreadCardHiddenY: 48,
} as const

/**
 * Landscape fan from each card's bottom-right pivot (`transformOrigin: 100% 100%`).
 * Back = least tilt; front = most CCW. Optional x/y nudge (design px @ folder width).
 */
export const INNER_CARDS = [
  { rotate: 5, x: 0, y: 0, delay: 0.32 },
  { rotate: 10, x: 18, y: -2, delay: 0.48 },
  { rotate: 15, x: 36, y: -6, delay: 0.64 },
] as const

/** Pocket cards rotate in one-by-one (seconds). */
export const INNER_CARD_INTRO = {
  rotateDelayBase: 0.14,
  rotateStaggerSec: 0.1,
  /** Total rotate-in span — longer = more visible “fast then creep” tail. */
  rotateDurationSec: 1.05,
  /** Cubic-bezier — sharp launch, long slow settle (open). */
  rotateEaseOpen: [0.02, 0.98, 0.07, 1] as const,
  rotateEaseClose: [0.42, 0, 0.16, 1] as const,
} as const

/** Active-folder spread stack — adjust count here later. */
export const INNER_CARD_SPREAD_COUNT = 8

export const INNER_CARD_SPREAD = {
  rotateMin: -16,
  rotateMax: 16,
  offsetX: 42,
  offsetY: 36,
  delayBase: 0.22,
  delayStep: 0.05,
  delayJitter: 0.05,
  gatherDelayBase: 0.06,
  gatherDelayStep: 0.045,
} as const

export const INNER_POCKET_CARD_COUNT = 3

/** Spread promote: dive → hold → 5 cards fade in → 8-card gather. */
export const SPREAD_PROMOTE = {
  /** After dock: pinned trio stays still before extra cards appear. */
  folderDockSettleMs: 560,
  extraInDurationMs: 420,
  /** Per-card delay step while extra-in (matches FolderSpreadCards). */
  extraInStaggerMs: 80,
  /** Extra cards intro: start tighter, spring out to spread layout (0–1). */
  extraInClusterPull: 0.2,
  gatherDurationMs: 720,
} as const

export const designPx = (value: number, scale: number) => value * scale

export function innerCardSize(scale: number) {
  const width = designPx(FOLDER_DESIGN.width * FOLDER_DESIGN.innerCardWidthOfFolder, scale)
  const height = width * FOLDER_DESIGN.innerCardHeightPerWidth
  return { width, height }
}

/** Pocket trio: portrait asset laid horizontal (swap w/h, no spin-in). */
export function innerCardSizeLandscape(scale: number) {
  const { width, height } = innerCardSize(scale)
  return { width: height, height: width }
}

/** Skeleton / radius scale for a rendered card width (matches pocket `offsetWidth`). */
export function innerCardFaceScaleFromWidth(cardWidthPx: number) {
  return cardWidthPx / (FOLDER_DESIGN.width * FOLDER_DESIGN.innerCardWidthOfFolder)
}

/** Corner offsets (px) for a card with transform-origin bottom-center (50% 100%). */
export function innerCardRotateBounds(
  cardWidth: number,
  cardHeight: number,
  rotateDeg: number,
) {
  const rad = (rotateDeg * Math.PI) / 180
  const sin = Math.sin(rad)
  const cos = Math.cos(rad)
  const corners: [number, number][] = [
    [-cardWidth / 2, 0],
    [cardWidth / 2, 0],
    [-cardWidth / 2, -cardHeight],
    [cardWidth / 2, -cardHeight],
  ]
  let minY = Infinity
  let maxY = -Infinity
  for (const [x, y] of corners) {
    const yp = -x * sin + y * cos
    minY = Math.min(minY, yp)
    maxY = Math.max(maxY, yp)
  }
  return { minY, maxY }
}

/**
 * Pocket cards use `bottom` on the floor line; positive `y` moves down.
 * Peek: only `innerCardPeekVisibleHeight` remains above the floor line.
 */
export function innerCardPeekY(cardHeight: number, scale: number) {
  const peekVisible = designPx(FOLDER_DESIGN.innerCardPeekVisibleHeight, scale)
  return Math.max(0, cardHeight - peekVisible)
}

export function innerCardPeekYForPose(
  cardWidth: number,
  cardHeight: number,
  rotateDeg: number,
  scale: number,
) {
  if (rotateDeg === 0) return innerCardPeekY(cardHeight, scale)
  const peekVisible = designPx(FOLDER_DESIGN.innerCardPeekVisibleHeight, scale)
  const rad = (rotateDeg * Math.PI) / 180
  const sideways = Math.abs(Math.cos(rad)) < 0.35
  const { minY } = innerCardRotateBounds(cardWidth, cardHeight, rotateDeg)
  const extentAbove = -minY
  let peekY = extentAbove - peekVisible
  if (sideways) {
    peekY -= cardHeight * 0.45
  }
  return peekY
}

export function innerCardHiddenY(cardHeight: number, scale: number) {
  return innerCardPeekY(cardHeight, scale) + designPx(48, scale)
}

export function innerCardHiddenYForPose(
  cardWidth: number,
  cardHeight: number,
  rotateDeg: number,
  scale: number,
) {
  const { maxY } = innerCardRotateBounds(cardWidth, cardHeight, rotateDeg)
  return innerCardPeekYForPose(cardWidth, cardHeight, rotateDeg, scale) + maxY + designPx(48, scale)
}

export const folderWidthRatio = (value: number) => `${(value / FOLDER_DESIGN.width) * 100}%`

export const folderHeightRatio = (value: number) => `${(value / FOLDER_DESIGN.height) * 100}%`

export const folderFontSize = (value: number) => `calc(100cqw * ${value / FOLDER_DESIGN.width})`

/**
 * Label inset when the folder card uses `scaleX(-1)` on the root.
 * Anchor the label on the mirrored tab (local `left` ≈ visual right) and grow text inward.
 */
export function folderStackLabelInset(flipped: boolean) {
  const inset = folderWidthRatio(FOLDER_DESIGN.labelLeft)
  if (!flipped) {
    return { left: inset, right: undefined, transform: undefined, transformOrigin: undefined }
  }
  return {
    left: inset,
    right: undefined,
    transform: 'translateX(-100%) scaleX(-1)',
    transformOrigin: '100% 0%',
  }
}
