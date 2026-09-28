import { FolderPanelBack, FolderPanelFront } from '../FolderPanelLayers'

interface MorphFolderCloneProps {
  name: string
  index: number
}

export default function MorphFolderClone({ name }: MorphFolderCloneProps) {
  return (
    <div className="drawer-folder-morph-clone-inner">
      <div className="drawer-mini-folder-back">
        <FolderPanelBack />
        <span className="drawer-mini-folder-label morph-folder-label">{name}</span>
      </div>
      <div className="drawer-mini-folder-front">
        <FolderPanelFront />
      </div>
    </div>
  )
}
