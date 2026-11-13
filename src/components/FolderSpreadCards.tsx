import { motion } from 'framer-motion'
import {
  designPx,
  FOLDER_DESIGN,
  INNER_CARD_SPREAD,
  innerCardFaceScaleFromWidth,
} from '../config/folderDesign'
import type { SpreadCardLayout } from '../utils/innerCardSpread'
import type { PocketCardMeasure } from '../utils/pocketCardGeometry'
import type { PocketCardSize } from '../utils/measureScreenCardPins'
import FolderInnerCardFace from './FolderInnerCardFace'

export type SpreadPromotePhase = 'gather' | 'settled'

interface FolderSpreadCardsProps {
  layouts: SpreadCardLayout[]
  phase: SpreadPromotePhase
  cardSize: PocketCardSize
  pocketHandoff?: PocketCardMeasure[] | null
  closing?: boolean
}

export default function FolderSpreadCards({
  layouts,
  phase,
  cardSize,
  pocketHandoff = null,
  closing = false,
}: FolderSpreadCardsProps) {
  const faceScale = innerCardFaceScaleFromWidth(cardSize.width)
  const { width, height } = cardSize
  const radius = designPx(FOLDER_DESIGN.innerCardRadius, faceScale)
  const shadowY = designPx(FOLDER_DESIGN.innerCardShadowY, faceScale)
  const shadowBlur = designPx(FOLDER_DESIGN.innerCardShadowBlur, faceScale)

  return (
    <div
      className="folder-spread-cards pointer-events-none absolute inset-x-0 z-[55]"
      aria-hidden
    >
      <div className="folder-spread-cards__stage">
        <div className="folder-spread-cards__cluster">
          {layouts.map((layout, i) => {
            if (phase === 'gather' && !pocketHandoff?.[i]) {
              return null
            }

            const pocket = pocketHandoff?.[i]
            const finalX = designPx(layout.x, faceScale)
            const finalY = designPx(layout.y, faceScale)

            let animate: Record<string, number>
            let transition: Record<string, unknown>
            let initial: Record<string, number> | false = false

            if (closing) {
              animate = {
                x: pocket?.x ?? 0,
                y: (pocket?.y ?? 0) + 40,
                opacity: 0,
                rotate: pocket?.rotate ?? 0,
                scale: 0.92,
              }
              transition = {
                delay: (layouts.length - 1 - i) * 0.035,
                type: 'spring',
                stiffness: 380,
                damping: 34,
              }
            } else {
              const startX = pocket?.x ?? 0
              const startY = pocket?.y ?? 0
              const startR = pocket?.rotate ?? 0

              if (phase === 'gather') {
                initial = {
                  x: startX,
                  y: startY,
                  opacity: 1,
                  rotate: startR,
                  scale: 1,
                }
              }

              animate = {
                x: finalX,
                y: finalY,
                opacity: 1,
                rotate: layout.rotate,
                scale: 1,
              }
              transition =
                phase === 'settled'
                  ? { duration: 0 }
                  : {
                      delay:
                        INNER_CARD_SPREAD.gatherDelayBase + i * INNER_CARD_SPREAD.gatherDelayStep,
                      type: 'spring',
                      stiffness: 255,
                      damping: 27,
                    }
            }

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
                initial={initial}
                animate={animate}
                transition={transition}
              >
                <FolderInnerCardFace scale={faceScale} />
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
