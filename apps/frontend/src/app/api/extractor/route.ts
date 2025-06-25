import { mistral } from "@ai-sdk/mistral";
import { streamObject } from "ai";
import { z } from "zod";

const fieldSchema = z.object({
  label: z.string(),
  name: z.string(),
  type: z.enum([
    "text",
    "number",
    "email",
    "date",
    "textarea",
    "select",
    "radio",
    "checkbox",
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
  ]),
  value: z.string(),
  placeholder: z.string(),
  options: z.array(z.string()).optional(),
  description: z.string(),
  required: z.boolean(),
});

const formSchema = z.object({
  fields: z.array(fieldSchema),
});

export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json();
  const { text, image } = body;

  // Validate that image/media is provided
  if (!image) {
    return new Response(
      JSON.stringify({ error: "Une image ou un PDF est requis" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const messages: any[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Extrait le JSON du formulaire à partir de l'image/PDF fourni${text ? ` pour "${text}"` : ""}.`,
        },
        {
          type: "image",
          image: image,
        },
      ],
    },
  ];

  const result = streamObject({
    model: mistral("pixtral-large-latest"),
    system: `
Vous êtes un extracteur de formulaires dynamiques pour une plateforme de services digitale en ligne.
Analysez l'image/PDF fourni et générez **uniquement** un objet JSON correspondant au formulaire visible.
– Utilisez strictement les types HTML5 pertinents.
– Pas de champs inutiles, redondants, button, hidden ou password.
– Les champs doivent être UX-friendly et ordonnés du plus essentiel au plus accessoire.
- Pas de doublons dans les noms de champs et les options.
- Extrayez fidèlement les informations visibles dans l'image/PDF ainsi que ses valeurs.
    `.trim(),
    messages,
    schema: formSchema,
    onError(error) {
      console.error("Error during form extraction:", error);
    },
    onFinish({ object }) {
      console.log("Form object generated:", object);
    },
  });

  return result.toTextStreamResponse();
}
