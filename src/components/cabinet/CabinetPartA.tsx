import {
  PART_A,
  PART_A_HANDLE,
  PART_A_MARK,
  PART_A_SLOT,
  PART_A_TITLE,
} from './cabinetLayout'

const toAInnerStyle = (x: number, y: number, w: number, h: number) => ({
  left: `${(x / PART_A.w) * 100}%`,
  top: `${(y / PART_A.h) * 100}%`,
  width: `${(w / PART_A.w) * 100}%`,
  height: `${(h / PART_A.h) * 100}%`,
})

export default function CabinetPartA() {
  return (
    <div className="cabinet-part-a" data-part="A" aria-hidden="true">
      <span
        className="cabinet-part-a-slot"
        style={toAInnerStyle(PART_A_SLOT.x, PART_A_SLOT.y, PART_A_SLOT.w, PART_A_SLOT.h)}
        aria-hidden="true"
      />
      <span
        className="cabinet-part-a-handle"
        style={toAInnerStyle(
          PART_A_HANDLE.x,
          PART_A_HANDLE.y,
          PART_A_HANDLE.w,
          PART_A_HANDLE.h,
        )}
        aria-hidden="true"
      >
        <span className="cabinet-part-a-title">{PART_A_TITLE.text}</span>
      </span>
      <span
        className="cabinet-part-a-mark"
        style={{
          left: `${(PART_A_MARK.x / PART_A.w) * 100}%`,
          top: `${(PART_A_MARK.y / PART_A.h) * 100}%`,
        }}
        aria-hidden="true"
      >
        {PART_A_MARK.text}
      </span>
    </div>
  )
}
