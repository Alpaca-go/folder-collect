/**
 * From `folder-con.psd` — document 1050×690 (3× design grid; 1× ≈ 350×230).
 * Layer bounds from PSD (ag-psd); re-read PSD if exports change.
 */
export const FOLDER_PSD_DOC = { w: 1050, h: 690 } as const

export const FOLDER_PSD_LAYERS = {
  back: { x: 0, y: 0, w: 1050, h: 690 },
  front: { x: 0, y: 87, w: 1050, h: 603 },
} as const

export type FolderPsdLayerRect = (typeof FOLDER_PSD_LAYERS)[keyof typeof FOLDER_PSD_LAYERS]

/** Matches legacy SVG back trim at y=216 in the 232-tall viewBox when the flap opens. */
export const FOLDER_BACK_FLAP_OPEN_BOTTOM_INSET = `${(16 / 232) * 100}%`

export const FOLDER_ASPECT_RATIO = `${FOLDER_PSD_DOC.w} / ${FOLDER_PSD_DOC.h}` as const
