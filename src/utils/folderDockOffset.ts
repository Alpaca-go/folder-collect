/**
 * Dock offset for spread mode — matches profile-deck bottom lip (--profile-deck-peek).
 */

function profileDeckPeekPx(chUnit: number, viewportHeight: number): number {
  const min = chUnit * 14
  const mid = chUnit * 16 + viewportHeight * 0.0035
  const max = chUnit * 22
  return Math.min(max, Math.max(min, mid))
}

function readChUnit(scrollContainer: HTMLElement): number {
  const layout = scrollContainer.querySelector<HTMLElement>('.folder-files-layout')
  if (!layout) return 1
  const raw = getComputedStyle(layout).getPropertyValue('--ch-unit').trim()
  const ch = parseFloat(raw)
  return Number.isFinite(ch) && ch > 0 ? ch : 1
}

/** Visible folder lip above the page bottom (px). */
export function folderDockVisibleLipPx(scrollContainer: HTMLElement): number {
  const chUnit = readChUnit(scrollContainer)
  const peek = profileDeckPeekPx(chUnit, window.innerHeight)
  const lift = chUnit * 3.5
  const sink = peek * 0.05 + chUnit * 0.5
  return peek + lift - sink
}

/** Move folder down so only the dock lip peeks above `scrollContainer` bottom edge. */
export function folderOffsetToDockPeek(
  scrollContainer: HTMLElement,
  folderEl: HTMLElement,
): number {
  const containerRect = scrollContainer.getBoundingClientRect()
  const folderRect = folderEl.getBoundingClientRect()
  const padBottom = parseFloat(getComputedStyle(scrollContainer).paddingBottom) || 0
  /** Content bottom — above safe-area padding; lip sits on this line like profile deck. */
  const pageBottom = containerRect.bottom - padBottom
  const deckLip = folderDockVisibleLipPx(scrollContainer)
  /** Tab + front panel visible above the page bottom (tune with height ratio). */
  const visibleLip = Math.max(deckLip * 1.35, folderRect.height * 0.3)
  const targetTop = pageBottom - visibleLip
  return targetTop - folderRect.top
}
