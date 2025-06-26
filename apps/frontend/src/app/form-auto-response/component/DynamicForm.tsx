"use client";
import React, { useState } from "react";

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

interface Props {
  schema: FormField[];
  onSubmit: (data: Record<string, any>) => Promise<string>; // onSubmit renvoie un string
}

export const DynamicForm: React.FC<Props> = ({ schema, onSubmit }) => {
  const [formState, setFormState] = useState<Record<string, any>>({
    email_content: "",
    tone: "",
  });

  const [response, setResponse] = useState<string | null>(null);

  const fixedSchema: FormField[] = [
    {
      name: "email_content",
      label: "Contenu de l'email reçu",
      type: "textarea",
      placeholder: "Copiez-collez l'email reçu ici",
      required: true,
    },
    {
      name: "tone",
      label: "Tonalité de la réponse",
      type: "select",
      options: ["Professionnel", "Amical", "Formel"],
      required: true,
    },
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await onSubmit(formState);
    setResponse(res);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {fixedSchema.map((field, idx) => (
          <fieldset key={`${field.name}-${idx}`} className="space-y-2">
            <legend className="font-semibold">{field.label}</legend>

            {field.type === "select" && (
              <select
                name={field.name}
                className="select select-bordered w-full text-black"
                onChange={handleChange}
                value={formState[field.name] || ""}
                required={field.required}
              >
                <option disabled value="">
                  -- Choisir --
                </option>
                {field.options?.map((opt, optIdx) => (
                  <option key={`${field.name}-opt-${optIdx}`} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {field.type === "textarea" && (
              <textarea
                name={field.name}
                placeholder={field.placeholder}
                className="textarea textarea-bordered w-full text-black"
                onChange={handleChange}
                required={field.required}
                value={formState[field.name] || ""}
              />
            )}

            {["text", "email", "number", "date"].includes(field.type) && (
              <input
                type={field.type}
                name={field.name}
                placeholder={field.placeholder}
                className="input input-bordered w-full text-black"
                onChange={handleChange}
                required={field.required}
                value={formState[field.name] || ""}
              />
            )}
          </fieldset>
        ))}

        <button className="btn btn-primary" type="submit">
          Valider
        </button>
      </form>

    {response && (
  <div className="space-y-2">
    <label className="font-semibold">Réponse générée :</label>
    <textarea
      className="textarea textarea-bordered w-full text-black"
      value={response}
      readOnly
      rows={6}
    />
  </div>
)}

    </div>
  );
};
