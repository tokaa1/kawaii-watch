import type { PacketDataLover } from "../context/server";
import { useState, useEffect } from "react";

// get color from hash for university
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 50%)`;
}

function ethnicityToColor(ethnicity: string): string {// gpt made these
  const map: Record<string, string> = {
    "chinese": "#ff4d4d", // bright red - symbolizes luck and joy in Chinese culture
    "korean": "#4dabf7", // blue - from Korean flag, represents trust
    "japanese": "#ff66b3", // cherry blossom pink - cultural symbol
    "vietnamese": "#ffde59", // yellow - represents prosperity in Vietnamese culture
    "thai": "#91d5ff", // light blue - from Thai flag
    "indian": "#ff9933", // saffron - from Indian flag, represents courage
    "filipino": "#4cc9f0", // light blue - from Filipino flag
    "malaysian": "#ffd700", // gold - represents royalty in Malaysian culture
    "indonesian": "#ff3d00", // bright red - from Indonesian flag
    "cambodian": "#3db2ff", // blue - from Cambodian flag
    "singaporean": "#ff375f", // red - from Singaporean flag
    "burmese": "#ffd166", // golden yellow - represents peace in Burmese culture
    "laotian": "#06d6a0", // teal - from Laotian cultural elements
    "mongolian": "#ff7e67", // orange-red - from Mongolian cultural symbols
    "pakistani": "#01a368", // green - from Pakistani flag, represents Islam
    "bangladeshi": "#00b4d8", // teal blue - from Bangladeshi cultural elements
    "taiwanese": "#00b4d8", // blue - from Taiwanese cultural elements
    "mixed": "#c77dff", // purple - represents diversity and mixture
    "asian": "#38b000", // green - general representation of Asia
    "american": "#e9ecef" // light gray - neutral tone
  };
  const key = ethnicity.trim().toLowerCase();
  return map[key] || stringToColor(key);
}

export function ProfilesDisplay({ boy, girl }: { boy: PacketDataLover; girl: PacketDataLover; }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 10); }, []);
  const hexBgOpacity = '40';
  return (
    <div className={`self-center sticky top-0 flex gap-8 z-[10] transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
      <MiniProfile lover={girl} textColor="text-pink-400" borderColor="border-pink-300" />
      <MiniProfile lover={boy} textColor="text-indigo-400" borderColor="border-indigo-300" />
    </div>
  );
}

function MiniProfile({ lover, textColor, borderColor }: { lover: PacketDataLover; textColor: string; borderColor: string; }) {
  const ethnicityColor = ethnicityToColor(lover.ethnicity);
  const textShadow = "0 1px 4px rgba(0,0,0,0.25), 0 0.5px 0px #fff2";
  return (
    <div className={`px-3 py-1 rounded-3xl border ${borderColor} bg-black/50 shadow-sm flex items-center gap-2 text-xs font-sans`}>
      <span className={`font-bold ${textColor}`} style={{ textShadow }}>{lover.name}</span>
      <span className="bg-white/30 px-2 py-0.5 rounded-full border-[1.5px] border-solid border-zinc-600 text-zinc-100 font-semibold" style={{ textShadow }}>{lover.age}</span>
      <span
        className="bg-white/30 px-2 py-0.5 rounded-full font-semibold"
        style={{ color: ethnicityColor, border: `1.5px solid ${ethnicityColor}`, textShadow }}
      >
        {lover.ethnicity}
      </span>
      <span
        className="italic font-semibold text-white"
      >
        {lover.university}
      </span>
    </div>
  );
}