/**
 * Reveal order when the active folder returns to the stack.
 *
 * Example: Cara m. at index 4 (red box in mock)
 *   Above (bottom → top): Boo p.=1, Ben=2, Aeden p.=3, Alex m.=4
 *   Below (top → bottom): Diana l.=1, Evan t.=2, … Isaac w.=6
 *
 * Matching numbers on both sides share the same step (appear together).
 */
export function getRevealStep(index: number, activeIndex: number): number {
  if (index === activeIndex) return -1

  if (index < activeIndex) {
    // Above segment: nearest tab first, then outward toward the top
    return activeIndex - index - 1
  }

  // Below segment: nearest tab first, then outward toward the bottom
  return index - activeIndex - 1
}

export function getMaxRevealSteps(activeIndex: number, count: number): number {
  const aboveCount = activeIndex
  const belowCount = Math.max(0, count - activeIndex - 1)
  const maxDistance = Math.max(aboveCount, belowCount)

  return Math.max(0, maxDistance - 1)
}
