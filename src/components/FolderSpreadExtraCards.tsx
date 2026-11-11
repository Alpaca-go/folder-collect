import { motion } from 'framer-motion'
import {
  designPx,
  FOLDER_DESIGN,
  INNER_POCKET_CARD_COUNT,
  innerCardSize,
} from '../config/folderDesign'
import type { SpreadCardLayout } from '../utils/innerCardSpread'
import FolderInnerCardFace from './FolderInnerCardFace'

interface FolderSpreadExtraCardsProps {
  layouts: SpreadCardLayout[]
  folderScale: number
}

function pocketCardSize(folderScale: number) {
  return innerCardSize(folderScale)
}

function extraCardPose(index: number, visible: boolean) {
  const slot = index - INNER_POCKET_CARD_COUNT
  if (visible) {
    return {
      x: (slot - 2) * 10,
      y: slot * 8 - 18,
      rotate: -3 + slot * 2,
      opacity: 1,
      scale: 1,
    }
  }
  return {
    x: (slot - 2) * 6,
    y: slot * 5 - 10,
    rotate: -4 + slot * 2.5,
    opacity: 0,
    scale: 0.96,
  }
}

/** Five cards (index 3–7) fade in; pocket trio stays on pinned DOM clones. */
export default function FolderSpreadExtraCards({
  layouts,
  folderScale,
}: FolderSpreadExtraCardsProps) {
  const pocketSize = pocketCardSize(folderScale)
  const radius = designPx(FOLDER_DESIGN.innerCardRadius, folderScale)
  const shadowY = designPx(FOLDER_DESIGN.innerCardShadowY, folderScale)
  const shadowBlur = designPx(FOLDER_DESIGN.innerCardShadowBlur, folderScale)

  return (
    <div
      className="folder-spread-cards pointer-events-none absolute inset-x-0 z-[55]"
      aria-hidden
    >
      <div className="folder-spread-cards__stage">
        <div className="folder-spread-cards__cluster">
          {layouts.map((layout, i) => {
            if (i < INNER_POCKET_CARD_COUNT) return null

            const start = extraCardPose(i, false)
            const end = extraCardPose(i, true)
            const { width, height } = pocketSize

            return (
              <motion.div
                key={i}
                className="folder-spread-cards__card absolute overflow-hidden border border-neutral-200/80 bg-white"
                style={{
                  width,
                  height,
                  marginLeft: -width / 2,
                  marginTop: -height / 2,
                  zIndex: layout.zIndex,
                  transformOrigin: '50% 50%',
                  borderRadius: radius,
                  boxShadow: `0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,0.14)`,
                  left: '50%',
                  top: '50%',
                }}
                initial={{
                  x: start.x,
                  y: start.y,
                  opacity: start.opacity,
                  rotate: start.rotate,
                  scale: start.scale,
                }}
                animate={{
                  x: end.x,
                  y: end.y,
                  opacity: end.opacity,
                  rotate: end.rotate,
                  scale: end.scale,
                }}
                transition={{
                  delay: (i - INNER_POCKET_CARD_COUNT) * 0.08,
                  opacity: { duration: 0.48, ease: 'easeOut' },
                  default: { type: 'spring', stiffness: 300, damping: 28 },
                }}
              >
                <FolderInnerCardFace scale={folderScale} />
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
