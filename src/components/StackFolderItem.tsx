import { useRef } from 'react'
import { useMotionValueEvent, type MotionValue } from 'framer-motion'
import FolderCard, { type FolderMode } from './FolderCard'
import type { SpreadCardLayout } from '../utils/innerCardSpread'

type PocketSpreadPhase = 'hold' | 'centerSpin' | 'gather' | 'settled' | 'retract'

interface StackFolderItemProps {
  index: number
  name: string
  isLast: boolean
  mode: FolderMode
  centerOffsetY: number
  revealDelay?: number
  elasticOffset: MotionValue<number>
  shouldSuppressActivate?: () => boolean
  onActivate: (element: HTMLElement) => void
  onDockFolder?: (element: HTMLElement) => void
  focusAboveOverlay?: boolean
  folderDocked?: boolean
  dockPinBaselineY?: number | null
  spreadPhase?: PocketSpreadPhase | null
  spreadPromoteStyle?: 'centerSpin' | 'scatter' | null
  spreadLayouts?: SpreadCardLayout[] | null
  spreadOrigin?: { x: number; y: number } | null
  spreadPortalRoot?: HTMLElement | null
  itemHidden?: boolean
  itemEntering?: boolean
  stackSiblingCollapsed?: boolean
  pocketInnerCards?: boolean
  /** Match spread undock duration — folder Y uses tween, not spring. */
  centerYSyncUndock?: boolean
}

export default function StackFolderItem({
  index,
  name,
  isLast,
  mode,
  centerOffsetY,
  revealDelay = 0,
  elasticOffset,
  shouldSuppressActivate,
  onActivate,
  onDockFolder,
  focusAboveOverlay = false,
  folderDocked = false,
  dockPinBaselineY = null,
  spreadPhase = null,
  spreadPromoteStyle = null,
  spreadLayouts = null,
  spreadOrigin = null,
  spreadPortalRoot = null,
  itemHidden = false,
  itemEntering = false,
  stackSiblingCollapsed = false,
  pocketInnerCards = true,
  centerYSyncUndock = false,
}: StackFolderItemProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useMotionValueEvent(elasticOffset, 'change', (latest) => {
    if (wrapperRef.current) {
      wrapperRef.current.style.transform = `translate3d(0, ${latest}px, 0)`
    }
  })

  return (
    <div
      ref={wrapperRef}
      data-folder-index={index}
      className={`elastic-folder-wrapper${itemHidden ? ' opacity-0 pointer-events-none' : ''}${
        itemEntering ? ' folder-tail-enter' : ''
      }${focusAboveOverlay ? ' elastic-folder-wrapper--active-focus' : ''}`}
    >
      <FolderCard
        name={name}
        index={index}
        isLast={isLast}
        mode={mode}
        centerOffsetY={centerOffsetY}
        revealDelay={revealDelay}
        shouldSuppressActivate={shouldSuppressActivate}
        onActivate={onActivate}
        onDockFolder={onDockFolder}
        folderDocked={folderDocked}
        dockPinBaselineY={dockPinBaselineY}
        spreadPhase={spreadPhase}
        spreadPromoteStyle={spreadPromoteStyle}
        spreadLayouts={spreadLayouts}
        spreadOrigin={spreadOrigin}
        spreadPortalRoot={spreadPortalRoot}
        stackSiblingCollapsed={stackSiblingCollapsed}
        pocketInnerCards={pocketInnerCards}
        centerYSyncUndock={centerYSyncUndock}
      />
    </div>
  )
}
