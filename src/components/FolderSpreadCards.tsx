import { motion } from 'framer-motion'
import { designPx, FOLDER_DESIGN } from '../config/folderDesign'
import type { SpreadCardLayout } from '../utils/innerCardSpread'
import FolderInnerCardFace from './FolderInnerCardFace'

interface FolderSpreadCardsProps {
  layouts: SpreadCardLayout[]
  closing?: boolean
  scale?: number
}

const DEFAULT_SCALE = 0.92

export default function FolderSpreadCards({
  layouts,
  closing = false,
  scale = DEFAULT_SCALE,
}: FolderSpreadCardsProps) {
  const cardWidth = designPx(FOLDER_DESIGN.spreadCardWidth, scale)
  const cardHeight = designPx(FOLDER_DESIGN.spreadCardHeight, scale)
  const radius = designPx(FOLDER_DESIGN.innerCardRadius, scale)
  const shadowY = designPx(FOLDER_DESIGN.innerCardShadowY, scale)
  const shadowBlur = designPx(FOLDER_DESIGN.innerCardShadowBlur, scale)
  const hiddenY = designPx(FOLDER_DESIGN.spreadCardHiddenY, scale)

  return (
    <div
      className="folder-spread-cards pointer-events-none absolute inset-x-0 z-[55]"
      aria-hidden
    >
      <div className="folder-spread-cards__stage">
        <div className="folder-spread-cards__cluster">
          {layouts.map((card, i) => (
            <motion.div
              key={i}
              className="folder-spread-cards__card absolute overflow-hidden border border-neutral-200/80 bg-white"
              style={{
                width: cardWidth,
                height: cardHeight,
                marginLeft: -cardWidth / 2,
                marginTop: -cardHeight / 2,
                zIndex: card.zIndex,
                transformOrigin: '50% 50%',
                borderRadius: radius,
                boxShadow: `0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,0.14)`,
              }}
              initial={{
                x: 0,
                y: hiddenY,
                opacity: 0,
                rotate: 0,
                scale: 0.9,
              }}
              animate={
                closing
                  ? {
                      x: 0,
                      y: hiddenY,
                      opacity: 0,
                      rotate: 0,
                      scale: 0.9,
                    }
                  : {
                      x: designPx(card.x, scale),
                      y: designPx(card.y, scale),
                      opacity: 1,
                      rotate: card.rotate,
                      scale: 1,
                    }
              }
              transition={{
                delay: closing ? (layouts.length - 1 - i) * 0.04 : card.delay,
                type: 'spring',
                stiffness: closing ? 380 : 300,
                damping: closing ? 34 : 26,
              }}
            >
              <FolderInnerCardFace scale={scale} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
