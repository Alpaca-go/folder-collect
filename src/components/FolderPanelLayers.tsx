import type { CSSProperties } from 'react'
import folderPanelBackUrl from '../assets/folder-panel-back.png'
import folderPanelFrontUrl from '../assets/folder-panel-front.png'
import {
  FOLDER_BACK_FLAP_OPEN_BOTTOM_INSET,
  FOLDER_PSD_DOC,
  FOLDER_PSD_LAYERS,
  type FolderPsdLayerRect,
} from '../config/folderImageLayout'

function layerCssVars(rect: FolderPsdLayerRect): CSSProperties {
  return {
    '--layer-x': String(rect.x),
    '--layer-y': String(rect.y),
    '--layer-w': String(rect.w),
    '--layer-h': String(rect.h),
    '--psd-doc-w': String(FOLDER_PSD_DOC.w),
    '--psd-doc-h': String(FOLDER_PSD_DOC.h),
  } as CSSProperties
}

const BACK_PANEL_SHADOW = 'drop-shadow(0 4px 4px rgba(0, 0, 0, 0.11))'
const BACK_PANEL_SHADOW_SOFT = 'drop-shadow(0 3px 4px rgba(0, 0, 0, 0.09))'
const FRONT_STACK_SHADOW =
  'drop-shadow(0 -2px 2px rgba(0, 0, 0, 0.045)) drop-shadow(0 8px 9px rgba(0, 0, 0, 0.16))'
/** Single filter — morph overlay; close to stack look without double drop-shadow cost. */
const FRONT_STACK_SHADOW_SOFT = 'drop-shadow(0 5px 8px rgba(0, 0, 0, 0.12))'

export type FolderPanelShadow = 'off' | 'default' | 'soft'

function backPanelFilter(shadow: FolderPanelShadow) {
  if (shadow === 'default') return BACK_PANEL_SHADOW
  if (shadow === 'soft') return BACK_PANEL_SHADOW_SOFT
  return undefined
}

function frontStackFilter(shadow: FolderPanelShadow) {
  if (shadow === 'default') return FRONT_STACK_SHADOW
  if (shadow === 'soft') return FRONT_STACK_SHADOW_SOFT
  return undefined
}

interface FolderPanelBackProps {
  flapOpen?: boolean
  panelShadow?: FolderPanelShadow
}

export function FolderPanelBack({ flapOpen = false, panelShadow = 'off' }: FolderPanelBackProps) {
  return (
    <div className="folder-panel-stage">
      <img
        src={folderPanelBackUrl}
        alt=""
        draggable={false}
        className="folder-panel-layer"
        style={{
          ...layerCssVars(FOLDER_PSD_LAYERS.back),
          filter: backPanelFilter(panelShadow),
          clipPath: flapOpen ? `inset(0 0 ${FOLDER_BACK_FLAP_OPEN_BOTTOM_INSET} 0)` : undefined,
        }}
      />
    </div>
  )
}

interface FolderPanelFrontProps {
  stackShadow?: FolderPanelShadow
}

export function FolderPanelFront({ stackShadow = 'off' }: FolderPanelFrontProps) {
  return (
    <div className="folder-panel-stage">
      <img
        src={folderPanelFrontUrl}
        alt=""
        draggable={false}
        className="folder-panel-layer"
        style={{
          ...layerCssVars(FOLDER_PSD_LAYERS.front),
          filter: frontStackFilter(stackShadow),
        }}
      />
    </div>
  )
}
