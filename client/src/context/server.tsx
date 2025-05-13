import { createContext, useContext, useRef, useEffect, useCallback, useState } from "react";

const useProdServerOnDev = false;
const serverUrl = !import.meta.env.DEV || useProdServerOnDev ? "wss://kawaii-watch-server.nightly.pw" : "ws://localhost:3001";

type PacketType = 'init' | 'stats' | 'message' | 'notification' | 'start-vote' | 'end-vote' | 'progress-vote' | 'choice-vote';
export type InitPacketData = {
  boy: PacketDataLover,
  girl: PacketDataLover,
  history: MessagePacketData[]
}
export type MessagePacketData = {
  content: string,
  senderName: string
}
export type PacketDataLover = {
  name: string;
  age: number;
  ethnicity: string;
  university: string;
  systemPrompt: string;
}
type EventType = "open" | 'close';
type PacketListener = (data: any) => void;
type EventListener = () => void;
type ServerContextType = {
  ws?: WebSocket | null;
  onPacket: { [K in PacketType]?: PacketListener };
  onEvent: { [K in EventType]?: EventListener };
  send: (type: PacketType, data: any) => void;
};
const ServerContext = createContext<ServerContextType | null>(null);
export function useServer() {
  const ctx = useContext(ServerContext);
  if (!ctx)
    throw new Error("useServer must be inside of a ServerContextProvider")
  return ctx;
}

export function ServerContextProvider({ children }: { children: any }) {
  const wsRef = useRef<WebSocket | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const onPacket = useRef<{ [K in PacketType]?: PacketListener }>({});
  const onEvent = useRef<{ [K in EventType]?: EventListener }>({});

  const send = useCallback((type: PacketType, data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data: data }));
    }
  }, []);

  useEffect(() => {
    const ws = new WebSocket(serverUrl);
    wsRef.current = ws;
    setWs(ws);

    ws.onmessage = (event) => {
      let fullPacket;
      try {
        fullPacket = JSON.parse(event.data);
      } catch {
        return;
      }
      const type: PacketType = fullPacket.type;
      const listener = onPacket.current[type];
      if (listener) {
        listener(fullPacket.data);
      }
    };

    ws.onopen = () => {
      const listener = onEvent.current['open'];
      if (listener) listener();
    }
    ws.onclose = () => {
      const listener = onEvent.current['close'];
      if (listener) listener();
    }

    return () => {
      ws.close();
      wsRef.current = null;
      setWs(null);
    };
  }, []);

  return (
    <ServerContext.Provider value={{ ws, onPacket: onPacket.current, onEvent: onEvent.current, send }}>
      {children}
    </ServerContext.Provider>
  );
}
/*
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
 */