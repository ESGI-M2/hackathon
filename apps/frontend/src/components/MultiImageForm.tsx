"use client";

import React, { useState, ChangeEvent, useEffect } from "react";
import { API_URL } from "@/lib/api";

export interface Field {
  id: number;
  name: string;
  label: string;
  type: string;
}

interface ImageRecord {
  file: File;
  data: Record<string, string>;
  loading?: boolean;
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

  const readFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const extractForFile = async (file: File, idx: number) => {
    try {
      const image = await readFile(file);
      const res = await fetch(`${API_URL}/extract-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: fields.map(({ name, label, type }) => ({ name, label, type })),
          image,
        }),
      });
      if (!res.ok) {
        console.error("Extraction error", await res.text());
        return;
      }
      const text = await res.text();
      const data = JSON.parse(text);
      setRecords((prev) =>
        prev.map((r, i) => (i === idx ? { ...r, data, loading: false } : r)),
      );
    } catch (err) {
      console.error("Extraction failed", err);
    }
  };

  const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setRecords(files.map((file) => ({ file, data: {}, loading: true })));
    files.forEach((file, idx) => {
      extractForFile(file, idx);
    });
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

  const exportCSV = () => {
    const header = ["Fichier", ...fields.map((f) => f.label || f.name)];
    const rows = records.map((rec) => [
      rec.file.name,
      ...fields.map((f) => rec.data[f.name] || ""),
    ]);

    const escape = (val: string) =>
      `"${val.replace(/"/g, '""')}"`;

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => escape(String(cell ?? ""))).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "extraction.csv";
    link.click();
    URL.revokeObjectURL(url);
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleFieldChange(idx, "label", e.target.value)
              }
            />
            <select
              className="select select-bordered"
              value={field.type}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
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
          <h2 className="font-bold mb-2 flex items-center justify-between">
            <span>Informations</span>
            <button className="btn btn-secondary btn-sm" onClick={exportCSV}>
              Exporter CSV
            </button>
          </h2>
          <table className="table w-full">
            <thead>
              <tr>
                <th>Image</th>
                {fields.map((f: Field) => (
                  <th key={f.id}>{f.label || "Champ"}</th>
                ))}
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec: ImageRecord, recIdx: number) => (
                <tr key={recIdx}>
                  <td>
                    <img
                      src={URL.createObjectURL(rec.file)}
                      alt="aperçu"
                      className="h-20"
                    />
                  </td>
                  {fields.map((f: Field) => (
                    <td key={f.id}>
                      <input
                        type={f.type}
                        className="input input-bordered w-full"
                        value={rec.data[f.name] || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleRecordChange(
                            recIdx,
                            f.name,
                            e.target.value,
                          )
                        }
                      />
                    </td>
                  ))}
                  <td className="text-sm text-gray-500">
                    {rec.loading ? "Extraction..." : "OK"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
