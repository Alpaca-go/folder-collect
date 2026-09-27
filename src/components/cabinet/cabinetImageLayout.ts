/**
 * From `cabinet-v3-con.psd` — document 1380×2271 (3× design grid; 1× = 460×757).
 * Layer bounds from PSD (ag-psd); re-read PSD if exports change.
 */
export const PSD_DOC = { w: 1380, h: 2271 } as const

export const PSD_LAYERS = {
  static: { x: 2, y: 5, w: 1373, h: 1386 },
  interior: { x: 31, y: 868, w: 1315, h: 787 },
  front: { x: -2, y: 1650, w: 1383, h: 622 },
} as const

export type PsdLayerRect = (typeof PSD_LAYERS)[keyof typeof PSD_LAYERS]
