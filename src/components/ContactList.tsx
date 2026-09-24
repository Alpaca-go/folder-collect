import { useEffect, useRef, useState } from 'react'
import { contacts } from '../data/contacts'
import { type FolderMode } from './FolderCard'
import StackFolderItem from './StackFolderItem'
import { useElasticFolderStack } from '../hooks/useElasticFolderStack'
import { getMaxRevealSteps, getRevealStep } from '../utils/folderRevealOrder'
import { MORPH_FOLDER_COUNT } from '../utils/folderMorph'

const FOLD_DURATION_MS = 520
const RETURN_OVERLAP_MS = 90
const RETURN_DURATION_MS = 560
/** How early (ms) stack siblings may start revealing before return spring ends. */
const REVEAL_OVERLAP_MS = 48
const REVEAL_DURATION_MS = 420
const REVEAL_STAGGER_MS = 52
const TAIL_ENTER_BATCH = 2

type ClosePhase = 'folding' | 'returning' | 'revealing' | null

interface ContactListProps {
  onBack: () => void
  stackHidden?: boolean
  contentHidden?: boolean
  measureOnly?: boolean
  morphCoverActive?: boolean
  listRevealCount?: number | null
  listRevealActive?: boolean
  compactHeader?: boolean
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
}: ContactListProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [centerOffsetY, setCenterOffsetY] = useState(0)
  const [closePhase, setClosePhase] = useState<ClosePhase>(null)
  const scrollRef = useRef<HTMLElement>(null)
  const closeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const elasticEnabled = !activeId && !closePhase && !listRevealActive

  const {
    elasticOffsets,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    suppressNextClick,
  } = useElasticFolderStack({
    containerRef: scrollRef,
    itemCount: contacts.length,
    enabled: elasticEnabled,
  })

  const clearCloseTimers = () => {
    closeTimersRef.current.forEach(clearTimeout)
    closeTimersRef.current = []
  }

  useEffect(() => () => clearCloseTimers(), [])

  const handleClose = () => {
    if (!activeId || closePhase) return

    const activeIndex = contacts.findIndex((contact) => contact.id === activeId)
    const maxRevealSteps = activeIndex >= 0 ? getMaxRevealSteps(activeIndex, contacts.length) : 0
    const totalRevealMs = REVEAL_DURATION_MS + maxRevealSteps * REVEAL_STAGGER_MS
    const returnStartMs = FOLD_DURATION_MS - RETURN_OVERLAP_MS
    const returnEndMs = returnStartMs + RETURN_DURATION_MS
    const revealStartMs = returnEndMs - REVEAL_OVERLAP_MS

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
        setActiveId(null)
        setClosePhase(null)
      }, revealStartMs + totalRevealMs),
    )
  }

  const handleActivate = (id: string, element: HTMLElement) => {
    if (activeId || closePhase) return

    const container = scrollRef.current
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const folderRect = element.getBoundingClientRect()
    const offset =
      containerRect.top + containerRect.height / 2 - (folderRect.top + folderRect.height / 2)

    setCenterOffsetY(offset)
    setActiveId(id)
  }

  const getMode = (id: string): FolderMode => {
    if (!activeId) return 'default'

    if (id === activeId) {
      if (closePhase === 'folding') return 'closing'
      if (closePhase === 'returning' || closePhase === 'revealing') return 'returning'
      return 'active'
    }

    if (closePhase === 'revealing') return 'revealing'
    return 'inactive'
  }

  const activeIndex = activeId ? contacts.findIndex((contact) => contact.id === activeId) : -1
  const isOverlayOpen = Boolean(activeId)
  /** On close, siblings stay in stack slots (no dive) until reveal — avoids a second visible row. */
  const stackSiblingsCollapsed =
    closePhase === 'folding' || closePhase === 'returning' || closePhase === 'revealing'

  const hideStack = stackHidden || measureOnly
  const hideContent = contentHidden || measureOnly
  const useNativeScroll = !isOverlayOpen && !elasticEnabled

  /** Keep every folder in layout; only opacity changes to avoid stack jumping. */
  const getFolderPresentation = (index: number) => {
    if (measureOnly || hideStack) {
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
    <div className={`relative flex-1 min-h-0${measureOnly ? ' folder-stack-measure-root' : ''}`}>
      <main
        ref={scrollRef}
        className={`relative h-full w-full no-scrollbar overscroll-contain pb-[var(--app-pad-bottom)] pt-[var(--app-pad-top)] ${
          isOverlayOpen
            ? 'overflow-y-hidden touch-pan-y'
            : useNativeScroll
              ? 'overflow-y-auto touch-pan-y'
              : 'overflow-y-auto touch-none'
        }`}
        data-purpose="files-scroll-container"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <section
          className={`app-inline-pad relative shrink-0 pb-4 pt-4 select-none${
            compactHeader ? '' : ' min-h-[var(--title-slot-min-h)]'
          }${hideContent ? ' invisible' : ''}`}
          data-purpose="title-slot"
          aria-hidden={hideContent}
        >
          <button
            type="button"
            onClick={onBack}
            disabled={isOverlayOpen}
            className="mb-3 min-h-[44px] border-0 bg-transparent p-0 text-[clamp(11px,3.2vw,13px)] text-neutral-600/80 lowercase cursor-pointer hover:text-neutral-800 disabled:opacity-30 disabled:cursor-default touch-manipulation"
          >
            ← back to cabinet
          </button>
          <h1 className="text-[clamp(15px,4.5vw,18px)] font-normal tracking-tight text-neutral-900 lowercase pl-1">
            contact files
          </h1>
        </section>

        <div
          className={`relative flex flex-col w-full folder-stack ${
            isOverlayOpen ? 'pointer-events-none' : ''
          }${hideStack ? ' invisible' : ''}`}
          id="cards-stack"
          aria-hidden={hideStack}
        >
          {contacts.map((contact, index) => {
            const revealStep =
              closePhase === 'revealing' && activeIndex >= 0
                ? getRevealStep(index, activeIndex)
                : -1

            const { hidden: folderHidden, entering: folderEntering } = getFolderPresentation(index)

            return (
              <StackFolderItem
                key={contact.id}
                index={index}
                name={contact.name}
                isLast={index === contacts.length - 1}
                mode={getMode(contact.id)}
                centerOffsetY={activeId === contact.id ? centerOffsetY : 0}
                revealDelay={revealStep >= 0 ? revealStep * REVEAL_STAGGER_MS : 0}
                elasticOffset={elasticOffsets[index]}
                shouldSuppressActivate={suppressNextClick}
                onActivate={(el) => handleActivate(contact.id, el)}
                itemHidden={folderHidden}
                itemEntering={folderEntering}
                stackSiblingCollapsed={stackSiblingsCollapsed && contact.id !== activeId}
              />
            )
          })}
        </div>
      </main>

      {isOverlayOpen && (
        <button
          type="button"
          aria-label="返回"
          className="absolute inset-0 z-[60] cursor-default border-0 bg-transparent p-0"
          onClick={closePhase ? undefined : handleClose}
        />
      )}
    </div>
  )
}
