import { getAIModel } from "@/lib/aiProvider";
import { generateText } from "ai";
import { z } from "zod";

const bodySchema = z.object({
  input: z.string().optional(),
  prompt: z.string(),
  globalPrompt: z.string().optional(),
  media: z.string().optional(),
});

export const maxDuration = 60;

export async function POST(req: Request) {
  const { input = '', prompt, globalPrompt = '', media } = bodySchema.parse(
    await req.json(),
  )
  console.debug('api input', { input, prompt, globalPrompt, media })
  const content: any[] = [
    { type: "text", text: `${prompt}\n${globalPrompt}\n${input}`.trim() },
  ];
  if (media) content.push({ type: "image", image: media });
  const result = await generateText({
    model: getAIModel(),
    messages: [{ role: 'user', content }],
  })
  console.debug('api output', result.text)
  return new Response(JSON.stringify({ output: result.text }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
