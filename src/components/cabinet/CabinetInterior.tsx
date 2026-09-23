import { DRAWER_WALL_HEIGHT, PART_C, toBoxStyle } from './cabinetLayout'

const WALL_PCT = (DRAWER_WALL_HEIGHT / PART_C.w) * 100

export default function CabinetInterior() {
  return (
    <div
      className="cabinet-interior"
      style={toBoxStyle(PART_C.x, PART_C.y, PART_C.w, PART_C.h)}
      aria-hidden="true"
    >
      <div className="cabinet-interior-floor" data-part="C">
        <span className="cabinet-interior-mark">C</span>
      </div>
      <div
        className="cabinet-interior-wall cabinet-interior-wall--left"
        data-part="C1"
        style={{ width: `${WALL_PCT}%` }}
      >
        <div className="cabinet-interior-wall-hinge">
          <div className="cabinet-interior-wall-face">
            <span className="cabinet-interior-mark">C1</span>
          </div>
        </div>
      </div>
      <div
        className="cabinet-interior-wall cabinet-interior-wall--right"
        data-part="C2"
        style={{ width: `${WALL_PCT}%` }}
      >
        <div className="cabinet-interior-wall-hinge">
          <div className="cabinet-interior-wall-face">
            <span className="cabinet-interior-mark">C2</span>
          </div>
        </div>
      </div>
    </div>
  )
}
