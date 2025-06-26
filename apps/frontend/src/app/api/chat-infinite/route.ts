import prisma from "@/lib/prisma";
import { z } from "zod";

const stepSchema = z.object({
  prompt: z.string(),
  dependencies: z.array(z.number()),
});
const bodySchema = z.object({
  title: z.string(),
  description: z.string(),
  globalPrompt: z.string().optional(),
  steps: z.array(stepSchema),
});

export async function GET() {
  const chats = await prisma.chatInfinite.findMany({
    include: { steps: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(chats);
}

export async function POST(req: Request) {
  const { title, description, globalPrompt, steps } = bodySchema.parse(
    await req.json(),
  );
  const chat = await prisma.chatInfinite.create({
    data: {
      title,
      description,
      globalPrompt,
      steps: {
        create: steps.map((s, idx) => ({
          prompt: s.prompt,
          dependencies: s.dependencies,
          idx,
        })),
      },
    },
    include: { steps: true },
  });
  return Response.json(chat);
}
