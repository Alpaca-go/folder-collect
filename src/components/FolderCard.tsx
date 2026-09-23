import { useRef } from 'react'
import { motion } from 'framer-motion'
import {
  FOLDER_DESIGN,
  folderFontSize,
  folderHeightRatio,
  folderWidthRatio,
} from '../config/folderDesign'
import FolderInnerCards from './FolderInnerCards'
import { stackZIndexForIndex } from '../utils/folderMorph'

const FOLDER_ROTATE_X = -40
const FOLDER_PERSPECTIVE = 1200
const INACTIVE_DIVE_Y = 200
const STACK_SCALE = 0.965
const ACTIVE_SCALE = 0.9

const BACK_PANEL_PATH =
  'M16,231.5A15.51,15.51,0,0,1,.5,216V16A15.51,15.51,0,0,1,16,.5H154.79a15.39,15.39,0,0,1,11,4.54L187,26.25a14.4,14.4,0,0,0,10.25,4.25H336A15.51,15.51,0,0,1,351.5,46V216A15.51,15.51,0,0,1,336,231.5Z'

// Trim back panel above the bottom curve so only the front flap draws the visible lower corners.
const BACK_PANEL_PATH_FLAP_OPEN =
  'M16,216 H.5 V16 A15.51,15.51,0,0,1,16,.5 H154.79 a15.39,15.39,0,0,1,11,4.54 L187,26.25 a14.4,14.4,0,0,0,10.25,4.25 H336 A15.51,15.51,0,0,1,351.5,46 V216 H16 Z'

const FRONT_PANEL_PATH =
  'M16,231.5A15.51,15.51,0,0,1,.5,216V76A15.51,15.51,0,0,1,16,60.5H154.79A14.4,14.4,0,0,0,165,56.25L186.25,35a15.39,15.39,0,0,1,11-4.54H336A15.51,15.51,0,0,1,351.5,46V216A15.51,15.51,0,0,1,336,231.5Z'

export type FolderMode = 'default' | 'active' | 'inactive' | 'closing' | 'returning' | 'revealing'

interface FolderCardProps {
  name: string
  index: number
  isLast?: boolean
  mode: FolderMode
  centerOffsetY?: number
  revealDelay?: number
  shouldSuppressActivate?: () => boolean
  onActivate: (element: HTMLElement) => void
}

export default function FolderCard({
  name,
  index,
  isLast = false,
  mode,
  centerOffsetY = 0,
  revealDelay = 0,
  shouldSuppressActivate,
  onActivate,
}: FolderCardProps) {
  const uid = `folder-${index}`
  const rootRef = useRef<HTMLDivElement>(null)
  const isCentered = mode === 'active' || mode === 'closing'
  const isFlapOpen = mode === 'active'
  const showInnerCards = mode === 'active' || mode === 'closing'
  const revealDelaySec = revealDelay / 1000
  const useStackShadow = !isCentered && !isFlapOpen && !isLast
  const usePanelShadow = !isCentered && !isFlapOpen

  const handleTap = () => {
    if (rootRef.current && mode === 'default') onActivate(rootRef.current)
  }

  return (
    <motion.div
      ref={rootRef}
      className="relative w-full shrink-0 aspect-[352/232] select-none [container-type:inline-size]"
      data-purpose="contact-card"
      data-index={index}
      initial={false}
      animate={{
        y: isCentered ? centerOffsetY : mode === 'inactive' ? INACTIVE_DIVE_Y : 0,
        opacity: mode === 'inactive' ? 0 : 1,
        rotateX: isCentered ? -6 : FOLDER_ROTATE_X,
        scale: isCentered ? ACTIVE_SCALE : mode === 'inactive' ? STACK_SCALE * 0.92 : STACK_SCALE,
      }}
      transition={{
        y: {
          type: 'spring',
          stiffness:
            mode === 'revealing' ? 360 : mode === 'inactive' ? 260 : mode === 'returning' ? 280 : mode === 'active' ? 260 : 320,
          damping:
            mode === 'revealing' ? 24 : mode === 'inactive' ? 30 : mode === 'returning' ? 32 : mode === 'active' ? 28 : 32,
          delay: mode === 'revealing' ? revealDelaySec : 0,
        },
        rotateX: {
          type: 'spring',
          stiffness: mode === 'returning' ? 280 : mode === 'closing' ? 300 : mode === 'active' ? 260 : 320,
          damping: mode === 'returning' ? 32 : mode === 'closing' ? 30 : mode === 'active' ? 28 : 32,
        },
        scale: {
          type: 'spring',
          stiffness: mode === 'returning' ? 280 : mode === 'revealing' ? 360 : mode === 'active' ? 260 : 320,
          damping: mode === 'returning' ? 32 : mode === 'revealing' ? 24 : mode === 'active' ? 28 : 32,
          delay: mode === 'revealing' ? revealDelaySec : 0,
        },
        opacity: {
          duration: mode === 'revealing' ? 0.32 : mode === 'inactive' ? 0.48 : mode === 'default' ? 0.42 : 0.35,
          ease: 'easeOut',
          delay: mode === 'revealing' ? revealDelaySec : 0,
        },
      }}
      style={{
        zIndex: isCentered || mode === 'returning' ? 100 : stackZIndexForIndex(index),
        transformPerspective: FOLDER_PERSPECTIVE,
        transformOrigin: '50% 0%',
        pointerEvents:
          mode === 'inactive' ||
          mode === 'closing' ||
          mode === 'returning' ||
          mode === 'revealing'
            ? 'none'
            : 'auto',
      }}
    >
      {mode === 'default' && (
        <button
          type="button"
          aria-label={`Open ${name}`}
          className={`absolute inset-x-0 z-30 cursor-pointer border-0 bg-transparent p-0 ${
            isLast ? 'inset-y-0' : 'top-0'
          }`}
          style={isLast ? undefined : { height: folderHeightRatio(FOLDER_DESIGN.tabHitHeight) }}
          onClick={(e) => {
            e.stopPropagation()
            if (shouldSuppressActivate?.()) return
            handleTap()
          }}
        />
      )}

      {/* Structure 1: Back panel — full folder body + tab */}
      <div className="folder-panel-back absolute inset-0 z-10 pointer-events-none">
        <svg className="w-full h-full block" viewBox="0 0 352 232" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`backGrad-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#dedfd6" />
              <stop offset="100%" stopColor="#c8cac1" />
            </linearGradient>
            <filter
              id={`backShadow-${uid}`}
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
            d={isCentered ? BACK_PANEL_PATH_FLAP_OPEN : BACK_PANEL_PATH}
            fill={`url(#backGrad-${uid})`}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="1"
            filter={usePanelShadow ? `url(#backShadow-${uid})` : undefined}
          />
          <path
            d="M16,1.5 H154.79 a14.39,14.39,0,0,1,10.2,4.2 L186.2,25.3"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1"
            fill="none"
          />
        </svg>
        <span
          className="absolute font-medium tracking-tight text-neutral-900 select-none"
          style={{
            top: folderHeightRatio(FOLDER_DESIGN.labelTop),
            left: folderWidthRatio(FOLDER_DESIGN.labelLeft),
            fontSize: folderFontSize(FOLDER_DESIGN.labelFontSize),
          }}
        >
          {name}
        </span>
      </div>

      {showInnerCards && <FolderInnerCards closing={mode === 'closing'} />}

      {/* Structure 2: Front flap — hinged at folder bottom, opens outward */}
      <motion.div
        className="folder-panel-front absolute inset-0 z-20 pointer-events-none"
        style={{
          transformPerspective: FOLDER_PERSPECTIVE,
          transformOrigin: '50% 100%',
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
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
            <filter
              id={`frontShadow-${uid}`}
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
            fill={`url(#frontGrad-${uid})`}
            stroke="rgba(0,0,0,0.14)"
            strokeWidth="1"
            filter={useStackShadow ? `url(#frontShadow-${uid})` : undefined}
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
