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
  value?: string;
}

interface Props {
  schema: FormField[];
  onSubmit: (data: Record<string, any>) => void;
}

export const DynamicForm: React.FC<Props> = ({ schema, onSubmit }) => {
  const [formState, setFormState] = useState<Record<string, any>>({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, type, value, checked, files } = e.target;
    if (type === "checkbox") {
      setFormState((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "file") {
      setFormState((prev) => ({ ...prev, [name]: files?.[0] ?? null }));
    } else {
      setFormState((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formState);
  };

  return (
    <form onSubmit={handleSubmit}>
      {schema.map((field, idx) => (
        <fieldset key={`${field.name}-${idx}`} className="fieldset">
          <legend className="fieldset-legend">{field.label}</legend>

          {/* Select */}
          {field.type === "select" && (
            <select
              name={field.name}
              className="select select-bordered w-full"
              onChange={handleChange}
              defaultValue=""
              required={field.required}
            >
              <option disabled value="">
                -- Choisir --
              </option>
              {field.options?.map((opt, optIdx) => (
                <option key={`${field.name}-option-${optIdx}`} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}

          {/* Textarea */}
          {field.type === "textarea" && (
            <textarea
              name={field.name}
              placeholder={field.placeholder}
              className="textarea textarea-bordered w-full"
              onChange={handleChange}
              required={field.required}
            />
          )}

          {/* Radio */}
          {field.type === "radio" && field.options && (
            <div className="flex flex-col gap-2 mt-2">
              {field.options.map((opt, optIdx) => (
                <label
                  key={`${field.name}-radio-${optIdx}`}
                  className="label cursor-pointer"
                >
                  <input
                    type="radio"
                    name={field.name}
                    value={opt}
                    onChange={handleChange}
                    className="radio radio-primary"
                    required={field.required}
                  />
                  <span className="label-text ml-2">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {/* Checkbox */}
          {field.type === "checkbox" && (
            <label className="label cursor-pointer gap-2 mt-2">
              <input
                type="checkbox"
                name={field.name}
                className="checkbox checkbox-primary"
                onChange={handleChange}
                required={field.required}
              />
              <span className="label-text">
                {field.placeholder ?? field.label}
              </span>
            </label>
          )}

          {/* Default inputs */}
          {[
            "text",
            "number",
            "email",
            "date",
            "file",
            "color",
            "url",
            "tel",
            "time",
            "week",
            "month",
            "range",
            "search",
            "datetime-local",
          ].includes(field.type) && (
            <input
              key={`${field.name}-input`}
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              className="input input-bordered w-full"
              onChange={handleChange}
              required={field.required}
              value={field.value || ""}
            />
          )}

          {field.description && (
            <p className="label mt-1">{field.description}</p>
          )}
        </fieldset>
      ))}

      <div className="text-right">
        <button className="btn btn-primary" type="submit">
          Valider
        </button>
      </div>
    </form>
  );
};
