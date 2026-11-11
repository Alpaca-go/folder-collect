import { INNER_POCKET_CARD_COUNT } from '../config/folderDesign'

export type ScreenPocketPin = {
  /** Aligned clone nodes — append to `document.body`. */
  nodes: HTMLElement[]
}

function alignAndCloneCard(el: HTMLElement, tempHost: HTMLElement, zIndex: number): HTMLElement {
  const target = el.getBoundingClientRect()
  const computed = getComputedStyle(el)
  const clone = el.cloneNode(true) as HTMLElement

  let left = target.left
  let top = target.top

  const applyPose = (l: number, t: number) => {
    clone.style.position = 'fixed'
    clone.style.margin = '0'
    clone.style.inset = 'auto'
    clone.style.bottom = 'auto'
    clone.style.right = 'auto'
    clone.style.left = `${l}px`
    clone.style.top = `${t}px`
    clone.style.width = `${el.offsetWidth}px`
    clone.style.height = `${el.offsetHeight}px`
    clone.style.boxSizing = 'border-box'
    clone.style.transform = computed.transform
    clone.style.transformOrigin = computed.transformOrigin
    clone.style.pointerEvents = 'none'
    clone.style.zIndex = String(zIndex)
  }

  tempHost.appendChild(clone)
  for (let pass = 0; pass < 8; pass++) {
    applyPose(left, top)
    const painted = clone.getBoundingClientRect()
    left += target.left - painted.left
    top += target.top - painted.top
  }
  applyPose(left, top)
  tempHost.removeChild(clone)

  clone.setAttribute('data-pinned-pocket-card', '1')
  return clone
}

export function measureScreenPocketPin(folderEl: HTMLElement): ScreenPocketPin | null {
  const cards = [...folderEl.querySelectorAll<HTMLElement>('[data-inner-pocket-card]')]
  if (cards.length < INNER_POCKET_CARD_COUNT) return null

  void folderEl.offsetHeight

  const tempHost = document.createElement('div')
  tempHost.setAttribute('aria-hidden', 'true')
  tempHost.style.cssText = 'position:fixed;inset:0;pointer-events:none;visibility:hidden;'
  document.body.appendChild(tempHost)

  try {
    const nodes = cards.map((el, i) => alignAndCloneCard(el, tempHost, 56 + i))
    return { nodes }
  } finally {
    tempHost.remove()
  }
}

export function mountPinnedPocketNodes(nodes: HTMLElement[]) {
  nodes.forEach((node) => {
    if (node.parentNode !== document.body) {
      document.body.appendChild(node)
    }
  })
}

export function releasePinnedPocketNodes(nodes: HTMLElement[] | null) {
  nodes?.forEach((node) => {
    node.remove()
  })
}
