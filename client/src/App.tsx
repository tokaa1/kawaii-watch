import { useEffect, useRef, useState } from "react"
import { IntroVisibilityProvider } from "./context/intro"
import { ActionCluster } from "./components/ActionCluster"
import { StatsBar } from "./components/StatsBar"
import { Bubble } from "./components/Bubble"
import { IntroPopUp } from "./components/IntroPopUp"
import { ServerContextProvider, useServer, type InitPacketData, type PacketDataLover } from "./context/server"
import { NotificationCenter } from "./components/NotificationCenter"
import { ProfilesDisplay } from "./components/ProfilesDisplay"

const showProfileCards = true;// profile cards are experimental
type Gender = "boy" | "girl"
type Message = {
  role: Gender
  content: string
  sender: string
}

function BaseApp() {
  return <ServerContextProvider>
    <IntroVisibilityProvider>
      <App>
      </App>
    </IntroVisibilityProvider>
  </ServerContextProvider>
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [connected, setConnected] = useState(false)
  const [girl, setGirl] = useState<PacketDataLover>({
    name: "Undetermined",
    age: 0,
    ethnicity: "Undetermined",
    university: "Undetermined",
    systemPrompt: "Undetermined"
  })
  const [boy, setBoy] = useState<PacketDataLover>({
    name: "Undetermined",
    age: 0,
    ethnicity: "Undetermined",
    university: "Undetermined",
    systemPrompt: "Undetermined"
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldShowLoadingBubble, setShouldShowLoadingBubble] = useState(false);
  const server = useServer();
  useEffect(() => {
    let timeout: number | undefined;
    server.onPacket['init'] = (data) => {
      const packet: InitPacketData = data as InitPacketData;
      // convert history messages to our format
      const historyMessages: Message[] = packet.history.map(msg => ({
        role: msg.senderName === packet.girl.name ? "girl" : "boy",
        content: msg.content,
        sender: msg.senderName
      }))
      setMessages(historyMessages)
      setGirl(packet.girl);
      setBoy(packet.boy);
    };
    server.onPacket['message'] = (data) => {
      const newMessage: Message = {
        role: data.role,
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
        timeout = undefined;
      }, Math.max(500, Math.min(wordCount * 38, 1000)));
      setMessages(prev => [...prev, newMessage])
    };
    server.onEvent['open'] = () => setConnected(true)
    server.onEvent['close'] = () => setConnected(false)

    return () => clearTimeout(timeout);
  }, [girl, boy]);

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

  return <>
    <div
      className={`w-screen h-screen bg-black flex justify-center items-end transition-opacity duration-700 ${fadeIn ? "opacity-100" : "opacity-0"}`}
      style={{ opacity: fadeIn ? 1 : 0 }}
    >
      <IntroPopUp></IntroPopUp>
      <NotificationCenter connected={connected}></NotificationCenter>
      <StatsBar boyName={boy.name} girlName={girl.name} messagesRecieved={messages.length}></StatsBar>
      <ActionCluster></ActionCluster>
      <div
        ref={containerRef}
        className={`w-[100%] px-[calc((100%-min(72.5vh,85%))/2)] h-full pb-26 flex flex-col gap-4 overflow-y-auto scrollbar-hide ${showProfileCards ? "py-4" : "py-12"}`}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {showProfileCards && <ProfilesDisplay boy={boy} girl={girl}></ProfilesDisplay>}
        {shouldShowLoadingBubble && messages.length > 0 &&
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
  </>
}

export default BaseApp