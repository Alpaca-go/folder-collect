import cabinetBackgroundUrl from '../../assets/cabinet-background.png'
import CabinetBox from './CabinetBox'

interface CabinetHomeProps {
  onOpenFiles: () => void
  onFolderClick?: (index: number, rects: DOMRect[], names: string[]) => void
  cabinetExiting?: boolean
  cabinetRasterHidden?: boolean
  foldersMorphing?: boolean
  drawerFoldersHidden?: boolean
  onCabinetExitComplete?: () => void
}

export default function CabinetHome({
  onOpenFiles,
  onFolderClick,
  cabinetExiting,
  cabinetRasterHidden,
  foldersMorphing,
  drawerFoldersHidden,
  onCabinetExitComplete,
}: CabinetHomeProps) {
  return (
    <div
      className={`cabinet-home relative grid h-full min-h-0 w-full flex-1 bg-appBg pb-[var(--app-pad-bottom)] pt-[var(--app-pad-top)]${cabinetExiting || foldersMorphing ? ' cabinet-home--exiting' : ''}`}
    >
      <div className="app-cabinet-backdrop" aria-hidden>
        <img src={cabinetBackgroundUrl} alt="" draggable={false} />
      </div>

      <header className="cabinet-home-hero app-inline-pad" aria-label="Portfolio introduction">
        <h1 className="cabinet-home-name">WANG QI</h1>
        <p className="cabinet-home-role">Visual Designer / Illustrator</p>
        <div className="cabinet-home-divider" aria-hidden="true" />
        <p className="cabinet-home-works">SELECTED WORKS</p>
        <p className="cabinet-home-years">2023 — 2026</p>
      </header>

      <div className="cabinet-home-stage min-h-0">
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

      <footer className="cabinet-home-cta app-inline-pad">
        <p className="cabinet-home-open">OPEN DRAWER</p>
        <span className="cabinet-home-open-arrow">↓</span>
      </footer>
    </div>
  )
}
