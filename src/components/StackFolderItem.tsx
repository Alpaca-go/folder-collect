import { useRef } from 'react'
import { useMotionValueEvent, type MotionValue } from 'framer-motion'
import FolderCard, { type FolderMode } from './FolderCard'

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
}: StackFolderItemProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useMotionValueEvent(elasticOffset, 'change', (latest) => {
    if (wrapperRef.current) {
      wrapperRef.current.style.transform = `translate3d(0, ${latest}px, 0)`
    }
  })

  return (
    <div ref={wrapperRef} data-folder-index={index} className="elastic-folder-wrapper">
      <FolderCard
        name={name}
        index={index}
        isLast={isLast}
        mode={mode}
        centerOffsetY={centerOffsetY}
        revealDelay={revealDelay}
        shouldSuppressActivate={shouldSuppressActivate}
        onActivate={onActivate}
      />
    </div>
  )
}
