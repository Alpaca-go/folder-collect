import { useCallback, useEffect, useRef, useState } from 'react'
import cabinetBackgroundUrl from '../../assets/cabinet-background.png'
import CabinetBox from './CabinetBox'
import CabinetHomeHero from './CabinetHomeHero'
import ProfileDeckStack from './ProfileDeckStack'

interface CabinetHomeProps {
  onOpenFiles: () => void
  onFolderClick?: (index: number, rects: DOMRect[], names: string[]) => void
  cabinetExiting?: boolean
  cabinetRasterHidden?: boolean
  foldersMorphing?: boolean
  drawerFoldersHidden?: boolean
  onCabinetExitComplete?: () => void
  cabinetStageHidden?: boolean
  /** Folder exit morph: keep hero visible above overlay until stack page. */
  folderExitActive?: boolean
}

export default function CabinetHome({
  onOpenFiles,
  onFolderClick,
  cabinetExiting,
  cabinetRasterHidden,
  foldersMorphing,
  drawerFoldersHidden,
  onCabinetExitComplete,
  cabinetStageHidden = false,
  folderExitActive = false,
}: CabinetHomeProps) {
  /** Profile folder deck overlay on top of the home page. */
  const PROFILE_DECK_VISIBLE = true
  const showProfileDeck =
    PROFILE_DECK_VISIBLE &&
    !cabinetExiting &&
    !folderExitActive &&
    !cabinetStageHidden &&
    !foldersMorphing

  const [profileDeckDocked, setProfileDeckDocked] = useState(true)
  const [profileDeckExiting, setProfileDeckExiting] = useState(false)
  const [profileDeckHidden, setProfileDeckHidden] = useState(false)
  const [profileDeckEntering, setProfileDeckEntering] = useState(false)
  const profileDeckDismissedByDoorRef = useRef(false)

  const showProfileDeckOverlay =
    showProfileDeck && !profileDeckHidden

  useEffect(() => {
    if (!showProfileDeck) {
      setProfileDeckExiting(false)
      setProfileDeckHidden(false)
      setProfileDeckEntering(false)
      profileDeckDismissedByDoorRef.current = false
      return
    }
    setProfileDeckDocked(true)
  }, [showProfileDeck])

  useEffect(() => {
    if (!profileDeckExiting) return
    const timer = window.setTimeout(() => setProfileDeckHidden(true), 600)
    return () => window.clearTimeout(timer)
  }, [profileDeckExiting])

  const handleCabinetDoorChange = useCallback(
    (willOpen: boolean) => {
      if (!willOpen) return
      if (
        showProfileDeck &&
        !profileDeckHidden &&
        !profileDeckExiting
      ) {
        profileDeckDismissedByDoorRef.current = true
        setProfileDeckExiting(true)
      }
    },
    [profileDeckExiting, profileDeckHidden, showProfileDeck],
  )

  const handleCabinetDoorFullyClosed = useCallback(() => {
    if (!profileDeckDismissedByDoorRef.current || !showProfileDeck) return

    profileDeckDismissedByDoorRef.current = false
    setProfileDeckHidden(false)
    setProfileDeckExiting(false)
    setProfileDeckDocked(true)
    setProfileDeckEntering(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setProfileDeckEntering(false))
    })
  }, [showProfileDeck])

  return (
    <div
      className={`cabinet-home relative h-full min-h-0 w-full flex-1${cabinetExiting || foldersMorphing ? ' cabinet-home--exiting' : ''}${folderExitActive ? ' cabinet-home--folder-exit' : ''}${showProfileDeckOverlay ? ' cabinet-home--profile-deck' : ''}${profileDeckDocked ? ' cabinet-home--profile-deck-docked' : ''}${profileDeckEntering ? ' cabinet-home--profile-deck-entering' : ''}`}
    >
      <div className="app-cabinet-backdrop" aria-hidden>
        <img src={cabinetBackgroundUrl} alt="" draggable={false} />
      </div>

      <CabinetHomeHero />

      {!showProfileDeck && <div className="cabinet-home-veil" aria-hidden />}

      <div
        className={`cabinet-home-stage min-h-0${cabinetStageHidden ? ' cabinet-home-stage--hidden' : ''}`}
      >
        <CabinetBox
          onOpenFiles={onOpenFiles}
          onFolderClick={onFolderClick}
          cabinetExiting={cabinetExiting}
          cabinetRasterHidden={cabinetRasterHidden}
          foldersMorphing={foldersMorphing}
          drawerFoldersHidden={drawerFoldersHidden}
          onCabinetExitComplete={onCabinetExitComplete}
          onCabinetDoorChange={handleCabinetDoorChange}
          onCabinetDoorFullyClosed={handleCabinetDoorFullyClosed}
        />
      </div>

      {showProfileDeckOverlay && (
        <div
          className={`profile-deck-overlay${profileDeckDocked ? ' profile-deck-overlay--docked' : ''}${profileDeckExiting ? ' profile-deck-overlay--exiting' : ''}${profileDeckEntering ? ' profile-deck-overlay--entering' : ''}`}
        >
          <div className="profile-deck-veil" aria-hidden />
          {!profileDeckDocked && !profileDeckExiting && (
            <button
              type="button"
              className="profile-deck-outside-hit"
              aria-label="Put profile folder away"
              onClick={() => setProfileDeckDocked(true)}
            />
          )}
          <ProfileDeckStack
            docked={profileDeckDocked}
            onUndock={() => setProfileDeckDocked(false)}
          />
        </div>
      )}
    </div>
  )
}
