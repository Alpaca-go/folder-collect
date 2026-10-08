import { useCallback, useEffect, useState } from 'react'
import PhoneFrame from './components/PhoneFrame'
import CabinetHome from './components/cabinet/CabinetHome'
import DrawerFolderMorphOverlay from './components/cabinet/DrawerFolderMorphOverlay'
import { contacts } from './data/contacts'
import {
  folderLayoutsFromRects,
  MORPH_FOLDER_COUNT,
  type FolderLayoutSnapshot,
} from './utils/folderMorph'

type FolderExitPhase = 'cabinet-exit' | 'morph'

interface FolderExitSession {
  names: string[]
  phase: FolderExitPhase
  fromTargets: FolderLayoutSnapshot[]
}

const TAIL_REVEAL_INTERVAL_MS = 14
const TAIL_REVEAL_BATCH = 2

export default function App() {
  const [inFilesView, setInFilesView] = useState(false)
  const [folderExit, setFolderExit] = useState<FolderExitSession | null>(null)
  const [listRevealCount, setListRevealCount] = useState<number | null>(null)

  const handleOpenFiles = useCallback(() => {
    setFolderExit(null)
    setListRevealCount(null)
    setInFilesView(true)
  }, [])

  const handleFolderClick = useCallback(
    (_index: number, rects: DOMRect[], names: string[]) => {
      setListRevealCount(null)
      const fromTargets = folderLayoutsFromRects(rects, MORPH_FOLDER_COUNT)
      if (fromTargets.length !== MORPH_FOLDER_COUNT) return

      setFolderExit({
        names,
        phase: 'cabinet-exit',
        fromTargets,
      })
    },
    [],
  )

  const handleCabinetExitComplete = useCallback(() => {
    setListRevealCount(MORPH_FOLDER_COUNT + TAIL_REVEAL_BATCH)
    setFolderExit((prev) =>
      prev?.fromTargets.length ? { ...prev, phase: 'morph' } : null,
    )
  }, [])

  const handleMorphComplete = useCallback(() => {
    setInFilesView(true)
    setFolderExit(null)
  }, [])

  const handleBackToCabinet = useCallback(() => {
    setFolderExit(null)
    setListRevealCount(null)
    setInFilesView(false)
  }, [])

  useEffect(() => {
    if (listRevealCount === null || listRevealCount >= contacts.length) return

    const timer = window.setTimeout(() => {
      setListRevealCount((count) => {
        if (count === null) return null
        return Math.min(contacts.length, count + TAIL_REVEAL_BATCH)
      })
    }, TAIL_REVEAL_INTERVAL_MS)

    return () => window.clearTimeout(timer)
  }, [listRevealCount])

  const isMorphing = folderExit?.phase === 'morph'
  const folderExitActive = Boolean(folderExit)
  const showCabinet = !inFilesView
  const showFilesLayer = inFilesView
  const showMorphOverlay = Boolean(folderExit?.fromTargets.length)
  const listRevealActive =
    listRevealCount !== null && listRevealCount < contacts.length

  return (
    <div className="app-shell">
      {showCabinet && (
        <div className="app-view-layer">
          <CabinetHome
            onOpenFiles={handleOpenFiles}
            onFolderClick={handleFolderClick}
            cabinetExiting={folderExit?.phase === 'cabinet-exit'}
            cabinetRasterHidden={folderExitActive}
            foldersMorphing={folderExitActive}
            drawerFoldersHidden={showMorphOverlay}
            onCabinetExitComplete={handleCabinetExitComplete}
            cabinetStageHidden={folderExit?.phase === 'morph'}
          />
          {folderExitActive && (
            <div className="folder-stack-measure" aria-hidden="true">
              <PhoneFrame onBack={() => {}} measureOnly />
            </div>
          )}
        </div>
      )}

      {showFilesLayer && (
        <div className="app-view-layer">
          <PhoneFrame
            onBack={handleBackToCabinet}
            listRevealCount={listRevealCount}
            listRevealActive={listRevealActive}
          />
        </div>
      )}

      {showMorphOverlay && folderExit && (
        <DrawerFolderMorphOverlay
          fromTargets={folderExit.fromTargets}
          names={folderExit.names}
          stackMeasureActive={folderExitActive}
          gatherActive={folderExitActive}
          stackMorphReady={isMorphing}
          onComplete={handleMorphComplete}
        />
      )}
    </div>
  )
}
