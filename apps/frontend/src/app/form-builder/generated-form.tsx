"use client";

import React, { useState, useEffect } from "react";
import { DynamicForm } from "@/components/DynamicForm";
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

export default function GeneratedFormPage() {
    const [prompt, setPrompt] = useState<string | null>(null);
    const [schema, setSchema] = useState<FormField[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function fetchSchema() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/generative-form`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(prompt),
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
        <div className="p-4">
            <textarea
                className="textarea textarea-bordered w-full mb-4"
                placeholder="Décrivez votre besoin ici..."
                value={prompt || ""}
                onChange={(e) => setPrompt(e.target.value)}
            />
            <button className="btn btn-primary mb-4" onClick={fetchSchema}>
                Valider
            </button>

            {schema && (
                <DynamicForm
                    schema={schema}
                    onSubmit={(data) => {
                        console.log("Données soumises :", data);
                    }}
                />
            )}
        </div>
    );
}
