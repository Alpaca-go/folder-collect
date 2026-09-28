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

const BACK_PANEL_SHADOW = 'drop-shadow(0 4px 3px rgba(0, 0, 0, 0.08))'
const FRONT_STACK_SHADOW =
  'drop-shadow(0 -2px 2px rgba(0, 0, 0, 0.03)) drop-shadow(0 8px 8px rgba(0, 0, 0, 0.12))'

interface FolderPanelBackProps {
  flapOpen?: boolean
  panelShadow?: boolean
}

export function FolderPanelBack({ flapOpen = false, panelShadow = false }: FolderPanelBackProps) {
  return (
    <div className="folder-panel-stage">
      <img
        src={folderPanelBackUrl}
        alt=""
        draggable={false}
        className="folder-panel-layer"
        style={{
          ...layerCssVars(FOLDER_PSD_LAYERS.back),
          filter: panelShadow ? BACK_PANEL_SHADOW : undefined,
          clipPath: flapOpen ? `inset(0 0 ${FOLDER_BACK_FLAP_OPEN_BOTTOM_INSET} 0)` : undefined,
        }}
      />
    </div>
  )
}

interface FolderPanelFrontProps {
  stackShadow?: boolean
}

export function FolderPanelFront({ stackShadow = false }: FolderPanelFrontProps) {
  return (
    <div className="folder-panel-stage">
      <img
        src={folderPanelFrontUrl}
        alt=""
        draggable={false}
        className="folder-panel-layer"
        style={{
          ...layerCssVars(FOLDER_PSD_LAYERS.front),
          filter: stackShadow ? FRONT_STACK_SHADOW : undefined,
        }}
      />
    </div>
  )
}
