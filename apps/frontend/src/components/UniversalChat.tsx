"use client";
import { useState, useEffect } from "react";
import StepFlow from "./StepFlow";
import { API_URL } from "@/lib/api";

interface Step {
  prompt: string
  dependencies: number[]
}

interface Props {
  initialSteps?: Step[];
  initialGlobalPrompt?: string;
  initialInput?: string;
  onChange?: (steps: Step[], globalPrompt: string) => void;
}

const readFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

export default function UniversalChat({ initialSteps = [], initialGlobalPrompt = '', initialInput = '', onChange }: Props) {
  const [steps, setSteps] = useState<Step[]>(
    initialSteps.length > 0 ? initialSteps : [{ prompt: '', dependencies: [-1] }],
  )
  const [globalPrompt, setGlobalPrompt] = useState(initialGlobalPrompt);
  const [input, setInput] = useState(initialInput);
  const [file, setFile] = useState<File | null>(null);
  const [outputs, setOutputs] = useState<string[]>([]);
  const [durations, setDurations] = useState<number[]>([]);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  useEffect(() => {
    onChange?.(steps, globalPrompt)
  }, [steps, globalPrompt, onChange])

  useEffect(() => {
    setInput(initialInput)
  }, [initialInput])

  const updatePrompt = (idx: number, value: string) => {
    console.debug('updatePrompt', idx, value)
    setSteps(prev => prev.map((s, i) => (i === idx ? { ...s, prompt: value } : s)))
  }

  const updateDeps = (idx: number, deps: number[]) => {
    console.debug('updateDeps', idx, deps)
    setSteps(prev => prev.map((s, i) => (i === idx ? { ...s, dependencies: deps } : s)))
  }

  const addStep = () => {
    console.debug('addStep')
    setSteps(prev => [...prev, { prompt: '', dependencies: [prev.length - 1] }])
  }

  const resetDeps = (idx: number) => {
    updateDeps(idx, [idx > 0 ? idx - 1 : -1])
  }

  const removeStep = (idx: number) => {
    console.debug('removeStep', idx)
    setSteps(prev =>
      prev
        .filter((_, i) => i !== idx)
        .map((s, i) => {
          const deps = s.dependencies
            .filter(d => d !== idx)
            .map(d => (d > idx ? d - 1 : d))
          return { ...s, dependencies: deps.length > 0 ? deps : [i - 1] }
        }),
    )
  }

  const moveStep = (idx: number, dir: number) => {
    console.debug('moveStep', idx, dir)
    setSteps(prev => {
      const target = idx + dir
      if (target < 0 || target >= prev.length) return prev
      const arr = [...prev]
      const [s] = arr.splice(idx, 1)
      arr.splice(target, 0, s)
      const map = prev.map((_, i) => {
        if (i === idx) return target
        if (dir > 0 && i > idx && i <= target) return i - 1
        if (dir < 0 && i < idx && i >= target) return i + 1
        return i
      })
      return arr.map((step, i) => {
        const deps = step.dependencies.map(d => (d === -1 ? -1 : map[d]))
        return { ...step, dependencies: deps.length > 0 ? deps : [i - 1] }
      })
    })
  }

  const send = async () => {
    const prompts = steps.map(s => s.prompt.trim()).filter(Boolean)
    if (prompts.length === 0) return
    console.debug('send start', prompts)
    setOutputs([])
    setDurations([])
    let current = input
    const media = file ? await readFile(file) : undefined
    const outs: string[] = []
    const times: number[] = []
    for (let idx = 0; idx < steps.length; idx++) {
      const step = steps[idx]
      if (!step.prompt.trim()) continue
      setLoadingIndex(idx)
      const deps = step.dependencies && step.dependencies.length > 0 ? step.dependencies : [idx - 1]
      current = deps.map(d => (d === -1 ? input : outs[d] || '')).join('\n')
      console.debug('step request', { idx, prompt: step.prompt, input: current })
      const start = performance.now()
      const res = await fetch(`${API_URL}/universal-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: current, prompt: step.prompt, globalPrompt, media }),
      })
      const data = await res.json()
      outs[idx] = data.output
      times[idx] = performance.now() - start
      console.debug('step output', { idx, output: data.output, duration: times[idx] })
      setOutputs([...outs])
      setDurations([...times])
    }
    setLoadingIndex(null)
  }

  const renderTree = (idx: number, visited: Set<number>): JSX.Element | null => {
    if (visited.has(idx)) return null
    visited.add(idx)
    const deps = (steps[idx].dependencies.length > 0 ? steps[idx].dependencies : [idx - 1]).filter(d => d >= 0)
    return (
      <li key={idx} className="border-l pl-4">
        <div className="ml-2">
          <div className="font-bold">Étape {idx + 1} ({Math.round(durations[idx] || 0)} ms)</div>
          <div className="whitespace-pre-wrap break-words chat-bubble chat-bubble-primary">{outputs[idx]}</div>
        </div>
        {deps.length > 0 && <ul className="ml-4 flex flex-col-reverse">{deps.map(d => renderTree(d, visited))}</ul>}
      </li>
    )
  }


  return (
    <div className="space-y-4">
      {steps.map((step, idx) => {
        const options = [-1, ...steps.slice(0, idx).map((_, i) => i)]
        const selected = step.dependencies.length > 0 ? step.dependencies : [idx - 1]
        const label = selected
          .map(o => (o === -1 ? 'Entrée' : `Étape ${o + 1}`))
          .join(', ')
        return (
          <div key={idx} className="space-y-2 border p-2 rounded-box">
            <div className="flex gap-2 items-center">
              <span className="w-6 text-right">{idx + 1}</span>
              <input
                className="input input-bordered flex-1"
                placeholder={`Étape ${idx + 1}`}
                value={step.prompt}
                onChange={e => updatePrompt(idx, e.target.value)}
              />
              <span className="truncate max-w-xs">{label}</span>
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn">+</div>
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                  {options.map(o => (
                    <li key={o}>
                      <label className="label cursor-pointer gap-2">
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={step.dependencies.includes(o)}
                          onChange={e => {
                            const checked = e.target.checked
                            const deps = checked
                              ? [...step.dependencies, o]
                              : step.dependencies.filter(d => d !== o)
                            updateDeps(idx, Array.from(new Set(deps)))
                          }}
                        />
                        <span>{o === -1 ? 'Entrée' : `Étape ${o + 1}`}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
              <button className="btn" onClick={() => resetDeps(idx)}>↺</button>
              <button className="btn" disabled={idx === 0} onClick={() => moveStep(idx, -1)}>↑</button>
              <button className="btn" disabled={idx === steps.length - 1} onClick={() => moveStep(idx, 1)}>↓</button>
              <button className="btn btn-error" onClick={() => removeStep(idx)}>Supprimer</button>
            </div>
          </div>
        )
      })}
      <button className="btn btn-secondary" onClick={addStep}>
        Ajouter une étape
      </button>
      <input
        className="input input-bordered w-full"
        placeholder="Prompt global"
        value={globalPrompt}
        onChange={(e) => setGlobalPrompt(e.target.value)}
      />
      <textarea
        className="textarea textarea-bordered w-full"
        placeholder="Entrée"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <input
        type="file"
        accept="image/*"
        className="file-input file-input-bordered w-full"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button className="btn btn-primary" onClick={send} disabled={loadingIndex !== null}>
        {loadingIndex !== null ? `Étape ${loadingIndex + 1}...` : "Envoyer"}
      </button>
      <div>
        <div className="font-bold mb-2">Prévisualisation</div>
        <StepFlow steps={steps} />
      </div>
      {outputs.length > 0 && (
        <ul className="space-y-2 flex flex-col-reverse">
          {renderTree(steps.length - 1, new Set())}
          {loadingIndex !== null && <li className="loading loading-spinner" />}
        </ul>
      )}
    </div>
  );
}
