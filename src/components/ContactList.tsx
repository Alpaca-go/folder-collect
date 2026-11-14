import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { contacts } from '../data/contacts'
import { type FolderMode } from './FolderCard'
import StackFolderItem from './StackFolderItem'
import { useElasticFolderStack } from '../hooks/useElasticFolderStack'
import { getMaxRevealSteps, getRevealStep } from '../utils/folderRevealOrder'
import { FOLDER_ASPECT_RATIO } from '../config/folderImageLayout'
import { folderOffsetToDockPeek } from '../utils/folderDockOffset'
import { MORPH_FOLDER_COUNT } from '../utils/folderMorph'
import {
  generateSpreadCardLayouts,
  hashFolderSeed,
  type SpreadCardLayout,
} from '../utils/innerCardSpread'
import {
  FLAP_CLOSE_SETTLE_MS,
  INNER_POCKET_CARD_COUNT,
  SPREAD_PROMOTE,
  innerCardPocketFlapStartMs,
} from '../config/folderDesign'
import { spreadClusterOriginFromHost } from '../utils/pocketCardGeometry'
import CabinetHomeHero from './cabinet/CabinetHomeHero'
import BackToCabinetButton from './cabinet/BackToCabinetButton'

const FOLD_DURATION_MS = innerCardPocketFlapStartMs() + FLAP_CLOSE_SETTLE_MS
const RETURN_DURATION_MS = 560
/** How early (ms) stack siblings may start revealing before return spring ends. */
const REVEAL_OVERLAP_MS = 48
const REVEAL_DURATION_MS = 420
const REVEAL_STAGGER_MS = 52
const TAIL_ENTER_BATCH = 2

type ClosePhase = 'folding' | 'returning' | 'revealing' | null

type SpreadTimelinePhase = 'hold' | 'gather' | 'settled' | 'retract'

interface ContactListProps {
  onBack: () => void
  stackHidden?: boolean
  contentHidden?: boolean
  measureOnly?: boolean
  morphCoverActive?: boolean
  listRevealCount?: number | null
  listRevealActive?: boolean
  compactHeader?: boolean
  /** After drawer morph: show home hero instead of “contact files” title. */
  showHomeHero?: boolean
}

export default function ContactList({
  onBack,
  stackHidden = false,
  contentHidden = false,
  measureOnly = false,
  morphCoverActive = false,
  listRevealCount = null,
  listRevealActive = false,
  compactHeader = false,
  showHomeHero = false,
}: ContactListProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  /** Drives close animation after activeId clears so scroll/taps unlock while the folder animates shut. */
  const [closingId, setClosingId] = useState<string | null>(null)
  const [centerOffsetY, setCenterOffsetY] = useState(0)
  const [closePhase, setClosePhase] = useState<ClosePhase>(null)
  /** Second tap: dock folder while pocket cards stay fixed on screen. */
  const [folderDocked, setFolderDocked] = useState(false)
  const [spreadPhase, setSpreadPhase] = useState<SpreadTimelinePhase | null>(null)
  const [spreadLayouts, setSpreadLayouts] = useState<SpreadCardLayout[] | null>(null)
  const [spreadOrigin, setSpreadOrigin] = useState<{ x: number; y: number } | null>(null)
  const [dockPinBaselineY, setDockPinBaselineY] = useState<number | null>(null)
  const viewHostRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLElement>(null)
  const closeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const spreadTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const dockSinkRef = useRef(0)

  const blockPageScroll = Boolean(activeId)
  const elasticEnabled = !measureOnly && !activeId && !listRevealActive
  const stackContacts = measureOnly ? contacts.slice(0, MORPH_FOLDER_COUNT) : contacts

  const {
    elasticOffsets,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    suppressNextClick,
  } = useElasticFolderStack({
    containerRef: scrollRef,
    itemCount: stackContacts.length,
    enabled: elasticEnabled,
  })

  const clearCloseTimers = () => {
    closeTimersRef.current.forEach(clearTimeout)
    closeTimersRef.current = []
  }

  const clearSpreadTimers = () => {
    spreadTimersRef.current.forEach(clearTimeout)
    spreadTimersRef.current = []
  }

  useEffect(
    () => () => {
      clearCloseTimers()
      clearSpreadTimers()
    },
    [],
  )

  const resetDockState = () => {
    clearSpreadTimers()
    setSpreadPhase(null)
    setSpreadLayouts(null)
    setSpreadOrigin(null)
    setFolderDocked(false)
    setDockPinBaselineY(null)
  }

  const scheduleSpreadPromote = () => {
    clearSpreadTimers()
    /** Keep `hold`: pocket cards stay in mask + viewport pin (gather fixed layer hides them). */
  }

  const beginStackCloseSequence = (contactId: string) => {
    const activeIndex = contacts.findIndex((contact) => contact.id === contactId)
    const maxRevealSteps = activeIndex >= 0 ? getMaxRevealSteps(activeIndex, contacts.length) : 0
    const totalRevealMs = REVEAL_DURATION_MS + maxRevealSteps * REVEAL_STAGGER_MS
    const returnStartMs = FOLD_DURATION_MS
    const returnEndMs = returnStartMs + RETURN_DURATION_MS
    const revealStartMs = returnEndMs - REVEAL_OVERLAP_MS

    resetDockState()
    dockSinkRef.current = 0
    setClosingId(contactId)
    setActiveId(null)
    setClosePhase('folding')

    closeTimersRef.current.push(
      window.setTimeout(() => {
        setCenterOffsetY(0)
        setClosePhase('returning')
      }, returnStartMs),
    )

    closeTimersRef.current.push(
      window.setTimeout(() => {
        setClosePhase('revealing')
      }, revealStartMs),
    )

    closeTimersRef.current.push(
      window.setTimeout(() => {
        setClosingId(null)
        setClosePhase(null)
      }, revealStartMs + totalRevealMs),
    )
  }

  const handleClose = () => {
    if (!activeId || closePhase || spreadPhase === 'retract') return

    if (folderDocked && spreadLayouts) {
      clearSpreadTimers()

      const sink = dockSinkRef.current
      flushSync(() => setSpreadPhase('retract'))
      setCenterOffsetY((prev) => prev - sink)

      spreadTimersRef.current.push(
        window.setTimeout(() => {
          beginStackCloseSequence(activeId)
        }, SPREAD_PROMOTE.undockDurationMs),
      )
      return
    }

    beginStackCloseSequence(activeId)
  }

  const folderOffsetToViewportCenter = (container: HTMLElement, folderEl: HTMLElement) => {
    const containerRect = container.getBoundingClientRect()
    const folderRect = folderEl.getBoundingClientRect()
    return (
      containerRect.top +
      containerRect.height / 2 -
      (folderRect.top + folderRect.height / 2)
    )
  }

  const handleActivate = (id: string, element: HTMLElement) => {
    if (activeId) return

    if (closePhase) {
      clearCloseTimers()
      setClosingId(null)
      setClosePhase(null)
      setCenterOffsetY(0)
      resetDockState()
    }

    const container = scrollRef.current
    if (!container) return

    resetDockState()
    setCenterOffsetY(folderOffsetToViewportCenter(container, element))
    setActiveId(id)
  }

  const handleDockFolder = (id: string, element: HTMLElement) => {
    if (activeId !== id || folderDocked || closePhase) return

    const container = scrollRef.current
    if (!container) return

    const cardEls = [...element.querySelectorAll<HTMLElement>('[data-inner-pocket-card]')]
    if (cardEls.length < INNER_POCKET_CARD_COUNT) return

    const host = viewHostRef.current
    if (!host) return

    const baselineY = centerOffsetY

    flushSync(() => {
      setDockPinBaselineY(baselineY)
      setSpreadOrigin(spreadClusterOriginFromHost(host))
      setSpreadLayouts(generateSpreadCardLayouts(hashFolderSeed(id)))
      setSpreadPhase('hold')
      setFolderDocked(true)
    })

    scheduleSpreadPromote()

    const dockSink = folderOffsetToDockPeek(container, element)
    dockSinkRef.current = dockSink
    setCenterOffsetY((prev) => prev + dockSink)
  }

  const focusedFolderId = activeId ?? closingId

  const getMode = (id: string): FolderMode => {
    if (!focusedFolderId) return 'default'

    if (id === focusedFolderId) {
      if (closePhase === 'folding') return 'closing'
      if (closePhase === 'returning' || closePhase === 'revealing') return 'returning'
      return 'active'
    }

    if (closePhase === 'revealing') return 'revealing'
    return 'inactive'
  }

  const activeIndex = focusedFolderId
    ? contacts.findIndex((contact) => contact.id === focusedFolderId)
    : -1
  const isOverlayOpen = Boolean(activeId)
  /** On close, siblings stay in stack slots (no dive) until reveal — avoids a second visible row. */
  const stackSiblingsCollapsed =
    closePhase === 'folding' || closePhase === 'returning' || closePhase === 'revealing'

  const hideStack = stackHidden && !measureOnly
  const hideContent = contentHidden || measureOnly
  const useNativeScroll = !elasticEnabled

  /** Keep every folder in layout; only opacity changes to avoid stack jumping. */
  const getFolderPresentation = (index: number) => {
    if (measureOnly) {
      return { hidden: true, entering: false }
    }

    if (hideStack) {
      return { hidden: true, entering: false }
    }

    if (morphCoverActive && index < MORPH_FOLDER_COUNT) {
      return { hidden: true, entering: false }
    }

    if (listRevealActive && listRevealCount !== null) {
      if (index < MORPH_FOLDER_COUNT && morphCoverActive) {
        return { hidden: true, entering: false }
      }

      if (index < MORPH_FOLDER_COUNT) {
        return { hidden: false, entering: false }
      }

      if (index < listRevealCount) {
        return {
          hidden: false,
          entering: index >= MORPH_FOLDER_COUNT && index >= listRevealCount - TAIL_ENTER_BATCH,
        }
      }

      return { hidden: true, entering: false }
    }

    return { hidden: false, entering: false }
  }

  return (
    <div
      ref={viewHostRef}
      className={`relative flex-1 min-h-0${measureOnly ? ' folder-stack-measure-root' : ''}${
        folderDocked ? ' folder-view--docked' : ''
      }`}
    >
      <main
        ref={scrollRef}
        className={`relative h-full w-full no-scrollbar overscroll-contain pb-[var(--app-pad-bottom)] ${
          showHomeHero ? '' : 'pt-[var(--app-pad-top)]'
        }${
          folderDocked ? ' folder-scroll--docked' : ''
        } ${
          blockPageScroll
            ? 'overflow-visible touch-pan-y folder-scroll--overlay-open'
            : useNativeScroll
              ? 'overflow-y-auto touch-pan-y'
              : 'overflow-y-auto touch-none'
        }`}
        data-purpose="files-scroll-container"
        onPointerDownCapture={onPointerDown}
        onPointerMoveCapture={onPointerMove}
        onPointerUpCapture={onPointerUp}
        onPointerCancelCapture={onPointerUp}
      >
        {isOverlayOpen && !closePhase && (
          <button
            type="button"
            aria-label="Close folder"
            className="folder-close-backdrop absolute inset-0 z-[10] cursor-default border-0 bg-transparent p-0"
            onClick={handleClose}
          />
        )}

        <div
          className={`folder-files-layout${showHomeHero ? ' folder-files-layout--home-hero' : ''}`}
        >
          {showHomeHero ? (
            <section
              className={`cabinet-home-hero-region relative shrink-0 select-none${
                hideContent ? ' invisible' : ''
              }`}
              data-purpose="title-slot"
              aria-hidden={hideContent}
            >
              <BackToCabinetButton
                onClick={(e) => {
                  e.stopPropagation()
                  onBack()
                }}
                onPointerDown={(e) => e.stopPropagation()}
                disabled={isOverlayOpen}
                data-purpose="cabinet-back"
              />
              <CabinetHomeHero inlinePad={false} />
            </section>
          ) : (
            <section
              className={`app-inline-pad relative shrink-0 pb-2 pt-4 select-none${
                hideContent ? ' invisible' : ''
              }`}
              data-purpose="title-slot"
              aria-hidden={hideContent}
            >
              <BackToCabinetButton
                onClick={onBack}
                disabled={isOverlayOpen}
                className="cabinet-home-back--inline"
              />
              <h1 className="text-[clamp(15px,4.5vw,18px)] font-normal tracking-tight text-neutral-900 lowercase pl-1">
                contact files
              </h1>
            </section>
          )}

          {!compactHeader && !showHomeHero && (
            <div
              className="folder-files-hero-reserve app-inline-pad"
              data-purpose="folder-files-hero-reserve"
              aria-hidden={hideContent}
            />
          )}

          <div
            className={`relative z-[50] flex flex-col w-full folder-stack ${
              isOverlayOpen && !closePhase ? 'pointer-events-none' : ''
            }${hideStack ? ' invisible' : ''}`}
            id="cards-stack"
            aria-hidden={hideStack}
          >
            {stackContacts.map((contact, index) => {
            const revealStep =
              closePhase === 'revealing' && activeIndex >= 0
                ? getRevealStep(index, activeIndex)
                : -1

            const { hidden: folderHidden, entering: folderEntering } = getFolderPresentation(index)

            if (measureOnly) {
              return (
                <div
                  key={contact.id}
                  data-folder-index={index}
                  className="elastic-folder-wrapper opacity-0 pointer-events-none"
                >
                  <div
                    data-purpose="contact-card"
                    className="relative w-full shrink-0 select-none [container-type:inline-size]"
                    style={{ aspectRatio: FOLDER_ASPECT_RATIO }}
                  />
                </div>
              )
            }

            return (
              <StackFolderItem
                key={contact.id}
                index={index}
                name={contact.name}
                isLast={index === contacts.length - 1}
                mode={getMode(contact.id)}
                centerOffsetY={focusedFolderId === contact.id ? centerOffsetY : 0}
                revealDelay={revealStep >= 0 ? revealStep * REVEAL_STAGGER_MS : 0}
                elasticOffset={elasticOffsets[index]}
                shouldSuppressActivate={suppressNextClick}
                onActivate={(el) => handleActivate(contact.id, el)}
                onDockFolder={(el) => handleDockFolder(contact.id, el)}
                focusAboveOverlay={activeId === contact.id && !closePhase}
                folderDocked={folderDocked && activeId === contact.id}
                dockPinBaselineY={
                  folderDocked && activeId === contact.id ? dockPinBaselineY : null
                }
                itemHidden={folderHidden}
                itemEntering={folderEntering}
                stackSiblingCollapsed={
                  stackSiblingsCollapsed && contact.id !== focusedFolderId
                }
                pocketInnerCards={contact.id === focusedFolderId}
                spreadPhase={
                  activeId === contact.id ? spreadPhase : null
                }
                spreadLayouts={
                  activeId === contact.id ? spreadLayouts : null
                }
                spreadOrigin={activeId === contact.id ? spreadOrigin : null}
                centerYSyncUndock={
                  contact.id === activeId && spreadPhase === 'retract'
                }
              />
            )
          })}
          </div>
        </div>
      </main>

    </div>
  )
}
