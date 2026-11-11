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

/** Pocket preview count when folder is not using spread overlay (legacy peek). */
export const INNER_CARDS = [
  { rotate: -12, x: -32, delay: 0.32 },
  { rotate: -1, x: 0, delay: 0.48 },
  { rotate: 11, x: 32, delay: 0.64 },
] as const

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

/** Spread promote: dive → 5 cards fade in → 8-card gather. */
export const SPREAD_PROMOTE = {
  /** Folder dock spring ~ settle before extra cards / gather. */
  folderDockSettleMs: 560,
  extraInDurationMs: 420,
  gatherDurationMs: 720,
} as const

export const designPx = (value: number, scale: number) => value * scale

export function innerCardSize(scale: number) {
  const width = designPx(FOLDER_DESIGN.width * FOLDER_DESIGN.innerCardWidthOfFolder, scale)
  const height = width * FOLDER_DESIGN.innerCardHeightPerWidth
  return { width, height }
}

/**
 * Pocket cards use `bottom` on the floor line; positive `y` moves down.
 * Peek: only `innerCardPeekVisibleHeight` remains above the floor line.
 */
export function innerCardPeekY(cardHeight: number, scale: number) {
  const peekVisible = designPx(FOLDER_DESIGN.innerCardPeekVisibleHeight, scale)
  return Math.max(0, cardHeight - peekVisible)
}

export function innerCardHiddenY(cardHeight: number, scale: number) {
  return innerCardPeekY(cardHeight, scale) + designPx(48, scale)
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
