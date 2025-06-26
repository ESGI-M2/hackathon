import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { generateObject, generateText } from 'ai';
import { mailTool } from '../tools/mail.tool';
import { getAIModel } from '../aiProvider';
import { PrismaService } from '../prisma.service';
import { mistral } from '@ai-sdk/mistral';
import { z } from 'zod';

const stepSchema = z.object({
  prompt: z.string(),
  dependencies: z.array(z.number()),
});
const chatSchema = z.object({
  title: z.string(),
  description: z.string(),
  globalPrompt: z.string().optional(),
  steps: z.array(stepSchema),
});
const universalSchema = z.object({
  input: z.string().optional(),
  prompt: z.string(),
  globalPrompt: z.string().optional(),
  media: z.string().optional(),
});
const fieldSchema = z.object({
  label: z.string(),
  name: z.string(),
  type: z.string(),
  placeholder: z.string(),
  options: z.array(z.string()).optional(),
  description: z.string(),
  required: z.boolean(),
});
const formSchema = z.object({ fields: z.array(fieldSchema) });
const recordSchema = z.record(z.string(), z.string());

@Controller()
export class ApiController {
  constructor(private prisma: PrismaService) {}

  @Get('chat-infinite')
  listChats() {
    return this.prisma.chatInfinite.findMany({
      include: { steps: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('chat-infinite/:id')
  getChat(@Param('id') id: string) {
    return this.prisma.chatInfinite.findUnique({
      where: { id: Number(id) },
      include: { steps: true },
    });
  }

  @Post('chat-infinite')
  async createChat(@Body() body: unknown) {
    const { title, description, globalPrompt, steps } = chatSchema.parse(body);
    return this.prisma.chatInfinite.create({
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
  }

  @Put('chat-infinite/:id')
  async updateChat(@Param('id') id: string, @Body() body: unknown) {
    const { title, description, globalPrompt, steps } = chatSchema.parse(body);
    await this.prisma.step.deleteMany({ where: { chatId: Number(id) } });
    return this.prisma.chatInfinite.update({
      where: { id: Number(id) },
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
  }

  @Post('universal-chat')
  async universalChat(@Body() body: unknown) {
    const {
      input = '',
      prompt,
      globalPrompt = '',
      media,
    } = universalSchema.parse(body);
    const content: (
      | { type: 'text'; text: string }
      | { type: 'image'; image: string }
    )[] = [{ type: 'text', text: `${prompt}\n${input}`.trim() }];
    if (media) content.push({ type: 'image', image: media });
    const messages: { role: 'system' | 'user'; content: any }[] =
      globalPrompt.trim()
        ? [
            { role: 'system', content: globalPrompt },
            { role: 'user', content },
          ]
        : [{ role: 'user', content }];
    const result = await generateText({
      model: getAIModel(),
      messages,
      tools: { mail: mailTool },
      maxSteps: 5,
    });
    return { output: result.text };
  }

  @Post('generative-form')
  async generativeForm(@Body() body: unknown) {
    const { input } = body as any as { input?: string };
    const { object } = await generateObject({
      model: getAIModel(),
      mode: 'json',
      schema: formSchema,
      prompt: `Générez le JSON du formulaire pour "${input}".`,
      system:
        `Vous êtes un générateur de formulaires dynamiques pour une plateforme de services digitale en ligne.\nGénérez **uniquement** un objet JSON correspondant à la demande :\n"${input}"\n– Utilisez strictement les types HTML5 pertinents.\n– Pas de champs inutiles, redondants, button, hidden ou password.\n– Les champs doivent être UX-friendly et ordonnés du plus essentiel au plus accessoire.\n- Pas de doublons dans les noms de champs et les options.`.trim(),
      temperature: 0.2,
    });
    console.log('Generated form schema:', object);
    console.log('input:', input);
    return object;
  }

  @Post('extractor')
  async extractor(@Body() body: unknown) {
    const { text, image } = body as any as { text?: string; image?: string };
    if (!image) {
      return { error: 'Une image ou un PDF est requis' };
    }
    const messages: any[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Extrait le JSON du formulaire à partir de l'image/PDF fourni${text ? ` pour "${text}"` : ''}.`,
          },
          { type: 'image', image },
        ],
      },
    ];
    const { object } = await generateObject({
      model: mistral('pixtral-large-latest'),
      system:
        `Vous êtes un extracteur de formulaires dynamiques pour une plateforme de services digitale en ligne.\nAnalysez l'image/PDF fourni et générez **uniquement** un objet JSON correspondant au formulaire visible.\n– Utilisez strictement les types HTML5 pertinents.\n– Pas de champs inutiles, redondants, button, hidden ou password.\n– Les champs doivent être UX-friendly et ordonnés du plus essentiel au plus accessoire.\n- Pas de doublons dans les noms de champs et les options.\n- Extrayez fidèlement les informations visibles dans l'image/PDF ainsi que ses valeurs.`.trim(),
      messages,
      schema: formSchema,
    });
    return object;
  }

  @Post('extract-data')
  async extractData(@Body() body: unknown) {
    const { fields, image } = body as {
      fields?: { name: string; label: string; type: string }[];
      image?: string;
    };
    if (!image || !fields) {
      return { error: 'Image et champs requis' };
    }
    const description = fields
      .map((f) => `${f.label} (${f.type}) -> ${f.name}`)
      .join('; ');
    const messages: any[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Extrait uniquement les valeurs des champs suivants depuis l'image fournie. Rends un objet JSON avec les noms techniques : ${description}`,
          },
          { type: 'image', image },
        ],
      },
    ];
    const { object } = await generateObject({
      model: mistral('pixtral-large-latest'),
      system:
        `Vous êtes un service d'extraction de données. Vous recevez une image et la liste des champs attendus. Retournez uniquement un objet JSON avec les valeurs extraites.`.trim(),
      messages,
      schema: recordSchema,
    });
    return object;
  }
}
