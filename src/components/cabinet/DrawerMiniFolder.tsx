import {
  folderFontSize,
  folderHeightRatio,
  folderWidthRatio,
  FOLDER_DESIGN,
} from '../../config/folderDesign'

const BACK_PANEL_PATH =
  'M16,231.5A15.51,15.51,0,0,1,.5,216V16A15.51,15.51,0,0,1,16,.5H154.79a15.39,15.39,0,0,1,11,4.54L187,26.25a14.4,14.4,0,0,0,10.25,4.25H336A15.51,15.51,0,0,1,351.5,46V216A15.51,15.51,0,0,1,336,231.5Z'

const FRONT_PANEL_PATH =
  'M16,231.5A15.51,15.51,0,0,1,.5,216V76A15.51,15.51,0,0,1,16,60.5H154.79A14.4,14.4,0,0,0,165,56.25L186.25,35a15.39,15.39,0,0,1,11-4.54H336A15.51,15.51,0,0,1,351.5,46V216A15.51,15.51,0,0,1,336,231.5Z'

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
  /** Morph overlay: skip SVG drop-shadow filters and use container-sized labels. */
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
  const uid = `drawer-folder-${index}`
  const useStackShadow = !isLast && !morphOverlay
  const usePanelShadow = !morphOverlay

  return (
    <div
      className="drawer-mini-folder"
      style={{
        width: '100%',
        height: '100%',
        transform: `translateY(${liftY}%) perspective(${perspective}px) rotateX(${rotateX}deg) scale(${scale})`,
        transformOrigin: `50% ${transformOriginY}%`,
      }}
    >
      <div className="drawer-mini-folder-back">
        <svg className="block h-full w-full" viewBox="0 0 352 232" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`drawerBack-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--color-folder-back-top)" />
              <stop offset="100%" stopColor="var(--color-folder-back-bottom)" />
            </linearGradient>
            <filter
              id={`drawerBackShadow-${uid}`}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
              colorInterpolationFilters="sRGB"
            >
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.08" />
            </filter>
          </defs>
          <path
            d={BACK_PANEL_PATH}
            fill={`url(#drawerBack-${uid})`}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="1"
            filter={usePanelShadow ? `url(#drawerBackShadow-${uid})` : undefined}
          />
          <path
            d="M16,1.5 H154.79 a14.39,14.39,0,0,1,10.2,4.2 L186.2,25.3"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1"
            fill="none"
          />
        </svg>
        <span
          className="drawer-mini-folder-label"
          style={{
            top: folderHeightRatio(FOLDER_DESIGN.labelTop),
            left: folderWidthRatio(FOLDER_DESIGN.labelLeft),
            fontSize: morphOverlay
              ? folderFontSize(FOLDER_DESIGN.labelFontSize)
              : `${labelFontSizePx}px`,
          }}
        >
          {name}
        </span>
      </div>
      <div className="drawer-mini-folder-front">
        <svg className="block h-full w-full" viewBox="0 0 352 232" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`drawerFront-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--color-folder-front-top)" />
              <stop offset="100%" stopColor="var(--color-folder-front-bottom)" />
            </linearGradient>
            <filter
              id={`drawerFrontShadow-${uid}`}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
              colorInterpolationFilters="sRGB"
            >
              <feDropShadow dx="0" dy="-2" stdDeviation="2" floodColor="#000000" floodOpacity="0.03" />
              {useStackShadow && (
                <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#000000" floodOpacity="0.12" />
              )}
            </filter>
          </defs>
          <path
            d={FRONT_PANEL_PATH}
            fill={`url(#drawerFront-${uid})`}
            stroke="rgba(0,0,0,0.14)"
            strokeWidth="1"
            filter={useStackShadow ? `url(#drawerFrontShadow-${uid})` : undefined}
          />
          <path
            d="M16,61.5 H154.79 A13.4,13.4,0,0,0,164.2,57.5 L185.5,36.2 a14.39,14.39,0,0,1,10.2-4.2 H336"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      </div>
    </div>
  )
}
