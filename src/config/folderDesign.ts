export const FOLDER_DESIGN = {
  width: 352,
  height: 232,
  tabHitHeight: 72,
  labelTop: 7,
  labelLeft: 18,
  labelFontSize: 13.5,
  stackOverlap: 160,
  stackBottomTrim: 170,
  innerCardHeight: 108,
  innerCardHiddenY: 14,
  innerCardPeekY: -96,
  innerCardInsetX: 8,
  innerCardRadius: 12,
  innerCardShadowY: 4,
  innerCardShadowBlur: 14,
  innerCardSkeletonPad: 14,
  innerCardSkeletonLinePrimary: 10,
  innerCardSkeletonLineSecondary: 8,
  innerCardSkeletonGap: 8,
  innerCardSkeletonBlockGap: 12,
  spreadCardWidth: 200,
  spreadCardHeight: 132,
  spreadCardHiddenY: 48,
} as const

/** Pocket preview count when folder is not using spread overlay (legacy peek). */
export const INNER_CARDS = [
  { rotate: -12, x: -14, delay: 0.32 },
  { rotate: -1, x: 0, delay: 0.48 },
  { rotate: 11, x: 16, delay: 0.64 },
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
} as const

export const designPx = (value: number, scale: number) => value * scale

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
