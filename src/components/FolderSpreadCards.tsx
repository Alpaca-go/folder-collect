import { motion } from 'framer-motion'
import {
  designPx,
  FOLDER_DESIGN,
  INNER_CARD_SPREAD,
  INNER_POCKET_CARD_COUNT,
  innerCardSize,
} from '../config/folderDesign'
import type { SpreadCardLayout } from '../utils/innerCardSpread'
import type { PocketCardMeasure } from '../utils/pocketCardGeometry'
import FolderInnerCardFace from './FolderInnerCardFace'

export type SpreadPromotePhase = 'extra-in' | 'gather' | 'settled'

interface FolderSpreadCardsProps {
  layouts: SpreadCardLayout[]
  phase: SpreadPromotePhase
  folderScale: number
  pocketHandoff?: PocketCardMeasure[] | null
  closing?: boolean
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

export default function FolderSpreadCards({
  layouts,
  phase,
  folderScale,
  pocketHandoff = null,
  closing = false,
}: FolderSpreadCardsProps) {
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
            if (phase === 'extra-in' && i < INNER_POCKET_CARD_COUNT) {
              return null
            }
            if (phase === 'gather' && i < INNER_POCKET_CARD_COUNT && !pocketHandoff?.[i]) {
              return null
            }

            const pocket = pocketHandoff?.[i]
            const finalX = designPx(layout.x, folderScale)
            const finalY = designPx(layout.y, folderScale)
            const { width, height } = pocketSize

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
            } else if (phase === 'extra-in' && i >= INNER_POCKET_CARD_COUNT) {
              const start = extraCardPose(i, false)
              const end = extraCardPose(i, true)
              initial = {
                x: start.x,
                y: start.y,
                opacity: start.opacity,
                rotate: start.rotate,
                scale: start.scale,
              }
              animate = {
                x: end.x,
                y: end.y,
                opacity: end.opacity,
                rotate: end.rotate,
                scale: end.scale,
              }
              transition = {
                delay: (i - INNER_POCKET_CARD_COUNT) * 0.08,
                opacity: { duration: 0.48, ease: 'easeOut' },
                default: { type: 'spring', stiffness: 300, damping: 28 },
              }
            } else {
              const extra = extraCardPose(i, true)
              const startX = i < INNER_POCKET_CARD_COUNT && pocket ? pocket.x : extra.x
              const startY = i < INNER_POCKET_CARD_COUNT && pocket ? pocket.y : extra.y
              const startR =
                i < INNER_POCKET_CARD_COUNT && pocket ? pocket.rotate : extra.rotate

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
                <FolderInnerCardFace scale={folderScale} />
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
