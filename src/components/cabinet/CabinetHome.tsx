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
  /** Sync cabinet.css --profile-deck-move-duration */
  const PROFILE_DECK_EXIT_UNMOUNT_MS = 560
  const showProfileDeck =
    PROFILE_DECK_VISIBLE &&
    !cabinetExiting &&
    !folderExitActive &&
    !cabinetStageHidden &&
    !foldersMorphing

  const [profileDeckDocked, setProfileDeckDocked] = useState(true)
  const [profileDeckExiting, setProfileDeckExiting] = useState(false)
  /** Keep overlay mounted while the door is open — unmounting flashes the cabinet on mobile GPUs. */
  const [profileDeckDismissed, setProfileDeckDismissed] = useState(false)
  const [profileDeckHomeIntroKey, setProfileDeckHomeIntroKey] = useState(1)
  /** Door closed: snap to dock peek off-screen, then rotate in (no slide-up). */
  const [profileDeckDockHomeSnap, setProfileDeckDockHomeSnap] = useState(false)
  const profileDeckDismissedByDoorRef = useRef(false)

  useEffect(() => {
    if (!showProfileDeck) {
      setProfileDeckExiting(false)
      setProfileDeckDismissed(false)
      setProfileDeckDockHomeSnap(false)
      setProfileDeckHomeIntroKey(1)
      profileDeckDismissedByDoorRef.current = false
      return
    }
    setProfileDeckDocked(true)
  }, [showProfileDeck])

  useEffect(() => {
    if (!profileDeckExiting) return
    const dismiss = () => {
      setProfileDeckDismissed(true)
      setProfileDeckExiting(false)
    }
    const timer = window.setTimeout(dismiss, PROFILE_DECK_EXIT_UNMOUNT_MS)
    return () => window.clearTimeout(timer)
  }, [profileDeckExiting])

  const handleCabinetDoorChange = useCallback(
    (willOpen: boolean) => {
      if (!willOpen) return
      if (
        showProfileDeck &&
        !profileDeckDismissed &&
        !profileDeckExiting
      ) {
        profileDeckDismissedByDoorRef.current = true
        setProfileDeckExiting(true)
      }
    },
    [profileDeckDismissed, profileDeckExiting, showProfileDeck],
  )

  const handleCabinetDoorFullyClosed = useCallback(() => {
    if (!profileDeckDismissedByDoorRef.current || !showProfileDeck) return

    profileDeckDismissedByDoorRef.current = false
    setProfileDeckExiting(false)
    setProfileDeckDocked(true)
    setProfileDeckDockHomeSnap(true)
    setProfileDeckHomeIntroKey((key) => key + 1)
    requestAnimationFrame(() => {
      setProfileDeckDismissed(false)
      requestAnimationFrame(() => {
        setProfileDeckDockHomeSnap(false)
      })
    })
  }, [showProfileDeck])

  return (
    <div
      className={`cabinet-home relative h-full min-h-0 w-full flex-1${cabinetExiting || foldersMorphing ? ' cabinet-home--exiting' : ''}${folderExitActive ? ' cabinet-home--folder-exit' : ''}${showProfileDeck ? ' cabinet-home--profile-deck' : ''}${profileDeckDocked ? ' cabinet-home--profile-deck-docked' : ''}`}
    >
      <div className="app-cabinet-backdrop" aria-hidden>
        <img src={cabinetBackgroundUrl} alt="" draggable={false} />
      </div>

      <CabinetHomeHero />

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

      {showProfileDeck && (
        <div
          className={`profile-deck-overlay${profileDeckDocked ? ' profile-deck-overlay--docked' : ''}${profileDeckExiting ? ' profile-deck-overlay--exiting' : ''}${profileDeckDismissed ? ' profile-deck-overlay--dismissed' : ''}${profileDeckDockHomeSnap ? ' profile-deck-overlay--dock-home-snap' : ''}`}
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
            homeIntroKey={profileDeckHomeIntroKey}
            onUndock={() => setProfileDeckDocked(false)}
          />
        </div>
      )}
    </div>
  )
}
