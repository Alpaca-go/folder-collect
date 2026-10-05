import CabinetDiagram from './CabinetDiagram'

interface CabinetBoxProps {
  onOpenFiles?: () => void
  onFolderClick?: (index: number, rects: DOMRect[], names: string[]) => void
  cabinetExiting?: boolean
  cabinetRasterHidden?: boolean
  foldersMorphing?: boolean
  drawerFoldersHidden?: boolean
  onCabinetExitComplete?: () => void
}

export default function CabinetBox({
  onOpenFiles,
  onFolderClick,
  cabinetExiting,
  cabinetRasterHidden,
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
        cabinetRasterHidden={cabinetRasterHidden}
        foldersMorphing={foldersMorphing}
        drawerFoldersHidden={drawerFoldersHidden}
        onCabinetExitComplete={onCabinetExitComplete}
      />
    </div>
  )
}
