import { folderHeightRatio, folderWidthRatio, FOLDER_DESIGN } from '../../config/folderDesign'

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
}: DrawerMiniFolderProps) {
  const labelFontSize = (width / FOLDER_DESIGN.width) * FOLDER_DESIGN.labelFontSize
  const uid = `drawer-folder-${index}`

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
              <stop offset="0%" stopColor="#dedfd6" />
              <stop offset="100%" stopColor="#c8cac1" />
            </linearGradient>
          </defs>
          <path
            d={BACK_PANEL_PATH}
            fill={`url(#drawerBack-${uid})`}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="1"
          />
        </svg>
        <span
          className="drawer-mini-folder-label"
          style={{
            top: folderHeightRatio(FOLDER_DESIGN.labelTop),
            left: folderWidthRatio(FOLDER_DESIGN.labelLeft),
            fontSize: `${labelFontSize}px`,
          }}
        >
          {name}
        </span>
      </div>
      <div className="drawer-mini-folder-front">
        <svg className="block h-full w-full" viewBox="0 0 352 232" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`drawerFront-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d5d7ce" />
              <stop offset="100%" stopColor="#c2c5bc" />
            </linearGradient>
          </defs>
          <path
            d={FRONT_PANEL_PATH}
            fill={`url(#drawerFront-${uid})`}
            stroke="rgba(0,0,0,0.14)"
            strokeWidth="1"
          />
        </svg>
      </div>
    </div>
  )
}
