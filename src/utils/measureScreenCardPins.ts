import {
  pocketCardVisualBoxSize,
  rotationDegFromTransform,
  type ScreenFixedPose,
} from './pocketCardGeometry'

/**
 * Pocket cards rotate around `0% 100%`; portaled spread uses `50% 50%`.
 * Bounding-box top-left is not interchangeable — iterate to match painted pixels.
 */
export function screenFixedPoseFromPocketCard(
  el: HTMLElement,
  transformOrigin = '50% 50%',
): ScreenFixedPose {
  const target = el.getBoundingClientRect()
  const rotate = rotationDegFromTransform(getComputedStyle(el).transform)
  const { width, height } = pocketCardVisualBoxSize(el)

  const tempHost = document.createElement('div')
  tempHost.setAttribute('aria-hidden', 'true')
  tempHost.style.cssText = 'position:fixed;inset:0;pointer-events:none;visibility:hidden;'
  document.body.appendChild(tempHost)

  const probe = document.createElement('div')
  probe.style.boxSizing = 'border-box'
  tempHost.appendChild(probe)

  let left = target.left
  let top = target.top

  const apply = () => {
    probe.style.position = 'fixed'
    probe.style.margin = '0'
    probe.style.left = `${left}px`
    probe.style.top = `${top}px`
    probe.style.width = `${width}px`
    probe.style.height = `${height}px`
    probe.style.transformOrigin = transformOrigin
    probe.style.transform = rotate !== 0 ? `rotate(${rotate}deg)` : 'none'
  }

  try {
    for (let pass = 0; pass < 8; pass++) {
      apply()
      const painted = probe.getBoundingClientRect()
      left += target.left - painted.left
      top += target.top - painted.top
    }
    return { left, top, rotate, width, height }
  } finally {
    tempHost.remove()
  }
}
