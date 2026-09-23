import { useEffect, useRef, useState } from 'react'
import {
  CABINET_VIEW,
  PART_A,
  PART_A_HANDLE,
  PART_A_MARK,
  PART_A_SLOT,
  PART_A_TITLE,
  PART_B,
  PART_B_MARK,
  PART_C,
  PART_D,
  PART_D_MARK,
  PART_E,
  PART_E_MARK,
  PART_F,
  PART_F_MARK,
} from './cabinetLayout'
import { DEPTH, SHAPE_STYLE, boxFaces, drawerGroupZ, isoTranslate, poly } from './cabinetIso'
import './cabinet.css'

const Z_BACK = -DEPTH
const Z_FRONT = 0

function Face({ points }: { points: Array<{ x: number; y: number }> }) {
  return <polygon points={poly(points)} {...SHAPE_STYLE} />
}

function Label({
  x,
  y,
  size,
  fontFamily,
  children,
}: {
  x: number
  y: number
  size: number
  fontFamily?: string
  children: string
}) {
  return (
    <text
      x={x}
      y={y}
      fill="#111"
      fontFamily={fontFamily ?? "Arial, ArialMT, sans-serif"}
      fontSize={size}
    >
      {children}
    </text>
  )
}

function RoundedRect({
  x,
  y,
  w,
  h,
  r,
}: {
  x: number
  y: number
  w: number
  h: number
  r: number
}) {
  return <rect x={x} y={y} width={w} height={h} rx={r} ry={r} {...SHAPE_STYLE} />
}

function useAnimatedDrawerZ(open: boolean) {
  const targetZ = drawerGroupZ(open)
  const [z, setZ] = useState(targetZ)
  const zRef = useRef(targetZ)

  useEffect(() => {
    const from = zRef.current
    const to = targetZ
    const start = performance.now()
    const duration = 450
    let frame = 0

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      const next = from + (to - from) * eased
      zRef.current = next
      setZ(next)
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [targetZ])

  return z
}

export default function CabinetSvgDiagram() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const toggleDrawer = () => setDrawerOpen((prev) => !prev)
  const drawerZ = useAnimatedDrawerZ(drawerOpen)

  const f = boxFaces(PART_F.x, PART_F.y, PART_F.w, PART_F.h, Z_FRONT, Z_BACK)
  const e = boxFaces(PART_E.x, PART_E.y, PART_E.w, PART_E.h, Z_BACK, Z_BACK)
  const d = boxFaces(PART_D.x, PART_D.y, PART_D.w, PART_D.h, Z_BACK + 1, Z_BACK + 1)

  const drawerA = boxFaces(PART_A.x, PART_A.y, PART_A.w, PART_A.h, Z_FRONT, Z_FRONT)
  const drawerB = boxFaces(PART_B.x, PART_B.y, PART_B.w, PART_B.h, Z_FRONT, Z_FRONT)

  const cFloor = boxFaces(PART_C.x, PART_C.y, PART_C.w, PART_C.h, Z_FRONT - 1, Z_FRONT - 1)
  const cLeft = boxFaces(PART_C.x - 180, PART_C.y, 180, PART_C.h, Z_FRONT - 1, Z_FRONT - 1)
  const cRight = boxFaces(
    PART_C.x + PART_C.w,
    PART_C.y,
    180,
    PART_C.h,
    Z_FRONT - 1,
    Z_FRONT - 1,
  )

  const slotX = PART_A.x + PART_A_SLOT.x
  const slotY = PART_A.y + PART_A_SLOT.y
  const handleX = PART_A.x + PART_A_HANDLE.x
  const handleY = PART_A.y + PART_A_HANDLE.y

  return (
    <div
      className="cabinet-diagram-wrap"
      data-purpose="cabinet-diagram"
      role="button"
      tabIndex={0}
      aria-label={drawerOpen ? 'Close drawer' : 'Open drawer'}
      aria-pressed={drawerOpen}
      onClick={toggleDrawer}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggleDrawer()
        }
      }}
    >
      <svg
        className="cabinet-svg"
        viewBox={`0 0 ${CABINET_VIEW.w} ${CABINET_VIEW.h}`}
        overflow="visible"
        aria-hidden="true"
      >
        <g className="cabinet-svg-shell">
          <Face points={f.top} />
          <Face points={f.left} />
          <Face points={f.right} />
          <Face points={f.front} />
          <Face points={e.front} />
          <Face points={d.front} />
        </g>

        <g className="cabinet-drawer-motion" transform={isoTranslate(drawerZ)}>
          <Face points={cFloor.top} />
          <Face points={cLeft.right} />
          <Face points={cRight.left} />
          <Face points={drawerB.top} />
          <Face points={drawerB.front} />
          <Face points={drawerA.front} />
          <RoundedRect
            x={slotX}
            y={slotY}
            w={PART_A_SLOT.w}
            h={PART_A_SLOT.h}
            r={PART_A_SLOT.r}
          />
          <RoundedRect
            x={handleX}
            y={handleY}
            w={PART_A_HANDLE.w}
            h={PART_A_HANDLE.h}
            r={PART_A_HANDLE.r}
          />
          <Label x={PART_C.x + PART_C.w / 2} y={PART_C.y + PART_C.h / 2} size={21.1632}>
            C
          </Label>
          <Label x={PART_C.x - 90} y={PART_C.y + PART_C.h / 2} size={21.1632}>
            C1
          </Label>
          <Label x={PART_C.x + PART_C.w + 90} y={PART_C.y + PART_C.h / 2} size={21.1632}>
            C2
          </Label>
          <Label
            x={PART_B.x + PART_B_MARK.x}
            y={PART_B.y + PART_B_MARK.y}
            size={PART_B_MARK.size}
          >
            {PART_B_MARK.text}
          </Label>
          <Label
            x={PART_A.x + PART_A_TITLE.x}
            y={PART_A.y + PART_A_TITLE.y}
            size={PART_A_TITLE.size}
            fontFamily="'HarmonyOS Sans SC', HarmonyOS_Sans_SC, system-ui, sans-serif"
          >
            {PART_A_TITLE.text}
          </Label>
          <Label
            x={PART_A.x + PART_A_MARK.x}
            y={PART_A.y + PART_A_MARK.y}
            size={PART_A_MARK.size}
          >
            {PART_A_MARK.text}
          </Label>
        </g>

        <g className="cabinet-svg-labels">
          <Label x={PART_F.x + PART_F_MARK.x} y={PART_F.y + PART_F_MARK.y} size={PART_F_MARK.size}>
            {PART_F_MARK.text}
          </Label>
          <Label x={PART_E.x + PART_E_MARK.x} y={PART_E.y + PART_E_MARK.y} size={PART_E_MARK.size}>
            {PART_E_MARK.text}
          </Label>
          <Label x={PART_D.x + PART_D_MARK.x} y={PART_D.y + PART_D_MARK.y} size={PART_D_MARK.size}>
            {PART_D_MARK.text}
          </Label>
        </g>
      </svg>
    </div>
  )
}
