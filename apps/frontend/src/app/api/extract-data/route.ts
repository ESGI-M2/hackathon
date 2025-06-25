import { mistral } from "@ai-sdk/mistral";
import { streamObject } from "ai";
import { z } from "zod";

const recordSchema = z.record(z.string(), z.string());

export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json();
  const { fields, image } = body as {
    fields: { name: string; label: string; type: string }[];
    image: string;
  };

  if (!image || !fields) {
    return new Response(
      JSON.stringify({ error: "Image et champs requis" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const description = fields
    .map((f) => `${f.label} (${f.type}) -> ${f.name}`)
    .join("; ");

  const messages: any[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Extrait uniquement les valeurs des champs suivants depuis l'image fournie. Rends un objet JSON avec les noms techniques : ${description}`,
        },
        {
          type: "image",
          image,
        },
      ],
    },
  ];

  const result = streamObject({
    model: mistral("pixtral-large-latest"),
    system: `Vous êtes un service d'extraction de données. Vous recevez une image et la liste des champs attendus. Retournez uniquement un objet JSON avec les valeurs extraites.`.trim(),
    messages,
    schema: recordSchema,
    onError(error) {
      console.error("Error during data extraction:", error);
    },
    onFinish({ object }) {
      console.log("Extracted data:", object);
    },
  });

  return result.toTextStreamResponse();
}
