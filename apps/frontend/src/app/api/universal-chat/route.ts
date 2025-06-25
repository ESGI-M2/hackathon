import { getAIModel } from "@/lib/aiProvider";
import { generateText } from "ai";
import { z } from "zod";

const stepSchema = z.object({
  prompt: z.string(),
});

const bodySchema = z.object({
  input: z.string(),
  steps: z.array(stepSchema),
});

export const maxDuration = 60;

export async function POST(req: Request) {
  const { input, steps } = bodySchema.parse(await req.json());
  let current = input;
  for (const { prompt } of steps) {
    const result = await generateText({
      model: getAIModel(),
      prompt: `${prompt}\n${current}`,
    });
    current = result.text;
  }
  return new Response(JSON.stringify({ output: current }), {
    headers: { "Content-Type": "application/json" },
  });
}
