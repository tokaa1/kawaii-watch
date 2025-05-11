import { useServer } from "../context/server"
import { useState, useRef, useEffect } from "react";

type Notification = { id: number; text: string; visible: boolean };
type Vote = {
  question: string;
  choices: string[];
  durationMs: number;
}

export function NotificationCenter({ connected }: { connected: boolean }) {
  const server = useServer();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const nextId = useRef(0);
  const [vote, setVote] = useState<Vote | null>(null);

  useEffect(() => {
    server.onPacket['notification'] = (data) => {
      const id = nextId.current++;
      const text = data as string;
      setNotifications((prev) => [...prev, { id, text, visible: true }]);

      // Start fade-out after 2000ms
      setTimeout(() => {
        setNotifications((prev) =>
          prev.map(n => n.id === id ? { ...n, visible: false } : n)
        );

        // Remove from DOM after animation completes (300ms)
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 300);
      }, 2000);
    };
    server.onPacket['start-vote'] = (data) => {
      const vote = data as Vote;
      setVote(vote);
    };
    server.onPacket['end-vote'] = (data) => {
      setVote(null);
    };
  }, [server]);

  return (
    <div className="absolute flex flex-col top-4 left-1/2 -translate-x-1/2 gap-1 items-center justify-center z-[11]">
      {!connected && <DisconnectedNotification />}
      {notifications.map((n) => (
        <TextNotification key={n.id} visible={n.visible}>{n.text}</TextNotification>
      ))}
      {vote && <VoteNotification vote={vote} />}
    </div>
  );
}

function VoteNotification({ vote }: { vote: Vote }) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const server = useServer();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (selectedChoice) {
      server.send('choice-vote', selectedChoice);
    }
  }, [selectedChoice]);

  return <BaseNotification
    className="overflow-hidden bg-green-200/100 text-green-700 border-1 border-green-300 border-solid font-sans font-bold px-8"
    visible={true}
  >
    <div
      className={`absolute w-full h-full bg-green-200/100 transition-all transtition-transform duration-[${vote.durationMs}]`}
      style={{
        transform: mounted ? 'translateX(0)' : 'translateX(-100%)',
        willChange: 'transform'
      }}
    >
    </div>
    <div className="relative z-10 flex flex-col">
      {vote.question}
      {vote.choices.map((choice) => (
        <button
          key={choice}
          className="bg-green-400/50 border-1 border-green-200/50 hover:border-green-200 border-solid px-4 m-auto hover:bg-green-400 rounded-full text-lg text-black/50 hover:text-black cursor-pointer transition-all duration-300"
          onClick={() => setSelectedChoice(choice)}
        >
          {choice}
        </button>
      ))}
      <span className="font-light font-black text-center">You chose: <span className="font-bold text-green-700">{selectedChoice}</span></span>
    </div>
  </BaseNotification>
}
function TextNotification({ children, visible = true }: { children: any, visible?: boolean }) {
  return <BaseNotification
    className="bg-pink-100/80 text-pink-700 border-1 border-pink-300 border-solid font-sans font-bold"
    visible={visible}
  >
    {children}
  </BaseNotification>
}

function DisconnectedNotification() {
  return <BaseNotification
    className="bg-red-300/30 text-red-500 font-medium"
    visible={true}
  >
    Disconnected from server
    <button
      className="bg-red-400/50 hover:bg-red-400 border-1 border-solid border-white/30 hover:border-white/70 rounded-full animate-pulse text-white/50 hover:text-white cursor-pointer transition-all duration-300"
      onClick={() => location.reload()}
    >
      Click here to refresh!
    </button>
  </BaseNotification>
}

function BaseNotification({
  className,
  children,
  visible = true,
  style
}: {
  className: string,
  children: any,
  visible?: boolean,
  style?: React.CSSProperties
}) {
  const [opacity, setOpacity] = useState(0);

  // Handle both fade-in and fade-out based on visible prop
  useEffect(() => {
    if (visible) {
      // Small delay to ensure the transition works for fade-in
      const timer = setTimeout(() => {
        setOpacity(1);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      // Immediate fade-out when visible becomes false
      setOpacity(0);
    }
  }, [visible]);

  return (
    <div
      className={`flex flex-col px-4 py-2 rounded-full text-sm shadow-lg backdrop-blur-sm transition-opacity duration-500 ease-in-out ${className}`}
      style={{ opacity, ...style }}
    >
      {children}
    </div>
  );
}