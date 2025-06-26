"use client";

import React, { useEffect, useState } from "react";
import UniversalChat from "@/components/UniversalChat";
import MultiImageForm, { Field as UIField, ImageRecord } from "@/components/MultiImageForm";
import { API_URL } from "@/lib/api";

interface FormField {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  options?: string[];
  description?: string;
  optional?: boolean;
  required?: boolean;
}

type ChatStep = { prompt: string; dependencies: number[] };

export default function GeneratedFormPage({ templateId }: { templateId?: string }) {
  const [prompt, setPrompt] = useState<string>("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [fields, setFields] = useState<UIField[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<ImageRecord[]>([]);
  const [outputs, setOutputs] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [chatSteps, setChatSteps] = useState<ChatStep[]>([]);
  const [chatGlobalPrompt, setChatGlobalPrompt] = useState("");
  const [processing, setProcessing] = useState(false);
  const chatInput = JSON.stringify(records.map(r => r.data));

  useEffect(() => {
    if (!templateId) return;
    fetch(`${API_URL}/extraction-service/${templateId}`)
      .then(r => r.json())
      .then(data => {
        setTitle(data.title);
        setFields((data.schema as FormField[]).map(f => ({ ...f, id: Date.now() + Math.random() })));
        setChatSteps(data.chatSteps ?? []);
        setChatGlobalPrompt(data.chatGlobalPrompt ?? "");
      });
  }, [templateId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageBase64(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
    };
    reader.onerror = () => {
      setError("Impossible de lire le fichier image.");
    };
    reader.readAsDataURL(file);
  };

  const fetchSchema = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!imageBase64) {
      setError("Veuillez joindre une image ou un PDF.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/extractor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: prompt,
          image: imageBase64,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Erreur ${res.status} : ${txt}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let jsonString = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        jsonString += decoder.decode(value, { stream: true });
      }

      const { fields: f } = JSON.parse(jsonString) as { fields: FormField[] };
      setFields(f.map(x => ({ ...x, id: Date.now() + Math.random() })));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (fields.length === 0 || !title) return;
    const payload = { title, schema: fields.map(({ name, label, type }) => ({ name, label, type })), chatSteps, chatGlobalPrompt };
    const url = templateId
      ? `${API_URL}/extraction-service/${templateId}`
      : `${API_URL}/extraction-service`;
    const method = templateId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.id) {
      window.location.search = `?id=${data.id}`;
    }
  };

  const readFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });

  const runExtraction = async () => {
    if (fields.length === 0 || records.length === 0) return;
    setProcessing(true);
    const images = await Promise.all(records.map(r => readFile(r.file)));
    const payload = {
      fields: fields.map(({ name, label, type }) => ({ name, label, type })),
      images,
      chatSteps,
      chatGlobalPrompt,
    };
    const res = await fetch(`${API_URL}/extract-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setRecords(records.map((r, i) => ({ ...r, data: data.records?.[i] || {}, loading: false })));
    setOutputs(data.outputs || []);
    setProcessing(false);
  };

  return (
    <div className="p-4 space-y-4">
      <form className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Décrivez votre extraction
        </label>
        <textarea
          className="textarea textarea-bordered w-full mb-4"
          placeholder="Décrivez votre extraction ici..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

          <label className="block text-sm font-medium mb-2">
            Télécharger une image ou un PDF
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="file-input file-input-bordered w-full mb-4"
            onChange={handleFileChange}
          />

          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <button
          className="btn btn-primary"
          onClick={fetchSchema}
          disabled={loading}
          type="button"
        >
          {loading ? "Analyse en cours…" : "Valider"}
        </button>
      </form>

      {fields.length > 0 && (
        <div className="space-y-4">
          <input
            className="input input-bordered w-full"
            placeholder="Titre"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <MultiImageForm
            fields={fields}
            records={records}
            autoExtract={false}
            onFieldsChange={setFields}
            onRecordsChange={setRecords}
          />
          <button className="btn" type="button" onClick={runExtraction} disabled={processing || records.length === 0}>
            {processing ? "..." : "Lancer"}
          </button>
          {outputs.length > 0 && (
            <ul className="space-y-2">
              {outputs.map((o, j) => (
                <li key={j} className="border p-2 rounded flex items-start gap-2">
                  <div className="font-bold">Étape {j + 1}</div>
                  <div className="whitespace-pre-wrap break-words flex-1">{o}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {fields.length > 0 && (
        <UniversalChat
          initialInput={chatInput}
          initialSteps={chatSteps}
          initialGlobalPrompt={chatGlobalPrompt}
          onChange={(steps, gp) => {
            setChatSteps(steps);
            setChatGlobalPrompt(gp);
          }}
        />
      )}

      {fields.length > 0 && (
        <div className="pt-4">
          <button className="btn" onClick={saveTemplate}>Sauvegarder</button>
        </div>
      )}
    </div>
  );
}
