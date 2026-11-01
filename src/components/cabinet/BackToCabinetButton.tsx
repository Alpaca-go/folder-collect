import type { MouseEvent, PointerEvent } from 'react'

interface BackToCabinetButtonProps {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
  onPointerDown?: (event: PointerEvent<HTMLButtonElement>) => void
  disabled?: boolean
  className?: string
  'data-purpose'?: string
}

export default function BackToCabinetButton({
  onClick,
  onPointerDown,
  disabled,
  className = '',
  'data-purpose': dataPurpose,
}: BackToCabinetButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      disabled={disabled}
      className={`cabinet-home-back${className ? ` ${className}` : ''}`}
      data-purpose={dataPurpose}
    >
      <svg className="cabinet-home-back-icon" viewBox="6 2 12 20" aria-hidden>
        <path
          d="M16,22L6,12L16,2l1.78,1.77L9.55,12l8.23,8.23L16,22Z"
          fill="currentColor"
        />
      </svg>
      <span className="cabinet-home-back-label">back to cabinet</span>
    </button>
  )
}
