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
  innerCardWidthOfFolder: 0.52,
  innerCardHeightPerWidth: 1.5,
  /** Visible strip above pocket floor when folder is open (design px @ folder width). */
  innerCardPeekVisibleHeight: 200,
  /** Bottom-right fan pivot: offset right from folder center (design px @ folder width). */
  innerCardPocketAnchorX: 115,
  /** Nudge pocket fan down from floor line (design px @ folder width; positive = lower). */
  innerCardPocketAnchorY: 295,
  /** Portrait card laid horizontal in pocket (deg); fan offsets in INNER_CARDS.rotate are added. */
  innerCardPocketBaseRotate: -90,
  /** Extra tuck (deg) on top of base before fan-in. */
  innerCardIntroRotateTuck: -34,
  innerCardInsetX: 8,
  innerCardRadius: 0,
  innerCardShadowY: 4,
  innerCardShadowBlur: 14,
  innerCardSkeletonPad: 14,
  innerCardSkeletonLinePrimary: 10,
  innerCardSkeletonLineSecondary: 8,
  innerCardSkeletonGap: 8,
  innerCardSkeletonBlockGap: 12,
  spreadCardHiddenY: 48,
  /** Extra slide into pocket on folder close (design px @ folder width). */
  innerCardCloseBuryExtra: 36,
} as const

/**
 * Fan offsets once horizontal (design px @ folder width).
 * Pivot: visual bottom-right at rest → element `transformOrigin: 0% 100%` (bottom-left).
 */
/** Shared BL pivot — fan only via `rotate` (deg above horizontal base). */
export const INNER_CARDS = [
  { rotate: 0, x: 0, y: 0, delay: 0.32 },
  { rotate: 5, x: 14, y: 0, delay: 0.48 },
  { rotate: 10, x: 28, y: 0, delay: 0.64 },
] as const

/** Pocket cards rotate in one-by-one (seconds). */
export const INNER_CARD_INTRO = {
  rotateDelayBase: 0.1,
  rotateStaggerSec: 0.07,
  rotateDurationSec: 0.58,
  /** Punchy ease-out with a shorter tail so the whole move finishes quicker (open). */
  rotateEaseOpen: [0.1, 0.96, 0.48, 1] as const,
  rotateEaseClose: [0.42, 0, 0.16, 1] as const,
  rotateCloseDurationSec: 1.02,
  rotateCloseStaggerSec: 0.07,
  /** Fade / bury tail after the slowest card starts tucking. */
  rotateCloseTailSec: 0.32,
} as const

/** When the slowest pocket tuck (rotate / bury) finishes — flap may close immediately after. */
export function innerCardPocketTuckDoneMs(
  cardCount: number = INNER_POCKET_CARD_COUNT,
): number {
  const { rotateCloseDurationSec, rotateCloseStaggerSec } = INNER_CARD_INTRO
  const lastStartSec = Math.max(0, cardCount - 1) * rotateCloseStaggerSec
  return (lastStartSec + rotateCloseDurationSec) * 1000
}

/** Full pocket-out including opacity tail (not used to delay the flap). */
export function innerCardPocketCloseSpanMs(
  cardCount: number = INNER_POCKET_CARD_COUNT,
): number {
  const tuckMs = innerCardPocketTuckDoneMs(cardCount)
  return tuckMs + INNER_CARD_INTRO.rotateCloseTailSec * 1000
}

/** Front flap tween (0.46s) + small settle before stack return. */
export const FLAP_CLOSE_SETTLE_MS = 480

/** Start closing the flap before the slowest tuck fully ends (overlap ms). */
export const INNER_CARD_FLAP_CLOSE_LEAD_MS = 720

export function innerCardPocketFlapStartMs(
  cardCount: number = INNER_POCKET_CARD_COUNT,
): number {
  return Math.max(0, innerCardPocketTuckDoneMs(cardCount) - INNER_CARD_FLAP_CLOSE_LEAD_MS)
}

export const INNER_POCKET_CARD_COUNT = 3

/** Extra stack revealed behind the pocket trio on dock. */
export const INNER_SPREAD_EXTRA_CARD_COUNT = 0

/** Pocket + extra cards animated into the spread fan. */
export const INNER_CARD_SPREAD_COUNT = INNER_POCKET_CARD_COUNT + INNER_SPREAD_EXTRA_CARD_COUNT

export const INNER_CARD_SPREAD = {
  rotateMin: -6,
  rotateMax: 6,
  offsetX: 12,
  offsetY: 10,
  delayBase: 0.22,
  delayStep: 0.05,
  delayJitter: 0.05,
  gatherDelayBase: 0,
  gatherDelayStep: 0.03,
  /** Front card in the fan (higher index) stays closer to stage center. */
  gatherCenterPullPerStep: 0.18,
  /** Symmetric horizontal cap (left/right of center). */
  gatherLeftReachRatio: 0.5,
  /** Rear stack card (index 0): tiny center bias. Design px @ card face scale. */
  stackRearNudgeX: 4,
  stackRearNudgeY: -4,
} as const

/** Spread promote: dock settle → pocket cards gather. */
export const SPREAD_PROMOTE = {
  /** Wait for folder dock dive before pocket cards gather/rotate to spread. */
  folderDockSettleMs: 760,
  extraInDurationMs: 420,
  /** Per-card delay step while extra-in (matches FolderSpreadCards). */
  extraInStaggerMs: 80,
  /** Extra cards intro: start tighter, spring out to spread layout (0–1). */
  extraInClusterPull: 0.2,
  gatherDurationMs: 720,
  /** Spread retract + folder undock before stack close (matches gather). */
  undockDurationMs: 720,
} as const

export const designPx = (value: number, scale: number) => value * scale

export function innerCardSize(scale: number) {
  const width = designPx(FOLDER_DESIGN.width * FOLDER_DESIGN.innerCardWidthOfFolder, scale)
  const height = width * FOLDER_DESIGN.innerCardHeightPerWidth
  return { width, height }
}

export function innerCardPocketRestRotate(fanDeg: number) {
  return FOLDER_DESIGN.innerCardPocketBaseRotate + fanDeg
}

export function innerCardPocketIntroRotate() {
  return FOLDER_DESIGN.innerCardPocketBaseRotate + FOLDER_DESIGN.innerCardIntroRotateTuck
}

/** Skeleton / radius scale for a rendered card width (matches pocket `offsetWidth`). */
export function innerCardFaceScaleFromWidth(cardWidthPx: number) {
  return cardWidthPx / (FOLDER_DESIGN.width * FOLDER_DESIGN.innerCardWidthOfFolder)
}

/** Corner offsets (px) from bottom-left pivot (`transformOrigin: 0% 100%`). */
export function innerCardRotateBoundsBottomLeft(
  cardWidth: number,
  cardHeight: number,
  rotateDeg: number,
) {
  const rad = (rotateDeg * Math.PI) / 180
  const sin = Math.sin(rad)
  const cos = Math.cos(rad)
  const corners: [number, number][] = [
    [cardWidth, 0],
    [0, -cardHeight],
    [cardWidth, -cardHeight],
  ]
  let minY = 0
  let maxY = 0
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
  const { minY } = innerCardRotateBoundsBottomLeft(cardWidth, cardHeight, rotateDeg)
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
  const { maxY } = innerCardRotateBoundsBottomLeft(cardWidth, cardHeight, rotateDeg)
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
