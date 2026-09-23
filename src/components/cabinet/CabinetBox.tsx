import CabinetDiagram from './CabinetDiagram'

interface CabinetBoxProps {
  onOpenFiles?: () => void
  onFolderClick?: (index: number, rects: DOMRect[], names: string[]) => void
  cabinetExiting?: boolean
  foldersMorphing?: boolean
  drawerFoldersHidden?: boolean
  onCabinetExitComplete?: () => void
}

export default function CabinetBox({
  onOpenFiles,
  onFolderClick,
  cabinetExiting,
  foldersMorphing,
  drawerFoldersHidden,
  onCabinetExitComplete,
}: CabinetBoxProps) {
  return (
    <div className="cabinet-scene" data-purpose="cabinet-scene">
      <CabinetDiagram
        onOpenFiles={onOpenFiles}
        onFolderClick={onFolderClick}
        cabinetExiting={cabinetExiting}
        foldersMorphing={foldersMorphing}
        drawerFoldersHidden={drawerFoldersHidden}
        onCabinetExitComplete={onCabinetExitComplete}
      />
    </div>
  )
}
