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
  tone: z.string().optional(),
  subject: z.string().optional(),
});

export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json();

  const parsed = formSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Le champ 'fields' doit être un tableau valide." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { fields, tone, subject } = parsed.data;

  const fieldList = fields
    .map((field) => `${field.label || field.name}: ${field.value || "…"}`)
    .join("\n");

  const messages = [
    {
      role: "user",
      content: `Vous êtes un assistant intelligent chargé de rédiger un email clair, professionnel et personnalisé à partir des données d’un formulaire rempli.

Tonalité souhaitée : ${tone || "professionnelle"}
Sujet ou contexte : ${subject || "non précisé"}

Voici les données du formulaire à intégrer :

${fieldList}

Générez un email bien structuré, engageant et pertinent, sans paraphraser inutilement les labels. Ne pas mentionner que cela vient d'un formulaire.`,
    },
  ];

  const result = streamObject({
    model: mistral("open-mistral-7b"),
    system: "Tu es un assistant expert en rédaction d'emails clairs, naturels et adaptés à leur contexte.",
    messages,
    schema: z.object({
      email_content: z.string(),
    }),
    onError(error) {
      console.error("Error during email generation:", error);
    },
    onFinish({ object }) {
      console.log("Email content generated:", object);
    },
  });

  return result.toTextStreamResponse();
}
