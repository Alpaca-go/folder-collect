import ContactList from './ContactList'

export default function PhoneFrame() {
  return (
    <div
      className="relative flex h-full min-h-0 w-full flex-col bg-appBg"
      data-purpose="app-shell"
    >
      <ContactList />
    </div>
  )
}
