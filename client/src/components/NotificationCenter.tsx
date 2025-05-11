import { useServer } from "../context/server"
import { useState, useRef, useEffect } from "react";

type Notification = { id: number; text: string; visible: boolean };

export function NotificationCenter({ connected }: { connected: boolean }) {
  const server = useServer();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const nextId = useRef(0);

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
  }, [server]);

  return (
    <div className="absolute flex flex-col top-4 left-1/2 -translate-x-1/2 gap-1 items-center justify-center">
      {!connected && <DisconnectedNotification />}
      {notifications.map((n) => (
        <TextNotification key={n.id} visible={n.visible}>{n.text}</TextNotification>
      ))}
    </div>
  );
}

function TextNotification({children, visible = true}: {children: any, visible?: boolean}) {
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
  visible = true
}: {
  className: string,
  children: any,
  visible?: boolean
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
      style={{ opacity }}
    >
      {children}
    </div>
  );
}