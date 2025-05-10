export function StatsBar({ boyName, girlName, messagesRecieved }: { boyName: string, girlName: string, messagesRecieved: number }) {
  return <div className="px-10 py-4 flex flex-col justify-center absolute bottom-4 bg-zinc-900/80 border-1 border-pink-400/60 border-solid rounded-full z-[10]">
    <span className="text-white font-sans text-center text-md">Currently texting: <span className="text-pink-300 font-bold">{girlName}</span> and <span className="text-indigo-400 font-bold">{boyName}</span></span>
    <span className="text-white font-sans text-center text-xs">Messages exchanged (loaded): <span className="text-[rgb(23,255,120)] font-bold">{messagesRecieved}</span></span>
  </div>
}