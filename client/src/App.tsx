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
      className="w-[50%] h-full px-[5%] py-10 flex flex-col gap-4 overflow-y-auto scrollbar-hide"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {bubbles}
    </div>
    {!connected && (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-300/30 text-red-500 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm">
        Disconnected from server
      </div>
    )}
    {connected && (
      <div className="absolute top-5 right-5 w-3 h-3 rounded-full bg-pink-400 animate-pulse shadow-lg"/>
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
          w-fit px-4 py-2 rounded-2xl font-medium text-lg
          transition-all duration-500 ease-out
          break-words whitespace-pre-line
          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          ${left ? "bg-white/10 text-pink-100 shadow-lg" : "bg-white/10 text-indigo-100 shadow-lg"}
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

export default App
