import { motion, type MotionValue } from 'framer-motion'
import FolderCard, { type FolderMode } from './FolderCard'

interface StackFolderItemProps {
  index: number
  overlap: MotionValue<number>
  name: string
  isLast: boolean
  mode: FolderMode
  centerOffsetY: number
  onActivate: (element: HTMLElement) => void
}

export default function StackFolderItem({
  index,
  overlap,
  name,
  isLast,
  mode,
  centerOffsetY,
  onActivate,
}: StackFolderItemProps) {
  if (index === 0) {
    return (
      <FolderCard
        name={name}
        index={index}
        isLast={isLast}
        mode={mode}
        centerOffsetY={centerOffsetY}
        onActivate={onActivate}
      />
    )
  }

  return (
    <motion.div style={{ marginTop: overlap }}>
      <FolderCard
        name={name}
        index={index}
        isLast={isLast}
        mode={mode}
        centerOffsetY={centerOffsetY}
        onActivate={onActivate}
      />
    </motion.div>
  )
}
