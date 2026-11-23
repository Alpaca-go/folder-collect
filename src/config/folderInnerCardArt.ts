import { designPx, innerCardSize } from './folderDesign'

import jiuzhou01 from '../assets/jiuzhou aesthetic-folder cards/jiuzhou aesthetic-folder cards-01.png'
import jiuzhou02 from '../assets/jiuzhou aesthetic-folder cards/jiuzhou aesthetic-folder cards-02.png'
import jiuzhou03 from '../assets/jiuzhou aesthetic-folder cards/jiuzhou aesthetic-folder cards-03.png'
import jiuzhou04 from '../assets/jiuzhou aesthetic-folder cards/jiuzhou aesthetic-folder cards-04.png'
import jiuzhou05 from '../assets/jiuzhou aesthetic-folder cards/jiuzhou aesthetic-folder cards-05.png'
import jiuzhou06 from '../assets/jiuzhou aesthetic-folder cards/jiuzhou aesthetic-folder cards-06.png'
import jiuzhou07 from '../assets/jiuzhou aesthetic-folder cards/jiuzhou aesthetic-folder cards-07.png'
import jiuzhou08 from '../assets/jiuzhou aesthetic-folder cards/jiuzhou aesthetic-folder cards-08.png'
import jiuzhou09 from '../assets/jiuzhou aesthetic-folder cards/jiuzhou aesthetic-folder cards-09.png'

export interface InnerPocketCardArt {
  src: string
  naturalWidth: number
  naturalHeight: number
}

const JIUZHOU_BY_ASSET_NUMBER: InnerPocketCardArt[] = [
  { src: jiuzhou01, naturalWidth: 991, naturalHeight: 1385 },
  { src: jiuzhou02, naturalWidth: 966, naturalHeight: 1320 },
  { src: jiuzhou03, naturalWidth: 936, naturalHeight: 1240 },
  { src: jiuzhou04, naturalWidth: 1028, naturalHeight: 1281 },
  { src: jiuzhou05, naturalWidth: 957, naturalHeight: 1277 },
  { src: jiuzhou06, naturalWidth: 984, naturalHeight: 1180 },
  { src: jiuzhou07, naturalWidth: 1000, naturalHeight: 1227 },
  { src: jiuzhou08, naturalWidth: 990, naturalHeight: 1227 },
  { src: jiuzhou09, naturalWidth: 920, naturalHeight: 1227 },
]

/**
 * First stack folder (`Alex m.`): pocket index 8 = top = asset -01, index 0 = back = asset -09.
 * Index-aligned with `INNER_CARDS`.
 */
export const FIRST_FOLDER_INNER_POCKET_ART: readonly InnerPocketCardArt[] =
  [...JIUZHOU_BY_ASSET_NUMBER].reverse()

export function innerPocketCardSize(
  scale: number,
  art: Pick<InnerPocketCardArt, 'naturalWidth' | 'naturalHeight'>,
): { width: number; height: number } {
  const { width } = innerCardSize(scale)
  return { width, height: width * (art.naturalHeight / art.naturalWidth) }
}

/** Alpha-following shadow for PNG art (`filter: drop-shadow`, not rectangular `box-shadow`). */
export function innerPocketArtDropShadow(scale: number) {
  const y = designPx(3, scale)
  const blur = designPx(2.5, scale)
  return `drop-shadow(0 ${y}px ${blur}px rgba(0, 0, 0, 0.2))`
}