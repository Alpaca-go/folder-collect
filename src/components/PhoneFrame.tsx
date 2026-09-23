import ContactList from './ContactList'

interface PhoneFrameProps {
  onBack: () => void
  stackHidden?: boolean
  contentHidden?: boolean
  measureOnly?: boolean
  morphCoverActive?: boolean
  listRevealCount?: number | null
  listRevealActive?: boolean
  compactHeader?: boolean
}

export default function PhoneFrame({
  onBack,
  stackHidden = false,
  contentHidden = false,
  measureOnly = false,
  morphCoverActive = false,
  listRevealCount = null,
  listRevealActive = false,
  compactHeader = false,
}: PhoneFrameProps) {
  return (
    <div
      className="relative flex h-full min-h-0 w-full flex-col bg-appBg"
      data-purpose="app-shell"
    >
      <ContactList
        onBack={onBack}
        stackHidden={stackHidden}
        contentHidden={contentHidden}
        measureOnly={measureOnly}
        morphCoverActive={morphCoverActive}
        listRevealCount={listRevealCount}
        listRevealActive={listRevealActive}
        compactHeader={compactHeader}
      />
    </div>
  )
}
