"use client"

import { useEffect, useState } from 'react'
import UniversalChat from '@/components/UniversalChat'

interface Step { prompt: string; dependencies: number[] }
interface Chat { id: number; title: string; description: string; globalPrompt?: string; steps: Step[] }

export default function ChatInfinitePage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState<Step[]>([{ prompt: '', dependencies: [-1] }])
  const [globalPrompt, setGlobalPrompt] = useState('')
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/chat-infinite').then(r => r.json()).then(setChats)
  }, [])

  const select = (chat: Chat) => {
    setSelected(chat.id)
    setTitle(chat.title)
    setDescription(chat.description)
    setGlobalPrompt(chat.globalPrompt || '')
    setSteps(chat.steps.length > 0 ? chat.steps : [{ prompt: '', dependencies: [-1] }])
  }

  const save = async () => {
    const res = await fetch('/api/chat-infinite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, globalPrompt, steps })
    })
    const chat = await res.json()
    setChats([chat, ...chats])
    select(chat)
  }

  return (
    <div className='flex h-screen'>
      <div className='w-64 border-r overflow-y-auto'>
        {chats.map(c => (
          <div key={c.id} onClick={() => select(c)} className={`p-2 cursor-pointer ${selected === c.id ? 'bg-base-200' : ''}`}>\
<div className='font-bold truncate'>{c.title}</div><div className='text-xs truncate'>{c.description}</div></div>
        ))}
      </div>
      <div className='flex-1 p-4 space-y-4'>
        <input className='input input-bordered w-full' placeholder='Titre' value={title} onChange={e => setTitle(e.target.value)} />
        <input className='input input-bordered w-full' placeholder='Description' value={description} onChange={e => setDescription(e.target.value)} />
        <UniversalChat initialSteps={steps} initialGlobalPrompt={globalPrompt} onChange={(s,g)=>{setSteps(s);setGlobalPrompt(g)}} />
        <button className='btn btn-primary' onClick={save}>Sauvegarder</button>
      </div>
    </div>
  )
}
