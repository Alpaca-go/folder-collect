import cabinetBackgroundUrl from '../../assets/cabinet-background.png'
import CabinetBox from './CabinetBox'
import CabinetHomeHero from './CabinetHomeHero'

interface CabinetHomeProps {
  onOpenFiles: () => void
  onFolderClick?: (index: number, rects: DOMRect[], names: string[]) => void
  cabinetExiting?: boolean
  cabinetRasterHidden?: boolean
  foldersMorphing?: boolean
  drawerFoldersHidden?: boolean
  onCabinetExitComplete?: () => void
  cabinetStageHidden?: boolean
  /** Folder exit morph: keep hero visible above overlay until stack page. */
  folderExitActive?: boolean
}

export default function CabinetHome({
  onOpenFiles,
  onFolderClick,
  cabinetExiting,
  cabinetRasterHidden,
  foldersMorphing,
  drawerFoldersHidden,
  onCabinetExitComplete,
  cabinetStageHidden = false,
  folderExitActive = false,
}: CabinetHomeProps) {
  return (
    <div
      className={`cabinet-home relative h-full min-h-0 w-full flex-1${cabinetExiting || foldersMorphing ? ' cabinet-home--exiting' : ''}${folderExitActive ? ' cabinet-home--folder-exit' : ''}`}
    >
      <div className="app-cabinet-backdrop" aria-hidden>
        <img src={cabinetBackgroundUrl} alt="" draggable={false} />
      </div>

      <CabinetHomeHero />

      <div
        className={`cabinet-home-stage min-h-0${cabinetStageHidden ? ' cabinet-home-stage--hidden' : ''}`}
      >
        <CabinetBox
          onOpenFiles={onOpenFiles}
          onFolderClick={onFolderClick}
          cabinetExiting={cabinetExiting}
          cabinetRasterHidden={cabinetRasterHidden}
          foldersMorphing={foldersMorphing}
          drawerFoldersHidden={drawerFoldersHidden}
          onCabinetExitComplete={onCabinetExitComplete}
        />
      </div>
    </div>
  )
}
