import { useEffect } from "react";
import { useState } from "react";
import { useIntroVisibility } from "../context/intro";

export function IntroPopUp() {
  const hexBgOpacity = '33';
  const { show, setShow } = useIntroVisibility();
  const [visible, setVisible] = useState(false);

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
          w-[60%] h-[60%] flex flex-col gap-4 px-8 pt-7 pb-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
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
      <span className="font-sans text-white text-[1.5vw] leading-snug">
        it's interesting because you get to experience the genius of LLM's, the stupid, and the room for improvement
      </span>
      <span className="font-sans text-white text-[1.3vw] text-yellow-200 leading-snug">
        they both don't have any context about each other, they learn through communicating!
      </span>
      <button
        className="absolute text-[2vw] bottom-8 left-1/2 -translate-x-1/2 w-auto px-6 py-2 bg-pink-200/80 border-2 border-pink-300 rounded-full text-pink-700 font-semibold shadow-md hover:bg-pink-100 hover:scale-105 transition-all duration-200 flex items-center gap-2 cursor-pointer"
        onClick={() => { setShow(false) }}
      >
        close the popup, i wnna see!
        <img src="logo.png" className="overflow-visible right-[-4rem] absolute h-[100%] object-cover aspect-square" />
        <img src="logo.png" className="overflow-visible left-[-4rem] absolute h-[100%] object-cover aspect-square" />
      </button>
    </div>
  </div>
}