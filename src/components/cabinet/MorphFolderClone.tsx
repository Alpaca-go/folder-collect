const BACK_PANEL_PATH =
  'M16,231.5A15.51,15.51,0,0,1,.5,216V16A15.51,15.51,0,0,1,16,.5H154.79a15.39,15.39,0,0,1,11,4.54L187,26.25a14.4,14.4,0,0,0,10.25,4.25H336A15.51,15.51,0,0,1,351.5,46V216A15.51,15.51,0,0,1,336,231.5Z'

const FRONT_PANEL_PATH =
  'M16,231.5A15.51,15.51,0,0,1,.5,216V76A15.51,15.51,0,0,1,16,60.5H154.79A14.4,14.4,0,0,0,165,56.25L186.25,35a15.39,15.39,0,0,1,11-4.54H336A15.51,15.51,0,0,1,351.5,46V216A15.51,15.51,0,0,1,336,231.5Z'

interface MorphFolderCloneProps {
  name: string
  index: number
}

export default function MorphFolderClone({ name, index }: MorphFolderCloneProps) {
  const uid = `morph-folder-${index}`

  return (
    <div className="drawer-folder-morph-clone-inner">
      <div className="drawer-mini-folder-back">
        <svg className="block h-full w-full" viewBox="0 0 352 232" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`morphBack-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#dedfd6" />
              <stop offset="100%" stopColor="#c8cac1" />
            </linearGradient>
          </defs>
          <path
            d={BACK_PANEL_PATH}
            fill={`url(#morphBack-${uid})`}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="1"
          />
        </svg>
        <span className="drawer-mini-folder-label morph-folder-label">{name}</span>
      </div>
      <div className="drawer-mini-folder-front">
        <svg className="block h-full w-full" viewBox="0 0 352 232" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`morphFront-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d5d7ce" />
              <stop offset="100%" stopColor="#c2c5bc" />
            </linearGradient>
          </defs>
          <path
            d={FRONT_PANEL_PATH}
            fill={`url(#morphFront-${uid})`}
            stroke="rgba(0,0,0,0.14)"
            strokeWidth="1"
          />
        </svg>
      </div>
    </div>
  )
}
