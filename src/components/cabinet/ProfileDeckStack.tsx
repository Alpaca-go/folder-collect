import { useEffect, useRef, useState, type CSSProperties } from 'react'
import folderBottomUrl from '../../assets/folder-bottom.png'
import innerCard01Url from '../../assets/inner-card-01.png'
import innerCard02Url from '../../assets/inner-card-02.png'
import folderFaceUrl from '../../assets/folder-face.png'
import {
  PROFILE_DECK_FOLDER_BOTTOM_ORIGIN,
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

const LAYER_TILT_MINUS_2 = new Set<(typeof PROFILE_DECK_LAYER_ORDER)[number]>(['folderBottom'])

const LAYER_TILT_MINUS_1 = new Set<(typeof PROFILE_DECK_LAYER_ORDER)[number]>(['innerCard01'])

const LAYER_TILT_PLUS_1 = new Set<(typeof PROFILE_DECK_LAYER_ORDER)[number]>(['innerCard02'])

function layerCssVars(rect: ProfileDeckLayerRect): CSSProperties {
  return {
    '--layer-x': String(rect.x),
    '--layer-y': String(rect.y),
    '--layer-w': String(rect.w),
    '--layer-h': String(rect.h),
  } as CSSProperties
}

const INNER_CARD_KEYS = new Set<(typeof PROFILE_DECK_LAYER_ORDER)[number]>([
  'innerCard01',
  'innerCard02',
])

/** Snap shut, then pause, then dive — sync with cabinet.css face-close vars. */
const PROFILE_DECK_FACE_CLOSE_DURATION_MS = 300
const PROFILE_DECK_FACE_CLOSE_PAUSE_MS = 280
const PROFILE_DECK_FACE_CLOSE_BEFORE_DOCK_MS =
  PROFILE_DECK_FACE_CLOSE_DURATION_MS + PROFILE_DECK_FACE_CLOSE_PAUSE_MS

interface ProfileDeckStackProps {
  docked?: boolean
  onUndock?: () => void
}

export default function ProfileDeckStack({ docked = false, onUndock }: ProfileDeckStackProps) {
  const { w: docW, h: docH } = PROFILE_DECK_PSD_DOC
  const [folderFaceOpen, setFolderFaceOpen] = useState(!docked)
  const [motionDocked, setMotionDocked] = useState(docked)
  const [faceClosingForDock, setFaceClosingForDock] = useState(false)
  const prevDockedRef = useRef(docked)

  useEffect(() => {
    const wasDocked = prevDockedRef.current
    prevDockedRef.current = docked

    if (!docked) {
      setMotionDocked(false)
      setFolderFaceOpen(true)
      setFaceClosingForDock(false)
      return
    }

    setFolderFaceOpen(false)

    if (!wasDocked) {
      setFaceClosingForDock(true)
      setMotionDocked(false)
      const id = window.setTimeout(() => {
        setMotionDocked(true)
        setFaceClosingForDock(false)
      }, PROFILE_DECK_FACE_CLOSE_BEFORE_DOCK_MS)
      return () => window.clearTimeout(id)
    }

    setMotionDocked(true)
    setFaceClosingForDock(false)
  }, [docked])

  return (
    <div
      className="profile-deck-wrap"
      style={
        {
          '--psd-doc-w': String(docW),
          '--psd-doc-h': String(docH),
          '--profile-deck-rotate-origin-x': `${PROFILE_DECK_FOLDER_BOTTOM_ORIGIN.xPct}%`,
          '--profile-deck-rotate-origin-y': `${PROFILE_DECK_FOLDER_BOTTOM_ORIGIN.yPct}%`,
        } as CSSProperties
      }
      aria-hidden={!docked}
    >
      <div
        className={`profile-deck-motion${motionDocked ? ' profile-deck-motion--docked' : ''}`}
      >
        <div
          className={`profile-deck-stage${motionDocked ? ' profile-deck-stage--docked' : ''}${folderFaceOpen ? ' profile-deck-stage--folder-face-open' : ''}${faceClosingForDock ? ' profile-deck-stage--folder-face-closing' : ''}`}
          onPointerDown={(event) => {
            if (!motionDocked) event.stopPropagation()
          }}
        >
          {PROFILE_DECK_LAYER_ORDER.map((key, index) => {
            const isInnerCard = INNER_CARD_KEYS.has(key)
            const layerStyle = {
              ...layerCssVars(PROFILE_DECK_LAYERS[key]),
              zIndex: index + 1,
            }

            if (key === 'folderFace') {
              return (
                <div
                  key={key}
                  className="profile-deck-layer profile-deck-layer--tilt-minus-2 profile-deck-layer--folder-face-slot"
                  style={layerStyle}
                >
                  <img
                    src={LAYER_SRC.folderFace}
                    alt=""
                    draggable={false}
                    className={`profile-deck-layer__raster profile-deck-layer--folder-face${folderFaceOpen ? ' profile-deck-layer--folder-face--open' : ''}`}
                  />
                </div>
              )
            }

            return (
              <img
                key={key}
                src={LAYER_SRC[key]}
                alt=""
                draggable={false}
                className={`profile-deck-layer${LAYER_TILT_MINUS_2.has(key) ? ' profile-deck-layer--tilt-minus-2' : ''}${LAYER_TILT_MINUS_1.has(key) ? ' profile-deck-layer--tilt-minus-1' : ''}${LAYER_TILT_PLUS_1.has(key) ? ' profile-deck-layer--tilt-plus-1' : ''}${isInnerCard ? ' profile-deck-layer--inner-card' : ''}`}
                style={layerStyle}
                role={motionDocked && isInnerCard ? 'button' : undefined}
                tabIndex={motionDocked && isInnerCard ? 0 : undefined}
                aria-label={motionDocked && isInnerCard ? 'Expand profile folder' : undefined}
                onClick={() => {
                  if (motionDocked && isInnerCard) onUndock?.()
                }}
                onKeyDown={(event) => {
                  if (!motionDocked || !isInnerCard) return
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onUndock?.()
                  }
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
