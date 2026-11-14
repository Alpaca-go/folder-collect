import { motion } from 'framer-motion'
import {
  designPx,
  FOLDER_DESIGN,
  INNER_CARD_SPREAD,
  INNER_POCKET_CARD_COUNT,
  SPREAD_PROMOTE,
  innerCardFaceScaleFromWidth,
} from '../config/folderDesign'
import type { SpreadCardLayout } from '../utils/innerCardSpread'
import { extraCardBehindPocketPose } from '../utils/extraCardIntro'
import type { PocketCardMeasure } from '../utils/pocketCardGeometry'
import type { PocketCardSize } from '../utils/measureScreenCardPins'
import FolderInnerCardFace from './FolderInnerCardFace'

export type SpreadPromotePhase = 'hold' | 'gather' | 'settled' | 'retract'

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
            const isPocket = i < INNER_POCKET_CARD_COUNT
            const extraSlot = i - INNER_POCKET_CARD_COUNT
            const finalX = designPx(layout.x, faceScale)
            const finalY = designPx(layout.y, faceScale)

            if (phase === 'retract') {
              const undockSec = SPREAD_PROMOTE.undockDurationMs / 1000
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
                  animate={{
                    x: finalX,
                    y: finalY,
                    rotate: layout.rotate,
                    opacity: 0,
                    scale: 0.96,
                  }}
                  transition={{
                    duration: undockSec,
                    ease: [0.42, 0, 0.18, 1],
                    delay: (layouts.length - 1 - i) * 0.02,
                  }}
                >
                  <FolderInnerCardFace scale={faceScale} />
                </motion.div>
              )
            }

            if (phase === 'hold') {
              if (isPocket || !pocketHandoff?.length) return null
              const pose = extraCardBehindPocketPose(extraSlot, pocketHandoff, faceScale)
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
                    x: pose.x,
                    y: pose.y + designPx(5, faceScale),
                    opacity: 0,
                    rotate: pose.rotate - 1.5,
                    scale: pose.scale * 0.98,
                  }}
                  animate={{
                    x: pose.x,
                    y: pose.y,
                    opacity: pose.opacity,
                    rotate: pose.rotate,
                    scale: pose.scale,
                  }}
                  transition={{
                    delay: extraSlot * (SPREAD_PROMOTE.extraInStaggerMs / 1000),
                    opacity: { duration: 0.38, ease: 'easeOut' },
                    default: { type: 'spring', stiffness: 300, damping: 28 },
                  }}
                >
                  <FolderInnerCardFace scale={faceScale} />
                </motion.div>
              )
            }

            if (phase === 'gather' && isPocket && !pocketHandoff?.[i]) {
              return null
            }

            let animate: Record<string, number>
            let transition: Record<string, unknown>
            let initial: Record<string, number> | false = false

            if (closing) {
              const pocket = pocketHandoff?.[i]
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
            } else if (isPocket) {
              const pocket = pocketHandoff![i]
              if (phase === 'gather') {
                initial = {
                  x: pocket.x,
                  y: pocket.y,
                  opacity: 1,
                  rotate: pocket.rotate,
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
            } else {
              const behind =
                pocketHandoff?.length && phase === 'gather'
                  ? extraCardBehindPocketPose(extraSlot, pocketHandoff, faceScale)
                  : null
              if (phase === 'gather' && behind) {
                initial = {
                  x: behind.x,
                  y: behind.y,
                  opacity: 1,
                  rotate: behind.rotate,
                  scale: behind.scale,
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
