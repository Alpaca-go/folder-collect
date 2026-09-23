import CabinetInterior from './CabinetInterior'
import CabinetPart from './CabinetPart'
import { PART_B, PART_B_MARK } from './cabinetLayout'

interface CabinetDrawerGroupProps {
  open: boolean
}

export default function CabinetDrawerGroup({ open }: CabinetDrawerGroupProps) {
  return (
    <div className={`cabinet-drawer-motion${open ? ' cabinet-drawer-motion--open' : ''}`}>
      <CabinetInterior />
      <CabinetPart name="B" part={PART_B} mark={PART_B_MARK} />
    </div>
  )
}
