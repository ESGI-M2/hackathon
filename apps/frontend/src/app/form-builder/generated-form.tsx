"use client";

import React, { useState } from "react";
import { DynamicForm } from "@/components/DynamicForm";
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

  async function fetchSchema() {
    setLoading(true);
    setError(null);
    setSchema(null);
    try {
      const res = await fetch("/api/generative-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
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
          Générez un formulaire automatiquement à partir d’une description.
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
            onSubmit={(data) => {
              console.log("Données soumises :", data);
            }}
          />
        </div>
      )}
    </main>
  );
}
