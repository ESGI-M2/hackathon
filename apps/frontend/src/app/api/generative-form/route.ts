import { getAIModel } from "@/lib/aiProvider";
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
    const input: string = await req.json();

    const result = streamObject({
        model: getAIModel(),
        system: `
Vous êtes un générateur de formulaires dynamiques pour une plateforme de services digitale en ligne.
Générez **uniquement** un objet JSON correspondant à la demande :
"${input}"
– Utilisez strictement les types HTML5 pertinents.
– Pas de champs inutiles, redondants, button, hidden ou password.
– Les champs doivent être UX-friendly et ordonnés du plus essentiel au plus accessoire.
- Pas de doublons dans les noms de champs et les options.
    `.trim(),
        prompt: `Générez le JSON du formulaire pour "${input}".`,
        schema: formSchema,
        onFinish({ object }) {
            console.log("Form object generated:", object);
        },
    });

    return result.toTextStreamResponse();
}
