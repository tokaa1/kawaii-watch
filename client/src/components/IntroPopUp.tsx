import { useEffect } from "react";
import { useState } from "react";
import { useIntroVisibility } from "../context/intro";
import { useServer } from "../context/server";

type Stats = {
  boys: number,
  girls: number,
  starters: number,
}

export function IntroPopUp() {
  const hexBgOpacity = '33';
  const { show, setShow } = useIntroVisibility();
  const [visible, setVisible] = useState(false);
  const server = useServer();
  const [stats, setStats] = useState<Stats>({ boys: 12, girls: 12, starters: 10 })

  useEffect(() => {
    server.onPacket['stats'] = (data: any) => {
      setStats(data as Stats);
    }
  }, []);

  useEffect(() => {
    if (show) {
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
    }
  }, [show]);

  if (!show) return null;

  return <div className="w-full h-full absolute z-[11] bg-black/80 will-change-opacity">
    <div
      className={`
          w-[60%] min-h-[60%] flex flex-col gap-4 px-8 pt-7 pb-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
          z-[12] rounded-3xl border-[1px] border-solid border-white/20
          transition-opacity duration-500 ease-out
          ${visible ? "opacity-100" : "opacity-0"}
        `}
      style={{
        background: `linear-gradient(135deg, #ffe0ef${hexBgOpacity} 0%, #b7e5b4${hexBgOpacity} 60%, #c7eaff${hexBgOpacity} 100%)`
      }}
    >
      <button
        onClick={() => setShow(false)}
        className="absolute top-8 right-8 px-3 py-1 bg-zinc-600/30 text-pink-500 rounded-full text-xl font-medium hover:bg-zinc-600/50 transition cursor-pointer"
        aria-label="Dismiss intro"
      >
        ×
      </button>
      <span className="font-sans text-white text-[4vw] font-light leading-tight">
        this is <span className="font-bold text-pink-500 text-[4vw]">kawaii-watch</span>
        <span className="ml-2 text-[1vw] text-white font-light italic">
          watch llms fall in love
        </span>
      </span>
      <span className="font-sans text-white text-[1.5vw] leading-snug">
        so pretty much, here you get to watch two llm's (<span className="text-pink-200">girl</span> and <span className="text-indigo-200">boy</span>) text each in <span className="font-bold text-red-400">REAL TIME</span>
      </span>
      <span className="font-sans text-white text-[1.1vw] text-yellow-200 leading-snug">
        they both don't have any context about each other, they learn through communicating!
      </span>
      <span className="font-sans text-white text-[1.1vw] leading-snug">
        it's interesting because you get to experience the genius of LLM's, the stupid, and the room for improvement
      </span>
      <span className="bg-black/50 p-1 text-[1.2vw] text-white">
        we have a total of <span className="text-lime-400 font-bold">{stats.boys}</span> different asian men and <span className="text-lime-400 font-bold">{stats.girls}</span> different asian women
        <br></br>
        making for <span className="text-fuchsia-400 font-bold">{stats.boys * stats.girls}</span> different combinations!
        <br></br>
        <br></br>
        conversation starters and model temperature are also randomly selected for each match, making for a total of around <span className="text-pink-500 font-bold">~{stats.boys * stats.girls * stats.starters * 5}</span> love combinations!
      </span>
      <button
        className="self-center mt-auto text-[2vw] flex w-auto px-6 py-2 bg-pink-200/80 border-2 border-pink-300 rounded-full text-pink-700 font-semibold shadow-md hover:bg-pink-100 hover:scale-105 transition-all duration-200 flex items-center gap-2 cursor-pointer"
        onClick={() => { setShow(false) }}
      >
        close the popup, i wnna see!
      </button>
      <img src="logo.png" className="overflow-visible right-8 bottom-8 absolute h-[3vw] object-cover aspect-square" />
      <img src="logo.png" className="overflow-visible left-8 bottom-8 absolute h-[3vw] object-cover aspect-square" />
    </div>
  </div>
}