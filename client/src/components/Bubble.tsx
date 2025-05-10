import { useEffect, useState } from "react"

export function Bubble({ children, left, className }: { children: any, left: boolean, className?: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
  }, [])

  return (
    <div className={`w-full flex ${left ? "justify-start" : "justify-end"}`}>
      <div
        className={`
            max-w-[70%]
            w-fit px-4 py-2 rounded-2xl font-medium text-lg
            transition-all duration-500 ease-out
            break-words whitespace-pre-line
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
            ${left ? "bg-white/10 text-pink-100 shadow-lg" : "bg-white/10 text-indigo-300 shadow-lg"}
            hover:scale-105 transform transition-transform ${className}
          `}
        style={{
          willChange: "opacity, transform",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
        }}
      >
        {children}
      </div>
    </div>
  )
}