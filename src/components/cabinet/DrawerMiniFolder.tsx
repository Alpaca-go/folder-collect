import {
  folderFontSize,
  folderHeightRatio,
  folderStackLabelInset,
  FOLDER_DESIGN,
} from '../../config/folderDesign'
import { stackLayerHorizontallyFlipped } from '../../utils/folderMorph'
import { FolderPanelBack, FolderPanelFront } from '../FolderPanelLayers'

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
  /** Morph overlay: skip drop-shadow filters and use container-sized labels. */
  morphOverlay?: boolean
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
}: DrawerMiniFolderProps) {
  const labelFontSizePx = Math.round((width / FOLDER_DESIGN.width) * FOLDER_DESIGN.labelFontSize)
  const useStackShadow = !isLast && !morphOverlay
  const usePanelShadow = !morphOverlay
  const stackFlipped = stackLayerHorizontallyFlipped(index)
  const scaleX = stackFlipped ? -scale : scale
  const labelInset = folderStackLabelInset(stackFlipped)

  return (
    <div
      className="drawer-mini-folder"
      style={{
        width: '100%',
        height: '100%',
        transform: `translateY(${liftY}%) perspective(${perspective}px) rotateX(${rotateX}deg) scale(${scaleX}, ${scale})`,
        transformOrigin: `50% ${transformOriginY}%`,
      }}
    >
      <div className="drawer-mini-folder-back">
        <FolderPanelBack panelShadow={usePanelShadow} />
      </div>
      <div className="drawer-mini-folder-front">
        <FolderPanelFront stackShadow={useStackShadow} />
      </div>
      <span
        className="drawer-mini-folder-label"
        style={{
          top: folderHeightRatio(FOLDER_DESIGN.labelTop),
          left: labelInset.left,
          right: labelInset.right,
          transform: labelInset.transform,
          transformOrigin: labelInset.transformOrigin,
          fontSize: morphOverlay
            ? folderFontSize(FOLDER_DESIGN.labelFontSize)
            : `${labelFontSizePx}px`,
        }}
      >
        {name}
      </span>
    </div>
  )
}
