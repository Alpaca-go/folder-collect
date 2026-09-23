import { CABINET_DEPTH, DRAWER_INSERT_Z, DRAWER_OPEN_Z } from './cabinetLayout'

/** Visible isometric depth in SVG units. */
export const DEPTH = 68

const Z_SCALE = DEPTH / CABINET_DEPTH
const ISO_X = 0.46
const ISO_Y = 0.58

export function iso(x: number, y: number, z: number) {
  const iz = z * Z_SCALE
  return { x: x - iz * ISO_X, y: y + iz * ISO_Y }
}

export function poly(points: Array<{ x: number; y: number }>) {
  return points.map((p) => `${p.x},${p.y}`).join(' ')
}

export function boxFaces(x: number, y: number, w: number, h: number, zFront: number, zBack: number) {
  const tl = (z: number) => iso(x, y, z)
  const tr = (z: number) => iso(x + w, y, z)
  const br = (z: number) => iso(x + w, y + h, z)
  const bl = (z: number) => iso(x, y + h, z)

  return {
    front: [tl(zFront), tr(zFront), br(zFront), bl(zFront)],
    back: [tl(zBack), tr(zBack), br(zBack), bl(zBack)],
    top: [tl(zFront), tr(zFront), tr(zBack), tl(zBack)],
    bottom: [bl(zFront), br(zFront), br(zBack), bl(zBack)],
    left: [tl(zFront), tl(zBack), bl(zBack), bl(zFront)],
    right: [tr(zFront), br(zFront), br(zBack), tr(zBack)],
  }
}

export function drawerGroupZ(open: boolean) {
  const z = open ? -DRAWER_OPEN_Z : -DRAWER_INSERT_Z
  return z * Z_SCALE
}

export function isoTranslate(z: number) {
  const p = iso(0, 0, z)
  return `translate(${p.x} ${p.y})`
}

export const SHAPE_STYLE = {
  fill: '#fff',
  stroke: '#000',
  strokeWidth: 1.5,
  vectorEffect: 'non-scaling-stroke' as const,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
}
