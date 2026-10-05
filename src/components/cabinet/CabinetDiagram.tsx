import Cabinet2DDiagram from './Cabinet2DDiagram'

interface CabinetDiagramProps {
  onOpenFiles?: () => void
  onFolderClick?: (index: number, rects: DOMRect[], names: string[]) => void
  cabinetExiting?: boolean
  cabinetRasterHidden?: boolean
  foldersMorphing?: boolean
  drawerFoldersHidden?: boolean
  onCabinetExitComplete?: () => void
}

export default function CabinetDiagram({
  onOpenFiles,
  onFolderClick,
  cabinetExiting,
  cabinetRasterHidden,
  foldersMorphing,
  drawerFoldersHidden,
  onCabinetExitComplete,
}: CabinetDiagramProps) {
  return (
    <Cabinet2DDiagram
      onOpenFiles={onOpenFiles}
      onFolderClick={onFolderClick}
      cabinetExiting={cabinetExiting}
      cabinetRasterHidden={cabinetRasterHidden}
      foldersMorphing={foldersMorphing}
      drawerFoldersHidden={drawerFoldersHidden}
      onCabinetExitComplete={onCabinetExitComplete}
    />
  )
}
