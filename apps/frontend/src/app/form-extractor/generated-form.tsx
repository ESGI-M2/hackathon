"use client";

import React, { useEffect, useState } from "react";
import MultiImageForm, { ImageRecord } from "@/components/MultiImageForm";
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
  const [records, setRecords] = useState<ImageRecord[]>([]);
  const [title, setTitle] = useState("");
  const [chatSteps, setChatSteps] = useState<ChatStep[]>([]);
  const [chatGlobalPrompt, setChatGlobalPrompt] = useState("");

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
          <MultiImageForm
            initialFields={schema.map(({ name, label, type }) => ({ name, label, type }))}
            onChange={setRecords}
          />
        </div>
      )}

      {records.length > 0 && (
        <UniversalChat
          initialInput={JSON.stringify(records.map(r => r.data))}
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
