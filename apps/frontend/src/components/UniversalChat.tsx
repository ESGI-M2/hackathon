"use client";
import { useState } from "react";

interface Step {
  prompt: string;
}

interface Props {
  initialSteps?: Step[];
}

export default function UniversalChat({ initialSteps = [] }: Props) {
  const [steps, setSteps] = useState<Step[]>(
    initialSteps.length > 0 ? initialSteps : [{ prompt: "" }],
  );
  const [input, setInput] = useState("");
  const [outputs, setOutputs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const updatePrompt = (idx: number, value: string) =>
    setSteps((prev) => prev.map((s, i) => (i === idx ? { prompt: value } : s)));

  const addStep = () => setSteps((prev) => [...prev, { prompt: "" }]);

  const removeStep = (idx: number) =>
    setSteps((prev) => prev.filter((_, i) => i !== idx));

  const send = async () => {
    const prompts = steps.map((s) => s.prompt.trim()).filter(Boolean);
    if (!input.trim() || prompts.length === 0) return;
    setLoading(true);
    const res = await fetch("/api/universal-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input,
        steps: prompts.map((p) => ({ prompt: p })),
      }),
    });
    const data = await res.json();
    setOutputs(data.outputs);
    setLoading(false);
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
      <textarea
        className="textarea textarea-bordered w-full"
        placeholder="Entrée"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button className="btn btn-primary" onClick={send} disabled={loading}>
        {loading ? "Envoi..." : "Envoyer"}
      </button>
      {outputs.length > 0 && (
        <div className="space-y-2">
          {outputs.map((o, i) => (
            <div key={i} className="p-2 border rounded">
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
