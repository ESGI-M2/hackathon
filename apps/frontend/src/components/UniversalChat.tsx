"use client";
import { useState } from "react";

interface Step {
  prompt: string;
}

interface Props {
  initialSteps?: Step[];
}

const readFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export default function UniversalChat({ initialSteps = [] }: Props) {
  const [steps, setSteps] = useState<Step[]>(
    initialSteps.length > 0 ? initialSteps : [{ prompt: "" }],
  );
  const [globalPrompt, setGlobalPrompt] = useState("");
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [outputs, setOutputs] = useState<string[]>([]);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const updatePrompt = (idx: number, value: string) =>
    setSteps((prev) => prev.map((s, i) => (i === idx ? { prompt: value } : s)));

  const addStep = () => setSteps((prev) => [...prev, { prompt: "" }]);

  const removeStep = (idx: number) =>
    setSteps((prev) => prev.filter((_, i) => i !== idx));

  const send = async () => {
    const prompts = steps.map((s) => s.prompt.trim()).filter(Boolean);
    if (prompts.length === 0 || (!input.trim() && !file)) return;
    setOutputs([]);
    let current = input;
    const media = file ? await readFile(file) : undefined;
    for (const [idx, prompt] of prompts.entries()) {
      setLoadingIndex(idx);
      const res = await fetch("/api/universal-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: current, prompt, globalPrompt, media }),
      });
      const data = await res.json();
      current = data.output;
      setOutputs((prev) => [...prev, current]);
    }
    setLoadingIndex(null);
  };

  return (
    <div className="space-y-4">
      {steps.map((step, idx) => (
        <div key={idx} className="flex gap-2">
          <input
            className="input input-bordered flex-1"
            placeholder={`Étape ${idx + 1}`}
            value={step.prompt}
            onChange={(e) => updatePrompt(idx, e.target.value)}
          />
          <button className="btn btn-error" onClick={() => removeStep(idx)}>
            Supprimer
          </button>
        </div>
      ))}
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
      {outputs.length > 0 && (
        <div className="space-y-2">
          {outputs.map((o, i) => (
            <div key={i} className="p-2 border rounded">
              {o}
            </div>
          ))}
          {loadingIndex !== null && <span className="loading loading-spinner"></span>}
        </div>
      )}
    </div>
  );
}
