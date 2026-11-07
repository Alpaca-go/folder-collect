import type { CSSProperties } from 'react'
import folderBottomUrl from '../../assets/folder-bottom.png'
import innerCard01Url from '../../assets/inner-card-01.png'
import innerCard02Url from '../../assets/inner-card-02.png'
import folderFaceUrl from '../../assets/folder-face.png'
import {
  PROFILE_DECK_LAYER_ORDER,
  PROFILE_DECK_LAYERS,
  PROFILE_DECK_PSD_DOC,
  type ProfileDeckLayerRect,
} from '../../config/profileDeckImageLayout'

const LAYER_SRC: Record<(typeof PROFILE_DECK_LAYER_ORDER)[number], string> = {
  folderBottom: folderBottomUrl,
  innerCard02: innerCard02Url,
  innerCard01: innerCard01Url,
  folderFace: folderFaceUrl,
}

function layerCssVars(rect: ProfileDeckLayerRect): CSSProperties {
  return {
    '--layer-x': String(rect.x),
    '--layer-y': String(rect.y),
    '--layer-w': String(rect.w),
    '--layer-h': String(rect.h),
  } as CSSProperties
}

export default function ProfileDeckStack() {
  const { w: docW, h: docH } = PROFILE_DECK_PSD_DOC

  return (
    <div
      className="profile-deck-wrap"
      style={
        {
          '--psd-doc-w': String(docW),
          '--psd-doc-h': String(docH),
        } as CSSProperties
      }
      aria-hidden
    >
      <div className="profile-deck-stage">
        {PROFILE_DECK_LAYER_ORDER.map((key, index) => (
          <img
            key={key}
            src={LAYER_SRC[key]}
            alt=""
            draggable={false}
            className="profile-deck-layer"
            style={{
              ...layerCssVars(PROFILE_DECK_LAYERS[key]),
              zIndex: index + 1,
            }}
          />
        ))}
      </div>
    </div>
  )
}
