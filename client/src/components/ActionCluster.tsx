import { useIntroVisibility } from "../context/intro";

export function ActionCluster() {
  const { setShow } = useIntroVisibility();

  return <div className="flex-row gap-1 absolute left-2 bottom-2">
    <ActionButton onClick={() => setShow(true)}>open introduction (again)</ActionButton>
  </div>
}

export function ActionButton({ children, onClick }: { children: any, onClick: () => void }) {
  return <button
    className="px-1 bg-zinc-700/50 border-1 border-solid border-white/30 hover:border-white/70 hover:bg-zinc-700 rounded-full animate-pulse text-white cursor-pointer transition-all duration-300"
    onClick={onClick}
  >
    {children}
  </button>
}