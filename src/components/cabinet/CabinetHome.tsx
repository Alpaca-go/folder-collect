import CabinetBox from './CabinetBox'

interface CabinetHomeProps {
  onOpenFiles: () => void
  onFolderClick?: (index: number, rects: DOMRect[], names: string[]) => void
  cabinetExiting?: boolean
  foldersMorphing?: boolean
  drawerFoldersHidden?: boolean
  onCabinetExitComplete?: () => void
}

export default function CabinetHome({
  onOpenFiles,
  onFolderClick,
  cabinetExiting,
  foldersMorphing,
  drawerFoldersHidden,
  onCabinetExitComplete,
}: CabinetHomeProps) {
  return (
    <div className="relative flex h-full min-h-0 w-full items-center justify-center bg-appBg">
      <CabinetBox
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
