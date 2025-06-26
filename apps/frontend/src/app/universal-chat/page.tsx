"use client"
import UniversalChat from "@/components/UniversalChat"
import { useEffect, useState } from "react"
import { API_URL } from "@/lib/api"

interface Step {
  prompt: string
  dependencies: number[]
}

interface Chat {
  id: number
  title: string
  description: string
  globalPrompt?: string
  steps: (Step & { idx: number })[]
}

export default function UniversalChatPage({ searchParams }: { searchParams?: { id?: string } }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState<Step[]>([{ prompt: '', dependencies: [-1] }])
  const [globalPrompt, setGlobalPrompt] = useState('')

  useEffect(() => {
    if (!searchParams?.id) return
    fetch(`${API_URL}/chat-infinite/${searchParams.id}`)
      .then(r => r.json())
      .then((c: Chat) => {
        setTitle(c.title)
        setDescription(c.description)
        setGlobalPrompt(c.globalPrompt || '')
        setSteps(c.steps.length > 0 ? c.steps.map(s => ({ prompt: s.prompt, dependencies: s.dependencies })) : [{ prompt: '', dependencies: [-1] }])
      })
  }, [searchParams?.id])

  const save = async () => {
    const payload = { title, description, globalPrompt, steps }
    const method = searchParams?.id ? 'PUT' : 'POST'
    const url = searchParams?.id ? `${API_URL}/chat-infinite/${searchParams.id}` : `${API_URL}/chat-infinite`
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    if (!searchParams?.id && data.id) {
      window.location.search = `?id=${data.id}`
    }
  }

  return (
    <div className="p-4 space-y-4">
      <input className="input input-bordered w-full" placeholder="Titre" value={title} onChange={e => setTitle(e.target.value)} />
      <input className="input input-bordered w-full" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
      <UniversalChat key={steps.length} initialSteps={steps} initialGlobalPrompt={globalPrompt} onChange={(s,g)=>{setSteps(s);setGlobalPrompt(g)}} />
      <button className="btn btn-primary" onClick={save}>Sauvegarder</button>
    </div>
  )
}
