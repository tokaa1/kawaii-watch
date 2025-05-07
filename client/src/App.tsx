import { useEffect, useRef, useState } from "react"

type Gender = "boy" | "girl"

type Message = {
  role: Gender
  content: string
  sender: string
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "girl",
      content: "hey! asdasdasdasdasdasdasdsadasdsadsadsadsadsadsadsadasdasd",
      sender: "Jasmine"
    },
    {
      role: "boy",
      content: "yoooo",
      sender: "Kevin"
    },
  ])

  const containerRef = useRef<HTMLDivElement>(null)

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
    <button 
      className="absolute bottom-3 px-4 py-2 bg-black hover:bg-white/10 transition-all duration-300 border-white/30 border-[1px] outline-none rounded-xl text-white font-light text-xs cursor-pointer"
      onClick={() => {
        setMessages([...messages, {
          role: "boy",
          content: "yoooo",
          sender: "Kevin"
        }])
      }}
    >
      Add message
    </button>
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
