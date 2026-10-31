interface CabinetHomeHeroProps {
  /** Omit horizontal padding when parent `.app-inline-pad` already provides it. */
  inlinePad?: boolean
}

export default function CabinetHomeHero({ inlinePad = true }: CabinetHomeHeroProps) {
  return (
    <header
      className={`cabinet-home-hero${inlinePad ? ' app-inline-pad' : ''}`}
      aria-label="Portfolio introduction"
    >
      <h1 className="cabinet-home-name">Wang  Qi</h1>
      <p className="cabinet-home-role">Visual  Designer  /  Illustrator</p>
      <div className="cabinet-home-divider" aria-hidden="true" />
      <p className="cabinet-home-works" aria-label="Select works">
        <span className="cabinet-home-works-line">SELECT</span>
        <span className="cabinet-home-works-line">WORKS</span>
      </p>
      <p className="cabinet-home-years">2023 - 2026</p>
    </header>
  )
}
