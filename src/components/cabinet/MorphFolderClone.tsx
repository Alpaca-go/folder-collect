import { stackLayerHorizontallyFlipped } from '../../utils/folderMorph'
import FolderStackLabel from '../FolderStackLabel'
import { FolderPanelBack, FolderPanelFront } from '../FolderPanelLayers'

interface MorphFolderCloneProps {
  name: string
  index: number
}

export default function MorphFolderClone({ name, index }: MorphFolderCloneProps) {
  return (
    <div className="drawer-folder-morph-clone-inner">
      <div className="drawer-mini-folder-back">
        <FolderPanelBack />
      </div>
      <div className="drawer-mini-folder-front">
        <FolderPanelFront />
      </div>
      <div className="drawer-mini-folder-label-layer">
        <FolderStackLabel name={name} flipped={stackLayerHorizontallyFlipped(index)} />
      </div>
    </div>
  )
}
