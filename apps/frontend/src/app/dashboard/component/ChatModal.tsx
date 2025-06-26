"use client"
import { useState } from "react"
import { API_URL } from "@/lib/api"
import Link from "next/link"

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
  const [outputs, setOutputs] = useState<string[]>([])
  const [current, setCurrent] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const runChat = async () => {
    if (loading) return
    setLoading(true)
    const steps = [...chat.steps].sort((a, b) => a.idx - b.idx)
    const results: string[] = []
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      if (!step.prompt.trim()) continue
      setCurrent(i)
      const deps = step.dependencies.length > 0 ? step.dependencies : [i - 1]
      const inp = deps.map(d => (d === -1 ? input : results[d] || "")).join("\n")
      const res = await fetch(`${API_URL}/universal-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: inp, prompt: step.prompt, globalPrompt: chat.globalPrompt })
      })
      const data = await res.json()
      results[i] = data.output
      setOutputs([...results])
    }
    setCurrent(null)
    setLoading(false)
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 p-4 rounded w-96 space-y-2" onClick={e => e.stopPropagation()}>
        <h2 className="font-bold text-xl">{chat.title}</h2>
        <div className="text-sm">{chat.description}</div>
        <Link href={`/universal-chat?id=${chat.id}`} className="btn btn-secondary w-full">Editer</Link>
        <input className="input input-bordered w-full" value={input} onChange={e => setInput(e.target.value)} placeholder="Entrée" />
        <button className="btn btn-primary w-full" onClick={runChat} disabled={loading}>{loading ? "..." : "Envoyer"}</button>
        <ul className="space-y-2">
          {[...chat.steps]
            .sort((a, b) => a.idx - b.idx)
            .map((s, i) => (
              <li key={i} className="border p-2 rounded flex items-start gap-2">
                <div className="font-bold">Étape {i + 1}</div>
                {outputs[i] && <div className="whitespace-pre-wrap break-words flex-1">{outputs[i]}</div>}
                {current === i && <span className="loading loading-spinner" />}
              </li>
            ))}
        </ul>
      </div>
    </div>
  )
}
