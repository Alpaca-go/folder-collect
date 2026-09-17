import ContactList from './ContactList'

export default function PhoneFrame() {
  return (
    <div
      className="relative w-full max-w-[390px] h-[844px] bg-appBg sm:rounded-[50px] shadow-[0_25px_70px_rgba(0,0,0,0.85)] border-[8px] sm:border-[10px] border-[#262829] overflow-hidden flex flex-col"
      data-purpose="iphone-frame"
    >
      <header className="relative z-30 pt-3 px-7 flex flex-col justify-start select-none" data-purpose="status-bar-header">
        <div className="pt-5 pb-1">
          <h1 className="text-[15px] font-normal tracking-tight text-neutral-900 lowercase pl-1">
            contact files
          </h1>
        </div>
      </header>

      <ContactList />

      <footer className="relative z-40 w-full flex justify-center pb-2 pt-1" data-purpose="home-bar-indicator">
        <div className="w-36 h-1 bg-neutral-900/80 rounded-full" />
      </footer>
    </div>
  )
}
