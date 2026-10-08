/**
 * From `cabinet-shadow-con.psd` — document 2365×4202.
 * Bounds read via ag-psd; re-read PSD if exports change.
 *
 * Placed in `cabinet-v3-con.psd` space (1380×2271) using reference alignment:
 * shadow `01_CABINET_STATIC` @ (496, 882) ↔ cabinet static @ (2, 5).
 * Drawer front shadow is offset from shadow `03_DRAWER_FRONT` @ (492, 1704) onto
 * exported `cabinetImageLayout` front @ (-2, 1650) — comp Y differs by 46px in PSD.
 * Cabinet raster layers in `cabinetImageLayout.ts` are unchanged.
 */
import { PSD_LAYERS } from './cabinetImageLayout'

export const SHADOW_PSD_DOC = { w: 2365, h: 4202 } as const

/** shadow PSD origin minus cabinet-v3-con origin (from static layer pair). */
const SHADOW_TO_CABINET_OFFSET = { x: 494, y: 877 } as const

/** Reference drawer front in shadow PSD (not identical to cabinet-v3 `front` export Y). */
const SHADOW_REF_DRAWER_FRONT = { x: 492, y: 1704 } as const

export const SHADOW_PSD_LAYERS = {
  background: { x: 0, y: 0, w: 2365, h: 4202 },
  /** `cabinet-shadow-con.psd` — door closed */
  cabinetStaticShadow: { x: 1677, y: 1300, w: 538, h: 1041 },
  /** `cabinet-shadow-v2-con.psd` → `01R_CABINET_STATIC_SHADOW_2` — door open */
  cabinetStaticShadow2: { x: 1677, y: 1295, w: 499, h: 1873 },
  drawerFrontShadow: { x: 583, y: 2279, w: 1199, h: 750 },
} as const

export type ShadowPsdLayerRect = (typeof SHADOW_PSD_LAYERS)[keyof typeof SHADOW_PSD_LAYERS]

function toCabinetDocSpace(rect: ShadowPsdLayerRect) {
  return {
    x: rect.x - SHADOW_TO_CABINET_OFFSET.x,
    y: rect.y - SHADOW_TO_CABINET_OFFSET.y,
    w: rect.w,
    h: rect.h,
  }
}

function drawerFrontShadowInCabinetDoc() {
  const shadow = SHADOW_PSD_LAYERS.drawerFrontShadow
  const front = PSD_LAYERS.front
  return {
    x: front.x + (shadow.x - SHADOW_REF_DRAWER_FRONT.x),
    y: front.y + (shadow.y - SHADOW_REF_DRAWER_FRONT.y),
    w: shadow.w,
    h: shadow.h,
  }
}

export const CABINET_SHADOW_LAYERS = {
  background: toCabinetDocSpace(SHADOW_PSD_LAYERS.background),
  cabinetStaticShadow: toCabinetDocSpace(SHADOW_PSD_LAYERS.cabinetStaticShadow),
  cabinetStaticShadow2: toCabinetDocSpace(SHADOW_PSD_LAYERS.cabinetStaticShadow2),
  drawerFrontShadow: drawerFrontShadowInCabinetDoc(),
} as const

export type CabinetShadowLayerRect = (typeof CABINET_SHADOW_LAYERS)[keyof typeof CABINET_SHADOW_LAYERS]
