import { useEffect, useRef, useState } from 'react'
import { contacts } from '../data/contacts'
import FolderCard, { type FolderMode } from './FolderCard'

const DRAG_THRESHOLD = 6
const FOLD_DURATION_MS = 520
const RETURN_OVERLAP_MS = 90
const RETURN_DURATION_MS = 560
const REVEAL_OVERLAP_MS = 200
const REVEAL_DURATION_MS = 400

type ClosePhase = 'folding' | 'returning' | 'revealing' | null

export default function ContactList() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [centerOffsetY, setCenterOffsetY] = useState(0)
  const [closePhase, setClosePhase] = useState<ClosePhase>(null)
  const scrollRef = useRef<HTMLElement>(null)
  const dragRef = useRef({ active: false, startY: 0, startScrollTop: 0 })
  const closeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearCloseTimers = () => {
    closeTimersRef.current.forEach(clearTimeout)
    closeTimersRef.current = []
  }

  useEffect(() => () => clearCloseTimers(), [])

  const handleClose = () => {
    if (!activeId || closePhase) return

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
      }, FOLD_DURATION_MS - RETURN_OVERLAP_MS + RETURN_DURATION_MS - REVEAL_OVERLAP_MS),
    )

    closeTimersRef.current.push(
      window.setTimeout(() => {
        setActiveId(null)
        setClosePhase(null)
      }, FOLD_DURATION_MS - RETURN_OVERLAP_MS + RETURN_DURATION_MS - REVEAL_OVERLAP_MS + REVEAL_DURATION_MS),
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

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (activeId) return
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    if ((e.target as HTMLElement).closest('button[aria-label^="Open"]')) return

    dragRef.current = {
      active: true,
      startY: e.clientY,
      startScrollTop: scrollRef.current?.scrollTop ?? 0,
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragRef.current.active || !scrollRef.current) return

    const deltaY = e.clientY - dragRef.current.startY
    if (Math.abs(deltaY) <= DRAG_THRESHOLD) return

    scrollRef.current.scrollTop = dragRef.current.startScrollTop - deltaY
  }

  const handlePointerUp = () => {
    dragRef.current.active = false
  }

  const getMode = (id: string): FolderMode => {
    if (!activeId) return 'default'

    if (id === activeId) {
      if (closePhase === 'folding') return 'closing'
      if (closePhase === 'returning') return 'returning'
      if (closePhase === 'revealing') return 'default'
      return 'active'
    }

    if (closePhase === 'revealing') return 'default'
    return 'inactive'
  }

  const isOverlayOpen = Boolean(activeId)

  return (
    <div className="relative flex-1 min-h-0">
      <main
        ref={scrollRef}
        className={`relative h-full w-full overflow-x-hidden no-scrollbar pt-8 pb-20 px-3.5 touch-pan-y overscroll-contain ${
          isOverlayOpen ? 'overflow-hidden' : 'overflow-y-auto'
        }`}
        data-purpose="files-scroll-container"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          className={`relative flex flex-col w-full space-y-[-160px] pt-2 -mb-[170px] ${
            isOverlayOpen ? 'pointer-events-none' : ''
          }`}
          id="cards-stack"
        >
          {contacts.map((contact, index) => (
            <FolderCard
              key={contact.id}
              name={contact.name}
              index={index}
              isLast={index === contacts.length - 1}
              mode={getMode(contact.id)}
              centerOffsetY={activeId === contact.id ? centerOffsetY : 0}
              onActivate={(el) => handleActivate(contact.id, el)}
            />
          ))}
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

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-40 h-20 bg-gradient-to-b from-appBg via-appBg/85 to-transparent"
        aria-hidden="true"
      />
    </div>
  )
}
