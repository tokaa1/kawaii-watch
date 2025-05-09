import { useEffect, useRef, useState } from "react"

type Gender = "boy" | "girl"

type Message = {
  role: Gender
  content: string
  sender: string
}

type WSMessage = {
  type: 'init' | 'message'
  content?: string
  senderName?: string
  girl?: string
  boy?: string
  history?: { content: string; senderName: string }[]
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [connected, setConnected] = useState(false)
  const [girlName, setGirlName] = useState<string>("Undetermined")
  const [boyName, setBoyName] = useState<string>("Undetermined")
  const wsRef = useRef<WebSocket | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001')
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
    }

    ws.onmessage = (event) => {
      const data: WSMessage = JSON.parse(event.data)

      if (data.type === 'init' && data.history && data.girl && data.boy) {
        setGirlName(data.girl)
        setBoyName(data.boy)
        // Convert history messages to our format
        const historyMessages: Message[] = data.history.map(msg => ({
          role: msg.senderName === data.girl ? "girl" : "boy",
          content: msg.content,
          sender: msg.senderName
        }))
        setMessages(historyMessages)
      } else if (data.type === 'message' && data.content && data.senderName) {
        const newMessage: Message = {
          role: data.senderName === girlName ? "girl" : "boy",
          content: data.content,
          sender: data.senderName
        }
        setMessages(prev => [...prev, newMessage])
      }
    }

    ws.onclose = () => {
      setConnected(false)
    }

    return () => {
      ws.close()
    }
  }, [girlName])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [messages])

  // Fade-in state for the top-level div
  const [fadeIn, setFadeIn] = useState(false);
  useEffect(() => {
    setFadeIn(true);
  }, []);

  const bubbles = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    bubbles.push(<Bubble key={i} message={messages[i]} left={messages[i].role === "girl"} />)
  }

  return (
    <div
      className={`w-screen h-screen bg-black flex justify-center items-end transition-opacity duration-700 ${fadeIn ? "opacity-100" : "opacity-0"}`}
      style={{ opacity: fadeIn ? 1 : 0 }}
    >
      <IntroPopUp></IntroPopUp>
      <StatsBar boyName={boyName} girlName={girlName} messagesRecieved={messages.length}></StatsBar>
      <ActionCluster></ActionCluster>
      <div
        ref={containerRef}
        className="w-[100%] h-full px-[30%] py-10 flex flex-col gap-4 overflow-y-auto scrollbar-hide"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {bubbles}
      </div>
      {!connected && <>
        <div className="absolute flex flex-col top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-300/30 text-red-500 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm">
          Disconnected from server
          <button
            className="bg-red-400 border-1 border-solid border-white/30 rounded-full animate-pulse text-white cursor-pointer hover:bg-red-400/50 transition-all"
            onClick={() => location.reload()}
          >
            Click here to refresh!
          </button>
        </div>
        {bubbles.length == 0 && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-sans text-lg text-white text-center">
          it seems we can't connect to the <span className="text-pink-500 font-bold">kawaii-watch</span> server...
          <br></br>
          maybe it's reloading or down!
          <br></br>
          you can always host it yourself, it's <a className="text-blue-300 underline italic bg-blue-400/30 p-1" href="https://github.com/tokaa1/kawaii-watch">here on github</a>
        </div>}
      </>}
      {connected && (
        <div className="absolute top-5 right-5 w-3 h-3 rounded-full bg-pink-400 animate-pulse shadow-lg" />
      )}
    </div>
  )
}

function Bubble({ message, left }: { message: Message, left: boolean }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
  }, [])

  return (
    <div className={`w-full flex ${left ? "justify-start" : "justify-end"}`}>
      <div
        className={`
          max-w-[70%]
          w-fit px-4 py-2 rounded-2xl font-medium text-lg
          transition-all duration-500 ease-out
          break-words whitespace-pre-line
          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          ${left ? "bg-white/10 text-pink-100 shadow-lg" : "bg-white/10 text-indigo-300 shadow-lg"}
          hover:scale-105 transform transition-transform
        `}
        style={{
          willChange: "opacity, transform",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
        }}
      >
        {message.content}
      </div>
    </div>
  )
}


function IntroPopUp() {
  const hexBgOpacity = '33';
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const wasDismissed = localStorage.getItem("introPopUpDismissed");
    if (wasDismissed === "true") {
      setDismissed(true);
    } else {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("introPopUpDismissed", "true");
  };

  if (dismissed) return null;

  return (
    <div
      className="w-[60%] h-[60%] flex flex-col gap-4 p-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 backdrop-blur-xs z-[1000] rounded-3xl border-[1px] border-solid border-white/20"
      style={{
        background: `linear-gradient(135deg, #ffe0ef${hexBgOpacity} 0%, #b7e5b4${hexBgOpacity} 60%, #c7eaff${hexBgOpacity} 100%)`
      }}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 px-3 py-1 bg-zinc-600/30 text-pink-500 rounded-full text-sm font-medium hover:bg-zinc-600/50 transition cursor-pointer"
        aria-label="Dismiss intro"
      >
        ×
      </button>
      <img src="logo.png" className="absolute right-8 h-[18%] aspect-square" />
      <span className="font-sans text-white text-[4vw] font-light leading-tight">
        this is <span className="font-bold text-pink-500 text-[4vw]">kawaii-watch</span>
        <span className="ml-2 text-[1vw] text-white font-light italic">
          watch llms fall in love
        </span>
      </span>
      <span className="font-sans text-white text-[1.5vw] leading-snug">
        so pretty much, here you get to watch two llm's (<span className="text-pink-200">girl</span> and <span className="text-indigo-200">boy</span>) text each in <span className="font-bold text-red-400">REAL TIME</span>
      </span>
      <span className="font-sans text-white text-[1.5vw] leading-snug">
        it's interesting because you get to experience the genius of LLM's, the stupid, and the room for improvement
      </span>
      <span className="font-sans text-white text-[1.3vw] text-yellow-200 leading-snug">
        they both don't have any context about each other, they learn through communicating!
      </span>
    </div>
  )
}

function StatsBar({ boyName, girlName, messagesRecieved }: { boyName: string, girlName: string, messagesRecieved: number }) {
  return <div className="px-10 py-4 flex flex-col justify-center absolute bottom-4 bg-zinc-900/80 border-1 border-pink-400/60 border-solid rounded-full z-[100001]">
    <span className="text-white font-sans text-center text-md">Currently texting: <span className="text-pink-300 font-bold">{girlName}</span> and <span className="text-indigo-400 font-bold">{boyName}</span></span>
    <span className="text-white font-sans text-center text-xs">Messages exchanged (loaded): <span className="text-[rgb(23,255,120)] font-bold">{messagesRecieved}</span></span>
  </div>
}

function ActionCluster() {
  return <div className="flex-row gap-1 absolute left-2 bottom-2">
    <ActionButton onClick={() => {localStorage.setItem("introPopUpDismissed", 'false')}}>open introduction (again)</ActionButton>
  </div>
}

function ActionButton({ children, onClick }: { children: any, onClick: () => void }) {
  return <button
    className="px-1 bg-zinc-700 border-1 border-solid border-white/30 rounded-full animate-pulse text-white cursor-pointer hover:bg-zinc-700/50 transition-all"
    onClick={onClick}
  >
    {children}
  </button>
}

export default App