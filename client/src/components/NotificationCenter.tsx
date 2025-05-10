import { useServer } from "../context/server"
import { useState, useRef, useEffect } from "react";

type Notification = { id: number; text: string };

export function NotificationCenter({ connected }: { connected: boolean }) {
  const server = useServer();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    server.onPacket['notification'] = (data) => {
      const id = nextId.current++;
      const text = data as string;
      setNotifications((prev) => [...prev, { id, text }]);
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 2000);
    };
  }, [server]);

  return (
    <div className="absolute flex flex-col top-4 left-1/2 -translate-x-1/2 gap-1 items-center justify-center">
      {!connected && <DisconnectedNotification />}
      {notifications.map((n) => (
        <TextNotification key={n.id}>{n.text}</TextNotification>
      ))}
    </div>
  );
}

function TextNotification({children}: {children: any}) {
  return <BaseNotification className="bg-pink-100/80 text-pink-700 border-1 border-pink-300 border-solid font-sans font-bold">
    {children}
  </BaseNotification>
}

function DisconnectedNotification() {
  return <BaseNotification className="bg-red-300/30 text-red-500 font-medium">
    Disconnected from server
    <button
      className="bg-red-400/50 hover:bg-red-400 border-1 border-solid border-white/30 hover:border-white/70 rounded-full animate-pulse text-white/50 hover:text-white cursor-pointer transition-all duration-300"
      onClick={() => location.reload()}
    >
      Click here to refresh!
    </button>
  </BaseNotification>
}

function BaseNotification({className, children}: {className: string, children: any}) {
  return <div className={`flex flex-col px-4 py-2 rounded-full text-sm shadow-lg backdrop-blur-sm ${className}`}>
    {children}
  </div>
}