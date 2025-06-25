"use client";

import React, { useState, ChangeEvent, useEffect } from "react";

export interface Field {
  id: number;
  name: string;
  label: string;
  type: string;
}

interface ImageRecord {
  file: File;
  data: Record<string, string>;
}

const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

const defaultField = (): Field => ({
  id: Date.now(),
  name: "",
  label: "",
  type: "text",
});
interface Props {
  initialFields?: Omit<Field, "id">[];
}

export default function MultiImageForm({ initialFields }: Props) {
  const [fields, setFields] = useState<Field[]>([defaultField()]);
  const [records, setRecords] = useState<ImageRecord[]>([]);

  // Initialize fields from props
  useEffect(() => {
    if (initialFields && initialFields.length > 0) {
      setFields(
        initialFields.map((f) => ({ ...f, id: Date.now() + Math.random() })),
      );
    }
  }, [initialFields]);

  const handleFieldChange = (
    idx: number,
    key: keyof Field,
    value: string,
  ) => {
    setFields((prev) =>
      prev.map((f, i) => {
        if (i !== idx) return f;
        const updated = { ...f, [key]: value } as Field;
        if (key === "label") {
          updated.name = slugify(value);
        }
        return updated;
      }),
    );
  };

  const addField = () => setFields((prev) => [...prev, defaultField()]);
  const removeField = (idx: number) =>
    setFields((prev) => prev.filter((_, i) => i !== idx));

  const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setRecords(files.map((file) => ({ file, data: {} })));
  };

  const handleRecordChange = (
    recIdx: number,
    fieldName: string,
    value: string,
  ) => {
    setRecords((prev) =>
      prev.map((rec, i) =>
        i === recIdx
          ? { ...rec, data: { ...rec.data, [fieldName]: value } }
          : rec,
      ),
    );
  };

  return (
    <div className="p-4 space-y-4">
      <section>
        <h2 className="font-bold mb-2">Champs du formulaire</h2>
        {fields.map((field, idx) => (
          <div key={field.id} className="flex gap-2 mb-2 items-end">
            <input
              className="input input-bordered flex-1"
              placeholder="Label"
              value={field.label}
              onChange={(e) =>
                handleFieldChange(idx, "label", e.target.value)
              }
            />
            <select
              className="select select-bordered"
              value={field.type}
              onChange={(e) =>
                handleFieldChange(idx, "type", e.target.value)
              }
            >
              <option value="text">Texte</option>
              <option value="number">Nombre</option>
              <option value="date">Date</option>
            </select>
            <button
              className="btn btn-error"
              onClick={() => removeField(idx)}
            >
              Supprimer
            </button>
          </div>
        ))}
        <button className="btn btn-primary" onClick={addField}>
          Ajouter un champ
        </button>
      </section>

      <section>
        <h2 className="font-bold mb-2">Images</h2>
        <input
          type="file"
          multiple
          accept="image/*"
          className="file-input file-input-bordered w-full"
          onChange={handleFiles}
        />
      </section>

      {records.length > 0 && (
        <section>
          <h2 className="font-bold mb-2">Informations</h2>
          <table className="table w-full">
            <thead>
              <tr>
                <th>Image</th>
                {fields.map((f) => (
                  <th key={f.id}>{f.label || "Champ"}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((rec, recIdx) => (
                <tr key={recIdx}>
                  <td>
                    <img
                      src={URL.createObjectURL(rec.file)}
                      alt="aperçu"
                      className="h-20"
                    />
                  </td>
                  {fields.map((f) => (
                    <td key={f.id}>
                      <input
                        type={f.type}
                        className="input input-bordered w-full"
                        value={rec.data[f.name] || ""}
                        onChange={(e) =>
                          handleRecordChange(
                            recIdx,
                            f.name,
                            e.target.value,
                          )
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
