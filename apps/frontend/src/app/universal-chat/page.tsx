"use client"
import UniversalChat from "@/components/UniversalChat"
import { useEffect, useState } from "react"
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

export default function UniversalChatPage({ searchParams }: { searchParams?: { id?: string } }) {
  const [chat, setChat] = useState<Chat | null>(null)

  useEffect(() => {
    if (!searchParams?.id) return
    fetch(`${API_URL}/chat-infinite/${searchParams.id}`).then(r => r.json()).then(setChat)
  }, [searchParams?.id])

  return (
    <div className="p-4">
      <UniversalChat initialSteps={chat?.steps || []} initialGlobalPrompt={chat?.globalPrompt || ''} />
    </div>
  )
}
