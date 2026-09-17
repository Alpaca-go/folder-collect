import { useRef } from 'react'
import { motion } from 'framer-motion'
import FolderInnerCards from './FolderInnerCards'

const FOLDER_ROTATE_X = -40
const FOLDER_PERSPECTIVE = 1200
const TAB_HIT_HEIGHT = 72
const INACTIVE_DIVE_Y = 200

export type FolderMode = 'default' | 'active' | 'inactive' | 'closing' | 'returning'

interface FolderCardProps {
  name: string
  index: number
  isLast?: boolean
  mode: FolderMode
  centerOffsetY?: number
  onActivate: (element: HTMLElement) => void
}

export default function FolderCard({
  name,
  index,
  isLast = false,
  mode,
  centerOffsetY = 0,
  onActivate,
}: FolderCardProps) {
  const uid = `folder-${index}`
  const rootRef = useRef<HTMLDivElement>(null)
  const isCentered = mode === 'active' || mode === 'closing'
  const isFlapOpen = mode === 'active'
  const showInnerCards = mode === 'active' || mode === 'closing'

  const handleTap = () => {
    if (rootRef.current && mode === 'default') onActivate(rootRef.current)
  }

  return (
    <motion.div
      ref={rootRef}
      className="relative w-full shrink-0 aspect-[352/232] select-none"
      data-purpose="contact-card"
      data-index={index}
      animate={{
        y: isCentered ? centerOffsetY : mode === 'inactive' ? INACTIVE_DIVE_Y : 0,
        opacity: mode === 'inactive' ? 0 : 1,
        rotateX: isCentered ? -6 : FOLDER_ROTATE_X,
      }}
      transition={{
        y: {
          type: 'spring',
          stiffness: mode === 'inactive' ? 260 : mode === 'returning' ? 280 : mode === 'active' ? 260 : 320,
          damping: mode === 'inactive' ? 30 : mode === 'returning' ? 32 : mode === 'active' ? 28 : 32,
        },
        rotateX: {
          type: 'spring',
          stiffness: mode === 'returning' ? 280 : mode === 'closing' ? 300 : mode === 'active' ? 260 : 320,
          damping: mode === 'returning' ? 32 : mode === 'closing' ? 30 : mode === 'active' ? 28 : 32,
        },
        opacity: {
          duration: mode === 'inactive' ? 0.48 : mode === 'default' ? 0.42 : 0.35,
          ease: 'easeOut',
        },
      }}
      style={{
        zIndex: isCentered || mode === 'returning' ? 100 : index + 1,
        transformPerspective: FOLDER_PERSPECTIVE,
        transformOrigin: '50% 0%',
        pointerEvents:
          mode === 'inactive' || mode === 'closing' || mode === 'returning' ? 'none' : 'auto',
      }}
    >
      {mode === 'default' && (
        <button
          type="button"
          aria-label={`Open ${name}`}
          className="absolute inset-x-0 top-0 z-30 cursor-pointer border-0 bg-transparent p-0"
          style={{ height: TAB_HIT_HEIGHT }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            handleTap()
          }}
        />
      )}

      {/* Structure 1: Back panel — full folder body + tab */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.08))' }}
      >
        <svg className="w-full h-full block" viewBox="0 0 352 232" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`backGrad-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#dedfd6" />
              <stop offset="100%" stopColor="#c8cac1" />
            </linearGradient>
          </defs>
          <path
            d="M16,231.5A15.51,15.51,0,0,1,.5,216V16A15.51,15.51,0,0,1,16,.5H154.79a15.39,15.39,0,0,1,11,4.54L187,26.25a14.4,14.4,0,0,0,10.25,4.25H336A15.51,15.51,0,0,1,351.5,46V216A15.51,15.51,0,0,1,336,231.5Z"
            fill={`url(#backGrad-${uid})`}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="1"
          />
          <path
            d="M16,1.5 H154.79 a14.39,14.39,0,0,1,10.2,4.2 L186.2,25.3"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1"
            fill="none"
          />
        </svg>
        <span className="absolute top-[7px] left-[18px] text-[13.5px] font-medium tracking-tight text-neutral-900 select-none">
          {name}
        </span>
      </div>

      {showInnerCards && <FolderInnerCards closing={mode === 'closing'} />}

      {/* Structure 2: Front flap — hinged at folder bottom, opens outward */}
      <motion.div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          transformPerspective: FOLDER_PERSPECTIVE,
          transformOrigin: '50% 100%',
          filter: isLast
            ? 'drop-shadow(0 -2px 4px rgba(0,0,0,0.03))'
            : 'drop-shadow(0 -2px 4px rgba(0,0,0,0.03)) drop-shadow(0 8px 16px rgba(0,0,0,0.12))',
        }}
        animate={{ rotateX: isFlapOpen ? -30 : 0 }}
        transition={{
          type: 'spring',
          stiffness: mode === 'closing' ? 300 : 240,
          damping: mode === 'closing' ? 30 : 26,
          delay: isFlapOpen ? 0.1 : 0,
        }}
      >
        <svg className="w-full h-full block" viewBox="0 0 352 232" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`frontGrad-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d5d7ce" />
              <stop offset="100%" stopColor="#c2c5bc" />
            </linearGradient>
          </defs>
          <path
            d="M16,231.5A15.51,15.51,0,0,1,.5,216V76A15.51,15.51,0,0,1,16,60.5H154.79A14.4,14.4,0,0,0,165,56.25L186.25,35a15.39,15.39,0,0,1,11-4.54H336A15.51,15.51,0,0,1,351.5,46V216A15.51,15.51,0,0,1,336,231.5Z"
            fill={`url(#frontGrad-${uid})`}
            stroke="rgba(0,0,0,0.14)"
            strokeWidth="1"
          />
          <path
            d="M16,61.5 H154.79 A13.4,13.4,0,0,0,164.2,57.5 L185.5,36.2 a14.39,14.39,0,0,1,10.2-4.2 H336"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      </motion.div>
    </motion.div>
  )
}
