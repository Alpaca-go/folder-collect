import { useRef } from 'react'
import { motion } from 'framer-motion'
import {
  FOLDER_DESIGN,
  folderFontSize,
  folderHeightRatio,
  folderStackLabelInset,
} from '../config/folderDesign'
import { FOLDER_ASPECT_RATIO } from '../config/folderImageLayout'
import FolderInnerCards from './FolderInnerCards'
import { FolderPanelBack, FolderPanelFront } from './FolderPanelLayers'
import { stackLayerHorizontallyFlipped, stackZIndexForIndex } from '../utils/folderMorph'

const FOLDER_ROTATE_X = -40
const FOLDER_PERSPECTIVE = 1200
const INACTIVE_DIVE_Y = 200
const STACK_SCALE = 0.965
const ACTIVE_SCALE = 0.9

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
  /** Close path: keep hidden siblings in stack slots (no inactive dive). */
  stackSiblingCollapsed?: boolean
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
  stackSiblingCollapsed = false,
}: FolderCardProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const isCentered = mode === 'active' || mode === 'closing'
  const isFlapOpen = mode === 'active'
  const showInnerCards = mode === 'active' || mode === 'closing'
  const revealDelaySec = revealDelay / 1000
  const useStackShadow = !isCentered && !isFlapOpen && !isLast
  const usePanelShadow = !isCentered && !isFlapOpen
  const stackFlipped = stackLayerHorizontallyFlipped(index) && !isCentered
  const stackScale =
    isCentered ? ACTIVE_SCALE : mode === 'inactive' ? STACK_SCALE * 0.92 : STACK_SCALE
  const labelInset = folderStackLabelInset(stackFlipped)

  const handleTap = () => {
    if (rootRef.current && mode === 'default') onActivate(rootRef.current)
  }

  return (
    <motion.div
      ref={rootRef}
      className="relative w-full shrink-0 select-none [container-type:inline-size]"
      data-purpose="contact-card"
      data-index={index}
      initial={false}
      animate={{
        y: isCentered
          ? centerOffsetY
          : mode === 'inactive'
            ? stackSiblingCollapsed
              ? 0
              : INACTIVE_DIVE_Y
            : 0,
        opacity: mode === 'inactive' ? 0 : 1,
        rotateX: isCentered ? -6 : FOLDER_ROTATE_X,
        scaleX: stackFlipped ? -stackScale : stackScale,
        scaleY: stackScale,
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
        scaleX: {
          type: 'spring',
          stiffness: mode === 'returning' ? 280 : mode === 'revealing' ? 360 : mode === 'active' ? 260 : 320,
          damping: mode === 'returning' ? 32 : mode === 'revealing' ? 24 : mode === 'active' ? 28 : 32,
          delay: mode === 'revealing' ? revealDelaySec : 0,
        },
        scaleY: {
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
        aspectRatio: FOLDER_ASPECT_RATIO,
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

      <div className="folder-panel-back absolute inset-0 z-10 pointer-events-none">
        <FolderPanelBack flapOpen={isFlapOpen} panelShadow={usePanelShadow ? 'default' : 'off'} />
        <span
          className="absolute font-medium tracking-tight text-neutral-900 select-none"
          style={{
            top: folderHeightRatio(FOLDER_DESIGN.labelTop),
            left: labelInset.left,
            right: labelInset.right,
            transform: labelInset.transform,
            transformOrigin: labelInset.transformOrigin,
            fontSize: folderFontSize(FOLDER_DESIGN.labelFontSize),
          }}
        >
          {name}
        </span>
      </div>

      {showInnerCards && (
        <motion.div
          className="folder-focus-glow"
          aria-hidden
          initial={false}
          animate={{ opacity: mode === 'closing' ? 0 : 1 }}
          transition={{
            opacity: {
              duration: mode === 'closing' ? 0.28 : 0.5,
              delay: mode === 'closing' ? 0 : 0.08,
              ease: [0.22, 0, 0.15, 1],
            },
          }}
        />
      )}

      {showInnerCards && <FolderInnerCards closing={mode === 'closing'} />}

      <motion.div
        className="folder-panel-front absolute inset-0 z-20 pointer-events-none"
        style={{
          transformPerspective: FOLDER_PERSPECTIVE,
          transformOrigin: '50% 100%',
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
        }}
        animate={{ rotateX: isFlapOpen ? -36 : 0 }}
        transition={{
          type: 'spring',
          stiffness: mode === 'closing' ? 300 : 240,
          damping: mode === 'closing' ? 30 : 26,
          delay: isFlapOpen ? 0.1 : 0,
        }}
      >
        <FolderPanelFront stackShadow={useStackShadow ? 'default' : 'off'} />
      </motion.div>
    </motion.div>
  )
}
