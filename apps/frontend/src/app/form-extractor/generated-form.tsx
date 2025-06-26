"use client";

import React, { useEffect, useState } from "react";
import UniversalChat from "@/components/UniversalChat";
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
  const [schema, setSchema] = useState<FormField[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [records, setRecords] = useState<Record<string, string>[]>([]);
  const [outputs, setOutputs] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [chatSteps, setChatSteps] = useState<ChatStep[]>([]);
  const [chatGlobalPrompt, setChatGlobalPrompt] = useState("");
  const [processing, setProcessing] = useState(false);
  const chatInput = JSON.stringify(records);

  useEffect(() => {
    if (!templateId) return;
    fetch(`${API_URL}/extraction-service/${templateId}`)
      .then(r => r.json())
      .then(data => {
        setTitle(data.title);
        setSchema(data.schema);
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

      const { fields }: { fields: FormField[] } = JSON.parse(jsonString);
      setSchema(fields);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!schema || !title) return;
    const payload = { title, schema, chatSteps, chatGlobalPrompt };
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
    if (!schema || files.length === 0) return;
    setProcessing(true);
    const images = await Promise.all(files.map(readFile));
    const payload = {
      fields: schema.map(({ name, label, type }) => ({ name, label, type })),
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
    setRecords(data.records || []);
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

      {schema && (
        <div className="space-y-4">
          <input
            className="input input-bordered w-full"
            placeholder="Titre"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="file-input file-input-bordered w-full"
            onChange={e => setFiles(Array.from(e.target.files || []))}
          />
          <button className="btn" type="button" onClick={runExtraction} disabled={processing || files.length === 0}>
            {processing ? "..." : "Lancer"}
          </button>
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
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {schema && (
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

      {schema && (
        <div className="pt-4">
          <button className="btn" onClick={saveTemplate}>Sauvegarder</button>
        </div>
      )}
    </div>
  );
}
