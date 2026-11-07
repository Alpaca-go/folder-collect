/**
 * From `profile-deck-con.psd` — document 1163×1525.
 * Layer bounds from PSD (ag-psd); re-read PSD if exports change.
 */
export const PROFILE_DECK_PSD_DOC = { w: 1163, h: 1525 } as const

const PROFILE_DECK_FOLDER_BOTTOM = { x: 0, y: 89, w: 1114, h: 1416 } as const
const PROFILE_DECK_FOLDER_FACE_SIZE = { w: 1014, h: 1413 } as const

export const PROFILE_DECK_LAYERS = {
  folderBottom: PROFILE_DECK_FOLDER_BOTTOM,
  innerCard02: { x: 171, y: 107, w: 992, h: 1381 },
  innerCard01: { x: 154, y: 34, w: 983, h: 1420 },
  /** Right + bottom aligned to `folder-bottom` (PSD stack). */
  folderFace: {
    x:
      PROFILE_DECK_FOLDER_BOTTOM.x +
      PROFILE_DECK_FOLDER_BOTTOM.w -
      PROFILE_DECK_FOLDER_FACE_SIZE.w,
    y:
      PROFILE_DECK_FOLDER_BOTTOM.y +
      PROFILE_DECK_FOLDER_BOTTOM.h -
      PROFILE_DECK_FOLDER_FACE_SIZE.h,
    w: PROFILE_DECK_FOLDER_FACE_SIZE.w,
    h: PROFILE_DECK_FOLDER_FACE_SIZE.h,
  },
} as const

export type ProfileDeckLayerRect =
  (typeof PROFILE_DECK_LAYERS)[keyof typeof PROFILE_DECK_LAYERS]

/** Back → front paint order (matches PSD layer stack). */
export const PROFILE_DECK_LAYER_ORDER = [
  'folderBottom',
  'innerCard02',
  'innerCard01',
  'folderFace',
] as const satisfies readonly (keyof typeof PROFILE_DECK_LAYERS)[]

export const PROFILE_DECK_ASPECT_RATIO =
  `${PROFILE_DECK_PSD_DOC.w} / ${PROFILE_DECK_PSD_DOC.h}` as const

/** Bottom-left of `folder-bottom` — stage rotate pivot (PSD %). */
export const PROFILE_DECK_FOLDER_BOTTOM_ORIGIN = {
  xPct: (PROFILE_DECK_LAYERS.folderBottom.x / PROFILE_DECK_PSD_DOC.w) * 100,
  yPct:
    ((PROFILE_DECK_LAYERS.folderBottom.y + PROFILE_DECK_LAYERS.folderBottom.h) /
      PROFILE_DECK_PSD_DOC.h) *
    100,
} as const
