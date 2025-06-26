"use client";

import React, { useEffect, useState } from "react";
import Bubble from "./component/Bubble";
import ChatInterface from "./component/chat-interface";
import { ThemeProvider } from "next-themes";
import { API_URL } from "@/lib/api";
import ChatModal from "./component/ChatModal";

const services = [
  {
    id: 1,
    name: "Générateur de formulaire",
    color: "bg-blue-500",
    link: "/form-builder",
  },
  {
    id: 2,
    name: "Extracteur PDF",
    color: "bg-green-500",
    link: "/form-extractor",
  },
  { id: 3, name: "Recherche CV", color: "bg-purple-500", link: "/search" },
];

interface Step {
  prompt: string;
  dependencies: number[];
  idx: number;
}

interface Chat {
  id: number;
  title: string;
  description: string;
  globalPrompt?: string;
  steps: Step[];
}

export default function Page() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Chat | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/chat-infinite`)
      .then((r) => r.json())
      .then(setChats);
  }, []);

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );
  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <ThemeProvider>
        <main className="flex min-h-screen p-2">
          <div className="w-1/5">
            <ChatInterface />
          </div>
          <div className="flex flex-col flex-1 items-center mt-10 space-y-10">
            <input
              className="input input-bordered w-80"
              placeholder="Recherche"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="flex flex-wrap justify-center gap-10">
              {filteredServices.map((s) => (
                <Bubble key={s.id} service={s} />
              ))}
              {filteredChats.map((c) => (
                <Bubble
                  key={`c-${c.id}`}
                  service={{
                    id: `${c.id}`,
                    name: c.title,
                    color: "bg-pink-500",
                  }}
                  onClick={() => setSelected(c)}
                />
              ))}
            </div>
          </div>
        </main>
      </ThemeProvider>
      {selected && (
        <ChatModal
          open={true}
          chat={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
