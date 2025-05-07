import { useState } from "react"

type Message = {
  content: string
  sender: string
}

function App() {
  const [girlMessages, setGirlMessages] = useState<Message[]>([])
  const [boyMessages, setBoyMessages] = useState<Message[]>([])
  
  return <div className="w-screen h-screen bg-black flex justify-center">
    <div className="w-[40%] h-full p-2 flex flex-col gap-2">
      <Bubble message={{ content: "Hello", sender: "girl" }} left={true} />
    </div>
    <button className="absolute bottom-3 px-4 py-2 bg-black hover:bg-white/10 transition-all duration-300 border-white/30 border-[1px] outline-none rounded-xl text-white font-light text-xs cursor-pointer">
      Add message
    </button>
  </div>
}

function Bubble({ message, left }: { message: Message, left: boolean }) {
  return <div className={`w-full flex ${left ? "justify-start" : "justify-end"}`}>
    <div className="w-fit bg-white/12 px-4 py-2 rounded-xl text-white font-light text-2xl">
      {message.content}
    </div>
  </div>
}

export default App
