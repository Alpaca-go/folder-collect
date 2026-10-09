import type { Ref } from 'react'
import { FOLDER_DESIGN } from '../../config/folderDesign'
import { stackLayerHorizontallyFlipped } from '../../utils/folderMorph'
import FolderStackLabel from '../FolderStackLabel'
import { FolderPanelBack, FolderPanelFront, type FolderPanelShadow } from '../FolderPanelLayers'

interface DrawerMiniFolderProps {
  name: string
  index: number
  width: number
  rotateX: number
  scale?: number
  perspective?: number
  transformOriginY?: number
  liftY?: number
  isLast?: boolean
  /** Morph overlay: lighter single-filter shadows and container-sized labels. */
  morphOverlay?: boolean
  /** Morph overlay: 3D transform is driven on the root via rAF (not React state). */
  folderRootRef?: Ref<HTMLDivElement>
}

export default function DrawerMiniFolder({
  name,
  index,
  width,
  rotateX,
  scale = 1,
  perspective = 500,
  transformOriginY = 100,
  liftY = -10,
  isLast = false,
  morphOverlay = false,
  folderRootRef,
}: DrawerMiniFolderProps) {
  const labelFontSizePx = Math.round((width / FOLDER_DESIGN.width) * FOLDER_DESIGN.labelFontSize)
  const panelShadow: FolderPanelShadow = morphOverlay ? 'soft' : 'default'
  const stackShadow: FolderPanelShadow = morphOverlay
    ? isLast
      ? 'off'
      : 'soft'
    : !isLast
      ? 'default'
      : 'off'
  const stackFlipped = stackLayerHorizontallyFlipped(index)
  const scaleX = stackFlipped ? -scale : scale

  const labelFontSize = morphOverlay ? undefined : `${labelFontSizePx}px`

  return (
    <div
      ref={folderRootRef}
      className="drawer-mini-folder"
      style={{
        width: '100%',
        height: '100%',
        transform: `translateY(${liftY}%) perspective(${perspective}px) rotateX(${rotateX}deg) scale(${scaleX}, ${scale})`,
        transformOrigin: `50% ${transformOriginY}%`,
      }}
    >
      <div className="drawer-mini-folder-back">
        <FolderPanelBack panelShadow={panelShadow} />
      </div>
      <div className="drawer-mini-folder-front">
        <FolderPanelFront stackShadow={stackShadow} />
      </div>
      <div className="drawer-mini-folder-label-layer">
        <FolderStackLabel name={name} flipped={stackFlipped} fontSize={labelFontSize} />
      </div>
    </div>
  )
}
