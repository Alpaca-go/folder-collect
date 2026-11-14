import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FOLDER_DESIGN,
  folderHeightRatio,
  innerCardPocketFlapStartMs,
  SPREAD_PROMOTE,
} from '../config/folderDesign'
import { FOLDER_ASPECT_RATIO } from '../config/folderImageLayout'
import FolderInnerCards from './FolderInnerCards'
import FolderStackLabel from './FolderStackLabel'
import { FolderPanelBack, FolderPanelFront } from './FolderPanelLayers'
import { stackLayerHorizontallyFlipped, stackZIndexForIndex } from '../utils/folderMorph'
import type { SpreadCardLayout } from '../utils/innerCardSpread'

type PocketSpreadPhase = 'hold' | 'gather' | 'settled' | 'retract'

const FOLDER_ROTATE_X = -40
const FOLDER_PERSPECTIVE = 1200
const INACTIVE_DIVE_Y = 200
const STACK_SCALE = 0.965
const ACTIVE_SCALE = 0.9
const ACTIVE_ROTATE_X = -6
const ACTIVE_FLAP_ROTATE_X = -36

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
  /** Second tap on flap while active: dock folder shell. */
  onDockFolder?: (element: HTMLElement) => void
  folderDocked?: boolean
  /** centerOffsetY at dock start — pocket cards counter-translate to stay on screen. */
  dockPinBaselineY?: number | null
  spreadPhase?: PocketSpreadPhase | null
  spreadLayouts?: SpreadCardLayout[] | null
  spreadOrigin?: { x: number; y: number } | null
  /** Close path: keep hidden siblings in stack slots (no inactive dive). */
  stackSiblingCollapsed?: boolean
  pocketInnerCards?: boolean
  centerYSyncUndock?: boolean
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
  onDockFolder,
  folderDocked = false,
  dockPinBaselineY = null,
  spreadPhase = null,
  spreadLayouts = null,
  spreadOrigin = null,
  stackSiblingCollapsed = false,
  pocketInnerCards = true,
  centerYSyncUndock = false,
}: FolderCardProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [flapHeldOpenForPocket, setFlapHeldOpenForPocket] = useState(false)
  /** Back trim stays open until the front flap finishes closing (avoids clip vs hinge mismatch). */
  const [backFlapClipOpen, setBackFlapClipOpen] = useState(false)
  const isCentered = mode === 'active' || mode === 'closing'
  const isPocketClosing = mode === 'closing'
  const frontFlapOpen = mode === 'active' || flapHeldOpenForPocket
  const showInnerCards = mode === 'active' || mode === 'closing'

  useEffect(() => {
    if (mode !== 'closing') {
      setFlapHeldOpenForPocket(false)
      return
    }
    setFlapHeldOpenForPocket(true)
    const pocketCloseMs = innerCardPocketFlapStartMs()
    const timer = window.setTimeout(() => setFlapHeldOpenForPocket(false), pocketCloseMs)
    return () => window.clearTimeout(timer)
  }, [mode])

  useEffect(() => {
    if (frontFlapOpen) {
      setBackFlapClipOpen(true)
    } else if (mode !== 'closing') {
      setBackFlapClipOpen(false)
    }
  }, [frontFlapOpen, mode])
  const revealDelaySec = revealDelay / 1000
  const folderLifted = isCentered || folderDocked
  const usePanelShadow = folderLifted || !frontFlapOpen
  const useStackShadow = (folderLifted || !frontFlapOpen) && (!isLast || folderLifted)
  const stackFlipped = stackLayerHorizontallyFlipped(index)
  const stackScale =
    isCentered ? ACTIVE_SCALE : mode === 'inactive' ? STACK_SCALE * 0.92 : STACK_SCALE
  const canOpenFromStack = mode === 'default' || mode === 'revealing'
  const pocketViewportPinY =
    folderDocked && dockPinBaselineY != null ? -(centerOffsetY - dockPinBaselineY) : 0
  const folderYOffsetTransition = centerYSyncUndock
    ? {
        type: 'tween' as const,
        duration: SPREAD_PROMOTE.undockDurationMs / 1000,
        ease: [0.42, 0, 0.18, 1] as const,
      }
    : {
        type: 'spring' as const,
        stiffness: mode === 'inactive' ? 260 : mode === 'active' ? 260 : 320,
        damping: mode === 'inactive' ? 30 : mode === 'active' ? 28 : 32,
        delay: 0,
      }

  const handleTap = () => {
    if (rootRef.current && canOpenFromStack) onActivate(rootRef.current)
  }

  return (
    <motion.div
      ref={rootRef}
      className="relative w-full shrink-0 select-none [container-type:inline-size]"
      data-purpose="contact-card"
      data-index={index}
      data-folder-lifted={folderLifted || undefined}
      data-folder-docked={folderDocked || undefined}
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
        rotateX: isCentered ? ACTIVE_ROTATE_X : FOLDER_ROTATE_X,
        scaleX: stackFlipped ? -stackScale : stackScale,
        scaleY: stackScale,
      }}
      transition={{
        y: centerYSyncUndock
          ? {
              type: 'tween',
              duration: SPREAD_PROMOTE.undockDurationMs / 1000,
              ease: [0.42, 0, 0.18, 1],
            }
          : {
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
        overflow: mode === 'active' || mode === 'closing' ? 'visible' : undefined,
        pointerEvents:
          mode === 'inactive' || mode === 'closing' || mode === 'returning' ? 'none' : 'auto',
        aspectRatio: FOLDER_ASPECT_RATIO,
      }}
    >
      {canOpenFromStack && (
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
        <FolderPanelBack flapOpen={backFlapClipOpen} panelShadow={usePanelShadow ? 'default' : 'off'} />
        <FolderStackLabel name={name} flipped={stackFlipped} />
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

      {showInnerCards && pocketInnerCards && (
        <FolderInnerCards
          closing={isPocketClosing}
          viewportPinY={pocketViewportPinY}
          viewportPinTransition={folderYOffsetTransition}
          holdPocketPose={folderDocked && spreadPhase === 'hold' && !isPocketClosing}
          spreadPhase={spreadPhase}
          spreadLayouts={spreadLayouts}
          spreadOrigin={spreadOrigin}
          folderDocked={folderDocked}
        />
      )}

      <motion.div
        className={`folder-panel-front absolute inset-0 z-20 ${
          mode === 'active' && !folderDocked && onDockFolder ? '' : 'pointer-events-none'
        }`}
        style={{
          transformPerspective: FOLDER_PERSPECTIVE,
          transformOrigin: '50% 100%',
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
        }}
        animate={{ rotateX: frontFlapOpen ? ACTIVE_FLAP_ROTATE_X : 0 }}
        transition={
          frontFlapOpen
            ? {
                type: 'spring',
                stiffness: 240,
                damping: 26,
                delay: mode === 'active' ? 0.1 : 0,
              }
            : {
                type: 'tween',
                duration: 0.46,
                ease: [0.42, 0, 0.18, 1],
              }
        }
        onAnimationComplete={() => {
          if (!frontFlapOpen) setBackFlapClipOpen(false)
        }}
      >
        {mode === 'active' && !folderDocked && onDockFolder && (
          <button
            type="button"
            aria-label={`Dock ${name}`}
            className="absolute inset-0 z-40 cursor-pointer border-0 bg-transparent p-0"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              if (rootRef.current) onDockFolder(rootRef.current)
            }}
          />
        )}
        <FolderPanelFront stackShadow={useStackShadow ? 'default' : 'off'} />
      </motion.div>
    </motion.div>
  )
}
