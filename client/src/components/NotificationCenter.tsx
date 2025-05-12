import { useServer } from "../context/server"
import { useState, useRef, useEffect } from "react";

type Notification = { id: number; text: string; visible: boolean; color: NotificationColor };
type NotificationColor = 'green' | 'pink' | 'yellow' | 'red'
type Vote = {
  question: string;
  choices: string[];
  durationMs: number;
}
type VoteResult = Record<string, number>;

export function NotificationCenter({ connected }: { connected: boolean }) {
  const server = useServer();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const nextId = useRef(0);
  const [vote, setVote] = useState<Vote | null>(null);
  const [voteResults, setVoteResults] = useState<VoteResult>({});

  useEffect(() => {
    server.onPacket['notification'] = (data) => {
      const id = nextId.current++;
      const { text, color } = data as { text: string, color: NotificationColor };
      setNotifications((prev) => [...prev, { id, text, visible: true, color }]);

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
      nextId.current++;// we will use this as a key for vote since sometimes identicial votes get optimized
      const vote = data as Vote;
      setVote(vote);
      // Initialize empty results for each choice
      const initialResults: VoteResult = {};
      vote.choices.forEach(choice => {
        initialResults[choice] = 0;
      });
      setVoteResults(initialResults);
    };
    server.onPacket['progress-vote'] = (data) => {
      const { result } = data as { result: VoteResult };
      setVoteResults(result);
    };
    server.onPacket['end-vote'] = (_) => {
      setVote(null);
      setVoteResults({});
    };
  }, [server]);

  return <>
    <div className="absolute flex flex-col bottom-24 left-1/2 -translate-x-1/2 gap-1 items-center justify-center z-[11]">
      {!connected && <DisconnectedNotification />}
      {notifications.map((n) => (
        <TextNotification key={n.id} visible={n.visible} color={n.color}>{n.text}</TextNotification>
      ))}
      {vote && <VoteNotification key={nextId.current} vote={vote} results={voteResults} />}
    </div>
  </>
}

function VoteNotification({ vote, results }: { vote: Vote, results: VoteResult }) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const server = useServer();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const fadeOutDuration = 150;

  // Calculate total votes
  const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
      setVisible(true);
    }, 10);

    const fadeOutTimer = setTimeout(() => {
      setVisible(false);
    }, vote.durationMs - fadeOutDuration);

    return () => clearTimeout(fadeOutTimer);
  }, []);

  useEffect(() => {
    if (selectedChoice) {
      server.send('choice-vote', selectedChoice);
    }
  }, [selectedChoice]);

  return <BaseNotification
    className="overflow-hidden text-green-700 border-1 border-green-300 border-solid font-sans font-bold px-8 !rounded-[3.5rem] text-sm"
    visible={visible}
  >
    <div className="absolute px-8 py-2 inset-0 bg-green-200/80 transform transition-transform ease-out"
      style={{
        transform: mounted ? 'translateX(0)' : 'translateX(-100%)',
        transitionDuration: `${vote.durationMs - fadeOutDuration}ms`,
        transitionTimingFunction: 'linear'
      }} />
    <div className="relative z-10 flex flex-col">
      <span className="text-xs">{vote.question}</span>
      <div className="flex gap-2 justify-center">
        {vote.choices.map((choice) => (
          <button
            key={choice}
            className={`
              px-4 py-1 rounded-full text-sm cursor-pointer transition-all duration-300
              ${selectedChoice === choice 
                ? 'bg-green-500 text-white border-2 border-green-400 shadow-lg scale-[1.02]' 
                : 'bg-green-400/30 text-black/70 border border-green-200/50 hover:bg-green-400/50 hover:text-black hover:border-green-300'
              }
            `}
            onClick={() => setSelectedChoice(choice)}
          >
            {choice}
          </button>
        ))}
      </div>
      
      {totalVotes > 0 && (
        <div className="mt-1 w-full">
          {vote.choices.map((choice) => {
            const voteCount = results[choice] || 0;
            const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
            
            return (
              <div key={`progress-${choice}`} className="mb-1 text-xs">
                <div className="flex justify-between mb-1">
                  <span>{choice}</span>
                  <span>{voteCount} votes ({percentage}%)</span>
                </div>
                <div className="w-full bg-green-100 rounded-full h-2.5">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </BaseNotification>
}
function TextNotification({ children, visible = true, color }: { children: any, visible?: boolean, color: NotificationColor }) {
  let className = 'bg-pink-100/80 text-pink-700 border-1 border-pink-300 border-solid font-sans font-bold'
  if (color === 'green') {
    className = 'bg-green-100/80 text-green-700 border-1 border-green-300 border-solid font-sans font-bold'
  } else if (color === 'yellow') {
    className = 'bg-yellow-100/80 text-yellow-700 border-1 border-yellow-300 border-solid font-sans font-bold'
  } else if (color === 'red') {
    className = 'bg-red-950/80 text-red-100 border-1 border-red-500 border-solid font-sans font-bold'
  }

  return <BaseNotification
    className={className}
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