"use client"
import { useState } from "react"
import { API_URL } from "@/lib/api"

interface Field {
  name: string
  label: string
  type: string
}

interface Step {
  prompt: string
  dependencies: number[]
  idx: number
}

interface Template {
  id: number
  title: string
  schema: Field[]
  chatSteps: Step[]
  chatGlobalPrompt?: string
}

export default function ExtractionModal({ open, onClose, template }: { open: boolean; onClose: () => void; template: Template }) {
  const [files, setFiles] = useState<File[]>([])
  const [records, setRecords] = useState<Record<string, string>[]>([])
  const [outputs, setOutputs] = useState<string[]>([])
  const [currentFile, setCurrentFile] = useState<number | null>(null)
  const [currentStep, setCurrentStep] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const readFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fs = Array.from(e.target.files || [])
    setFiles(fs)
    setRecords(fs.map(() => ({})))
    setOutputs([])
  }

  const processFiles = async () => {
    if (loading || files.length === 0) return
    setLoading(true)
    const resRecords: Record<string, string>[] = []
    const steps = [...template.chatSteps].sort((a, b) => a.idx - b.idx)
    for (let i = 0; i < files.length; i++) {
      setCurrentFile(i)
      const image = await readFile(files[i])
      const r = await fetch(`${API_URL}/extract-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: template.schema, image })
      })
      const data = await r.json()
      resRecords.push(data)
    }
    setRecords(resRecords)
    setCurrentFile(null)
    const stepOutputs: string[] = []
    let inputBase = JSON.stringify(resRecords)
    for (let j = 0; j < steps.length; j++) {
      const step = steps[j]
      if (!step.prompt.trim()) continue
      setCurrentStep(j)
      const deps = step.dependencies.length > 0 ? step.dependencies : [j - 1]
      const input = deps.map(d => (d === -1 ? inputBase : stepOutputs[d] || "")).join("\n")
      const resp = await fetch(`${API_URL}/universal-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, prompt: step.prompt, globalPrompt: template.chatGlobalPrompt })
      })
      const out = await resp.json()
      stepOutputs[j] = out.output
    }
    setOutputs(stepOutputs)
    setCurrentStep(null)
    setLoading(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 p-4 rounded w-[32rem] space-y-4 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <h2 className="font-bold text-xl">{template.title}</h2>
        <input type="file" multiple accept="image/*,application/pdf" className="file-input file-input-bordered w-full" onChange={handleFiles} />
        <button className="btn btn-primary w-full" onClick={processFiles} disabled={loading || files.length === 0}>{loading ? "..." : "Lancer"}</button>
        {records.map((rec, i) => (
          <div key={i} className="border p-2 rounded space-y-2">
            <div className="font-bold">{files[i]?.name}</div>
            <pre className="whitespace-pre-wrap break-words bg-gray-100 dark:bg-slate-800 p-2 rounded text-xs">{JSON.stringify(rec, null, 2)}</pre>
          </div>
        ))}
        {outputs.length > 0 && (
          <ul className="space-y-2">
            {outputs.map((o, j) => (
              <li key={j} className="border p-2 rounded flex items-start gap-2">
                <div className="font-bold">Étape {j + 1}</div>
                <div className="whitespace-pre-wrap break-words flex-1">{o}</div>
                {currentStep === j && <span className="loading loading-spinner" />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
