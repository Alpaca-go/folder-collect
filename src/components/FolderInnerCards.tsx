import { motion } from 'framer-motion'

const CARDS = [
  { rotate: -11, x: -14, delay: 0.22 },
  { rotate: -2, x: 2, delay: 0.34 },
  { rotate: 9, x: 16, delay: 0.46 },
]

interface FolderInnerCardsProps {
  closing?: boolean
}

export default function FolderInnerCards({ closing = false }: FolderInnerCardsProps) {
  return (
    <div
      className="absolute left-[8%] right-[8%] z-[15] overflow-hidden pointer-events-none"
      style={{ top: `${(76 / 232) * 100}%`, bottom: '8%' }}
    >
      {CARDS.map((card, i) => (
        <motion.div
          key={i}
          className="absolute left-2 right-2 rounded-[12px] bg-white border border-neutral-200/80 shadow-[0_4px_14px_rgba(0,0,0,0.1)]"
          style={{
            height: 92,
            bottom: -46,
            zIndex: i + 1,
            transformOrigin: '50% 100%',
          }}
          initial={{ y: 56, opacity: 0, rotate: 0, scale: 0.9 }}
          animate={
            closing
              ? { y: 56, opacity: 0, rotate: 0, scale: 0.9, x: 0 }
              : { y: 0, opacity: 1, rotate: card.rotate, scale: 1, x: card.x }
          }
          transition={{
            delay: closing ? (CARDS.length - 1 - i) * 0.07 : card.delay,
            type: 'spring',
            stiffness: closing ? 380 : 300,
            damping: closing ? 32 : 26,
          }}
        />
      ))}
    </div>
  )
}
