import { useEffect, useRef, useState } from "react"
import { IntroVisibilityProvider } from "./context/intro"
import { ActionCluster } from "./components/ActionCluster"
import { StatsBar } from "./components/StatsBar"
import { Bubble } from "./components/Bubble"
import { IntroPopUp } from "./components/IntroPopUp"

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
  const [shouldShowLoadingBubble, setShouldShowLoadingBubble] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001')
    wsRef.current = ws
    let timeout: number | null = null;

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
        const wordCount = newMessage.content.split(' ').length;
        setShouldShowLoadingBubble(false);
        if (timeout) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
          setShouldShowLoadingBubble(true);
        }, Math.max(500, Math.min(wordCount * 38, 1000)));
        setMessages(prev => [...prev, newMessage])
      }
    }

    ws.onclose = () => {
      setConnected(false)
    }

    return () => {
      ws.close();
      if (timeout)
        clearTimeout(timeout);
    }
  }, [girlName])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [messages])

  const [fadeIn, setFadeIn] = useState(false);
  useEffect(() => {
    setFadeIn(true);
  }, []);

  const bubbles = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    bubbles.push(<Bubble key={i} left={messages[i].role === "girl"}>{messages[i].content}</Bubble>)
  }

  return <IntroVisibilityProvider>
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
        {shouldShowLoadingBubble &&
          <Bubble
            left={messages[messages.length - 1].role === "boy"}
            className="font-bold text-xs"
          >
            <span className="animate-pulse">
              ...
            </span>
          </Bubble>
        }
        {bubbles}
      </div>
      {!connected && <>
        <div className="absolute flex flex-col top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-300/30 text-red-500 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm">
          Disconnected from server
          <button
            className="bg-red-400/50 hover:bg-red-400 border-1 border-solid border-white/30 hover:border-white/70 rounded-full animate-pulse text-white/50 hover:text-white cursor-pointer transition-all duration-300"
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
  </IntroVisibilityProvider>
}

export default App