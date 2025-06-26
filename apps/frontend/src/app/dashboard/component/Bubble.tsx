"use client";

import React, { useState } from "react";

interface Service {
  id: string
  name: string
  link?: string
  color: string
}

export default function Bubble({ service, onClick }: { service: Service; onClick?: () => void }) {
  const [hover, setHover] = useState(false);

  const bubbleColor = hoverBubbleColor(service.color);

  return (
    <div className="relative inline-block">
      {service.link && !onClick ? (
        <a
          href={service.link}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className={`relative flex items-center justify-center text-white text-xl font-semibold text-center rounded-full w-52 h-52 cursor-pointer select-none m-6 transition-transform duration-300 hover:scale-110 shadow-xl ${service.color}`}
        >
          {service.name}
        </a>
      ) : (
        <button
          onClick={onClick}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className={`relative flex items-center justify-center text-white text-xl font-semibold text-center rounded-full w-52 h-52 cursor-pointer select-none m-6 transition-transform duration-300 hover:scale-110 shadow-xl ${service.color}`}
        >
          {service.name}
        </button>
      )}

      {hover && (
        <div
          className="absolute top-1/2 left-1/2 w-[200px] h-[200px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ zIndex: 0 }}
        >
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * 2 * Math.PI;
            const distance = 90;
            const x = distance * Math.cos(angle);
            const y = distance * Math.sin(angle);

            return (
              <span
                key={i}
                className="absolute rounded-full"
                style={{
                  width: "14px",
                  height: "14px",
                  backgroundColor: bubbleColor,
                  top: "50%",
                  left: "50%",
                  transformOrigin: "center",
                  animation: "explode 0.8s ease-out forwards",
                  animationDelay: `${i * 0.08}s`,
                  "--x": `${x}px`,
                  "--y": `${y}px`,
                  boxShadow: `0 0 6px ${bubbleColor}`,
                } as React.CSSProperties}
              />
            );
          })}
        </div>
      )}

      <style jsx>{`
        @keyframes explode {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.3);
          }
          30% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            opacity: 0;
            transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(0.5);
          }
        }
      `}</style>
    </div>
  );
}

function hoverBubbleColor(color: string) {
  if (color.includes("from-pink-500")) return "#ff4d6d";
  if (color.includes("from-blue-500")) return "#38bdf8";
  if (color.includes("from-purple-500")) return "#a78bfa";
  return "rgba(255,255,255,0.8)";
}
