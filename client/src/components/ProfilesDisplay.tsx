import type { PacketDataLover } from "../context/server";
import { useState, useEffect } from "react";

// we want the same college to have the same color
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const h = hash % 360;
  return `hsl(${h}, 70%, 50%)`;
}

export function ProfilesDisplay({
  boy,
  girl
}: {
  boy: PacketDataLover;
  girl: PacketDataLover;
}) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
  }, []);
  
  const hexBgOpacity = '40';
  
  return (
    <div 
      className={`self-center sticky top-0 flex gap-15 z-[10] transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
    >
      {/* Girl's profile card */}
      <ProfileCard 
        lover={girl} 
        side="left" 
        bgColor={`#ffe0ef${hexBgOpacity}`} 
        textColor="text-pink-400" 
        borderColor="border-pink-300"
      />
      
      {/* Boy's profile card */}
      <ProfileCard 
        lover={boy} 
        side="right" 
        bgColor={`#c7eaff${hexBgOpacity}`} 
        textColor="text-indigo-400" 
        borderColor="border-indigo-300"
      />
    </div>
  );
}

function ProfileCard({
  lover,
  side,
  bgColor,
  textColor,
  borderColor,
}: {
  lover: PacketDataLover;
  side: "left" | "right";
  bgColor: string;
  textColor: string;
  borderColor: string;
}) {
  const universityColor = stringToColor(lover.university.toLowerCase());
  
  return (
    <div 
      className={`px-4 py-3 rounded-2xl backdrop-blur-xs border border-solid ${borderColor} shadow-lg hover:scale-105 transition-transform duration-300 hover:rotate-1`}
      style={{ background: bgColor }}
    >
      <div className={`flex flex-col ${side === "right" ? "items-end" : "items-start"}`}>
        <div className="flex items-center gap-2">
          <span className={`font-bold text-lg ${textColor}`}>{lover.name}</span>
        </div>
        <div className={`flex gap-1 text-xs font-medium ${textColor}/80 mt-1`}>
          <span className="bg-white/30 text-white px-2 py-0.5 rounded-full hover:bg-white/40 transition-colors">{lover.age}</span>
          <span className="bg-white/30 text-white px-2 py-0.5 rounded-full hover:bg-white/40 transition-colors">{lover.ethnicity}</span>
        </div>
        <span className="text-xs italic mt-1 font-semibold hover:underline" style={{ color: universityColor }}>{lover.university}</span>
      </div>
    </div>
  );
} 