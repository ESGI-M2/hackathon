"use client";

import React from "react";
import Bubble from "./component/Bubble";
import ChatInterface from "./component/chat-interface";
import { ThemeProvider } from 'next-themes'

const services = [
  { id: 1, name: "Traducteur", color: "bg-blue-500", link: "/form-builder" },
  { id: 2, name: "Extracteur PDF", color: "bg-green-500", link: "/form-extractor" },
  { id: 3, name: "Recherche CV", color: "bg-purple-500", link: "/search" },
];

export default function Page() {
  return (
    <>
      <ThemeProvider>
     <main className="flex min-h-screen p-">
      <div className="w-1/5">
        <ChatInterface />
      </div>
      <div className="flex flex-col flex-1 items-center justify-center space-y-32 mt-10">
        {/* Top bubble */}
        <div className="flex justify-center w-full">
          <Bubble service={services[0]} />
        </div>

        {/* Bottom row */}
        <div className="flex justify-center w-full gap-40">
          <Bubble service={services[1]} />
          <Bubble service={services[2]} />
        </div>
      </div>
    </main>
    </ThemeProvider>
    </>
  );
}
