import { useState, useEffect, useRef } from 'react'
import { useServer } from '../context/server'
import { stringToColor } from '../util/color'
import { ActionButton } from './ActionCluster'

type ChatMessage = {
  username: string
  message: string
  timestamp: number
}

export function LiveChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [chatVisible, setChatVisible] = useState(false)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mountTimeRef = useRef(Date.now())
  const server = useServer()
  const lastSendTimeMs = useRef(Date.now())

  useEffect(() => {
    server.onPacket['chat-broadcast'] = (data) => {
      const newMessages = data.map((d: any) => ({
        username: d.username,
        message: d.message,
        timestamp: d.timestamp
      }));
      
      setMessages(prev => [...prev, ...newMessages]);
      
      const hasRecentMessages = newMessages.some((msg: ChatMessage) => msg.timestamp > mountTimeRef.current);
      if (hasRecentMessages && !chatVisible) {
        setHasNewMessages(true);
      }
    }
  }, [chatVisible])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || Date.now() - lastSendTimeMs.current < 1000) return
    lastSendTimeMs.current = Date.now()

    server.send('chat-in', {
      message: inputMessage.trim()
    })

    setInputMessage('')
  }

  const toggleChat = () => {
    setChatVisible(prev => !prev);
    if (!chatVisible) {
      setHasNewMessages(false);
    }
  }

  return (
    <>
      {chatVisible && (
        <div className="w-[calc((100%-min(72.5vh,85%))/2)] h-[80%] box-border px-8 absolute right-0 top-1/2 -translate-y-1/2 rounded-4xl">
          <div className="w-full h-full rounded-2xl flex flex-col bg-white/4 border-4 border-solid border-white/2 p-0.5">
            <div className="flex-grow overflow-y-auto p-3 space-y-2">
              {messages.length === 0 ? (
                <div className="text-center text-pink-300 mt-4 font-bold">
                  chat is empty ;((
                </div>
              ) : (
                messages.map((msg, index) => (
                  <ChatMessage key={index} username={msg.username} time={msg.timestamp} message={msg.message} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={onSubmit} className="p-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="message..."
                  className="flex-grow p-2 text-white bg-white/7 rounded-2xl focus:outline-none focus:border-pink-400 focus:animate-none"
                  maxLength={175}
                />
                <button 
                  type="submit" 
                  className="cursor-pointer bg-white/10 hover:bg-white/15 text-pink-300 p-2 rounded-2xl transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-2 right-2">
        <ActionButton onClick={toggleChat}>
          {chatVisible ? 'close chat' : (
            <div className="flex items-center gap-1">
              {hasNewMessages && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                </span>
              )}
              <span>open chat</span>
            </div>
          )}
        </ActionButton>
      </div>
    </>
  )
}

function ChatMessage({ username, time, message }: { username: string, time: number, message: string }) {
  const [visible, setVisible] = useState(false)
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  useEffect(() => {
    setVisible(true)
  }, [])
  return (
    <div className={`text-white text-[0.8rem]
        duration-300
        ease-out
        transition-all
        w-full
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}
        hover:scale-101 transform transition-transform
      `}
      style={{
        willChange: "opacity, transform",
      }}
    >
      <span className="font-bold text-[0.8rem] text-pink-400" style={{ color: stringToColor(username) }}>{username}</span>
      <span className="text-gray-400 ml-2 text-[0.6rem]">{formatTime(time).replace(' ', '')}</span>
      <span className="text-gray-300 ml-2 text-[0.7rem] break-words whitespace-normal overflow-wrap-anywhere">{message}</span>
    </div>
  )
}