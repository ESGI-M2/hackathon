"use client"
import { useState } from "react"
import { API_URL } from "@/lib/api"

interface Step {
  prompt: string
  dependencies: number[]
  idx: number
}

interface Chat {
  id: number
  title: string
  description: string
  globalPrompt?: string
  steps: Step[]
}

export default function ChatModal({ open, onClose, chat }: { open: boolean; onClose: () => void; chat: Chat }) {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const runChat = async () => {
    if (loading) return
    setLoading(true)
    const steps = [...chat.steps].sort((a, b) => a.idx - b.idx)
    const results: string[] = []
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      if (!step.prompt.trim()) continue
      const deps = step.dependencies.length > 0 ? step.dependencies : [i - 1]
      const current = deps.map(d => (d === -1 ? input : results[d] || "")).join("\n")
      const res = await fetch(`${API_URL}/universal-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: current, prompt: step.prompt, globalPrompt: chat.globalPrompt })
      })
      const data = await res.json()
      results[i] = data.output
    }
    setOutput(results[results.length - 1] || "")
    setLoading(false)
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 p-4 rounded w-96 space-y-2" onClick={e => e.stopPropagation()}>
        <h2 className="font-bold text-xl">{chat.title}</h2>
        <input className="input input-bordered w-full" value={input} onChange={e => setInput(e.target.value)} placeholder="Entrée" />
        <button className="btn btn-primary w-full" onClick={runChat} disabled={loading}>{loading ? "..." : "Envoyer"}</button>
        {output && <div className="whitespace-pre-wrap border p-2 rounded">{output}</div>}
      </div>
    </div>
  )
}
