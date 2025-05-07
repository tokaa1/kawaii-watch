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
  const [girlName, setGirlName] = useState<string>("")
  const [boyName, setBoyName] = useState<string>("")
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

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [messages])

  const bubbles = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    bubbles.push(<Bubble key={i} message={messages[i]} left={messages[i].role === "girl"} />)
  }

  return <div className="w-screen h-screen bg-black flex justify-center items-end">
    <div 
      ref={containerRef}
      className="w-[40%] h-full px-0 py-10 flex flex-col gap-2 overflow-y-auto scrollbar-hide"
      style={{
        scrollbarWidth: "none", // Firefox
        msOverflowStyle: "none", // IE 10+
      }}
    >
      {bubbles}
    </div>
    {!connected && (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-500/20 text-red-500 rounded-xl text-sm">
        Disconnected from server
      </div>
    )}
  </div>
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
          w-fit bg-white/12 px-4 py-2 rounded-xl text-white font-light text-2xl
          transition-all duration-500 ease-out
          break-words whitespace-pre-line
          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}
        style={{ willChange: "opacity, transform" }}
      >
        {message.content}
      </div>
    </div>
  )
}

export default App
