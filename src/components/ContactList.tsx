import { useEffect, useRef, useState } from 'react'
import { contacts } from '../data/contacts'
import { type FolderMode } from './FolderCard'
import StackFolderItem from './StackFolderItem'
import { useElasticFolderStack } from '../hooks/useElasticFolderStack'
import { getMaxRevealSteps, getRevealStep } from '../utils/folderRevealOrder'

const FOLD_DURATION_MS = 520
const RETURN_OVERLAP_MS = 90
const RETURN_DURATION_MS = 560
const REVEAL_OVERLAP_MS = 200
const REVEAL_DURATION_MS = 420
const REVEAL_STAGGER_MS = 52

type ClosePhase = 'folding' | 'returning' | 'revealing' | null

export default function ContactList() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [centerOffsetY, setCenterOffsetY] = useState(0)
  const [closePhase, setClosePhase] = useState<ClosePhase>(null)
  const scrollRef = useRef<HTMLElement>(null)
  const closeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const elasticEnabled = !activeId && !closePhase

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
    const revealStartMs = FOLD_DURATION_MS - RETURN_OVERLAP_MS + RETURN_DURATION_MS - REVEAL_OVERLAP_MS

    setClosePhase('folding')

    closeTimersRef.current.push(
      window.setTimeout(() => {
        setClosePhase('returning')
      }, FOLD_DURATION_MS - RETURN_OVERLAP_MS),
    )

    closeTimersRef.current.push(
      window.setTimeout(() => {
        setCenterOffsetY(0)
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
      if (closePhase === 'returning') return 'returning'
      if (closePhase === 'revealing') return 'default'
      return 'active'
    }

    if (closePhase === 'revealing') return 'revealing'
    return 'inactive'
  }

  const activeIndex = activeId ? contacts.findIndex((contact) => contact.id === activeId) : -1
  const isOverlayOpen = Boolean(activeId)

  return (
    <div className="relative flex-1 min-h-0">
      <main
        ref={scrollRef}
        className={`relative h-full w-full no-scrollbar pb-8 px-4 overscroll-contain ${
          isOverlayOpen ? 'overflow-y-hidden touch-pan-y' : 'overflow-y-auto touch-none'
        }`}
        data-purpose="files-scroll-container"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <section
          className="relative shrink-0 min-h-[58%] pt-8 pb-4 select-none"
          data-purpose="title-slot"
        >
          <h1 className="text-[15px] font-normal tracking-tight text-neutral-900 lowercase pl-1">
            contact files
          </h1>
        </section>

        <div
          className={`relative flex flex-col w-full folder-stack ${
            isOverlayOpen ? 'pointer-events-none' : ''
          }`}
          id="cards-stack"
        >
          {contacts.map((contact, index) => {
            const revealStep =
              closePhase === 'revealing' && activeIndex >= 0
                ? getRevealStep(index, activeIndex)
                : -1

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
