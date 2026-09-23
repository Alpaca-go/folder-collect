import { CABINET_VIEW, toBoxStyle, type CabinetMark, type CabinetRect } from './cabinetLayout'

interface CabinetPartProps {
  name: string
  part: CabinetRect
  mark: CabinetMark
}

export default function CabinetPart({ name, part, mark }: CabinetPartProps) {
  return (
    <div
      className="cabinet-part"
      data-part={name}
      style={toBoxStyle(part.x, part.y, part.w, part.h)}
      aria-hidden="true"
    >
      <div className="cabinet-part-hinge">
        <div className="cabinet-part-face">
          <span
            className="cabinet-part-mark"
            style={{
              left: `${(mark.x / part.w) * 100}%`,
              top: `${(mark.y / part.h) * 100}%`,
              fontSize: `calc(var(--diagram-w) * ${mark.size} / ${CABINET_VIEW.w})`,
            }}
          >
            {mark.text}
          </span>
        </div>
      </div>
    </div>
  )
}
