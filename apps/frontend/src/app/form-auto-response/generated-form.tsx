"use client";

import React, { useState } from "react";
import { DynamicForm } from "./component/DynamicForm";
import { Button } from "@/components/button";
import { Alert, AlertTitle } from "@/components/alert";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";

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

export default function GeneratedFormPage() {
  const [prompt, setPrompt] = useState<string>("");
  const [schema, setSchema] = useState<FormField[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailContent, setEmailContent] = useState<string>("");

  async function fetchSchema() {
    setLoading(true);
    setError(null);
    setSchema(null);
    try {
      const res = await fetch("/api/generative-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prompt.trim()),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Error ${res.status}: ${txt}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let jsonString = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        jsonString += decoder.decode(value);
      }

      const { fields }: { fields: FormField[] } = JSON.parse(jsonString);
      setSchema(fields);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="py-10 px-4 md:px-6 max-w-screen-md mx-auto text-white min-h-screen">
      <header>
        <h1 className="text-3xl font-semibold md:text-4xl">Form Generator</h1>
        <p className="mt-2 text-gray-300">
          Générez un email de réponse à partir d'un autre.
        </p>
      </header>

      {!schema && (
        <div className="mt-10">
          <textarea
            className="w-full mb-4 p-4 rounded-md border border-gray-700 bg-white text-black placeholder-gray-500"
            placeholder="Décrivez votre besoin ici..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
          />
          <Button
            className="w-full bg-white text-black hover:bg-gray-200 font-semibold"
            onClick={fetchSchema}
            disabled={loading || !prompt.trim()}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="size-4 mr-2" />
                Générer
              </>
            )}
          </Button>
        </div>
      )}

      {error && (
        <div className="mt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        </div>
      )}

      {schema && (
        <div className="mt-10">
          <DynamicForm
            schema={schema}
          onSubmit={async (data) => {
            const fields = Object.entries(data).map(([key, value]) => ({
              label: key,
              name: key,
              value: value ?? "",
              type: "text",
              placeholder: "",
              description: "",
              required: false,
            }));

          const body = {
            fields,
            tone: data.tone || "Professionnel",
            subject: data.subject || "non précisé",
          };

          const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

  if (!res.ok) {
    const errorText = await res.text();
    setError(errorText);
    return;
  }

  const json = await res.json();
  setEmailContent(json.email_content);
}}

          />
        </div>
      )}

      {emailContent && (
        <div className="mt-8 p-4 border border-gray-600 rounded bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">Email généré :</h2>
          <pre className="whitespace-pre-wrap">{emailContent}</pre>
        </div>
      )}
    </main>
  );
}
