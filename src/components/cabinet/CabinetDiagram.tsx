import Cabinet2DDiagram from './Cabinet2DDiagram'

interface CabinetDiagramProps {
  onOpenFiles?: () => void
  onFolderClick?: (index: number, rects: DOMRect[], names: string[]) => void
  cabinetExiting?: boolean
  foldersMorphing?: boolean
  drawerFoldersHidden?: boolean
  onCabinetExitComplete?: () => void
}

export default function CabinetDiagram({
  onOpenFiles,
  onFolderClick,
  cabinetExiting,
  foldersMorphing,
  drawerFoldersHidden,
  onCabinetExitComplete,
}: CabinetDiagramProps) {
  return (
    <Cabinet2DDiagram
      onOpenFiles={onOpenFiles}
      onFolderClick={onFolderClick}
      cabinetExiting={cabinetExiting}
      foldersMorphing={foldersMorphing}
      drawerFoldersHidden={drawerFoldersHidden}
      onCabinetExitComplete={onCabinetExitComplete}
    />
  )
}
