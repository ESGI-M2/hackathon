import { Body, Controller, Post } from '@nestjs/common';
import { generateObject, generateText } from 'ai';
import { getAIModel } from '../../aiProvider';
import { mailTool } from '../../tools/mail.tool';
import { mailCsv } from '../../tools/mailcsv.tool';
import { PrismaService } from '../../prisma.service';
import { fieldSchema, formSchema, recordSchema, stepSchema } from '../schemas';
import { mistral } from '@ai-sdk/mistral';
import { z } from 'zod';

@Controller()
export class ExtractorController {
  constructor(private prisma: PrismaService) {}
  @Post('extractor')
  async extractor(@Body() body: unknown) {
    const { text, image } = body as { text?: string; image?: string };
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
    const data = body as any;
    if (Array.isArray(data.images)) {
      const req = z
        .object({
          templateId: z.number().optional(),
          images: z.array(z.string()),
          fields: z.array(fieldSchema).optional(),
          chatSteps: z.array(stepSchema).optional(),
          chatGlobalPrompt: z.string().optional(),
        })
        .parse(data);

      let fields = req.fields ?? [];
      let chatSteps = req.chatSteps ?? [];
      let chatGlobalPrompt = req.chatGlobalPrompt ?? '';
      if (req.templateId) {
        const tpl = await this.prisma.extractionService.findUnique({
          where: { id: req.templateId },
        });
        if (!tpl) return { error: 'template not found' };
        fields = tpl.schema as any;
        chatSteps = (tpl.chatSteps as any) ?? [];
        chatGlobalPrompt = tpl.chatGlobalPrompt ?? '';
      }
      if (fields.length === 0) return { error: 'fields missing' };
      const records: Record<string, string>[] = [];
      for (const image of req.images) {
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
        records.push(object);
      }
      const outputs: string[] = [];
      const inputBase = JSON.stringify(records);
      const steps = [...chatSteps].sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0));
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (!step.prompt.trim()) {
          outputs[i] = '';
          continue;
        }
        const deps = step.dependencies.length > 0 ? step.dependencies : [i - 1];
        const input = deps
          .map((d) => (d === -1 ? inputBase : outputs[d] || ''))
          .join('\n');
        const messages: { role: 'system' | 'user'; content: any }[] =
          chatGlobalPrompt.trim()
            ? [
                { role: 'system', content: chatGlobalPrompt },
                { role: 'user', content: `${step.prompt}\n${input}`.trim() },
              ]
            : [{ role: 'user', content: `${step.prompt}\n${input}`.trim() }];
        const result = await generateText({
          model: getAIModel(),
          messages,
          tools: { mailTool, mailCsv },
          maxSteps: 5,
        });
        outputs[i] = result.text;
      }
      return { records, outputs };
    }

    const { fields, image } = data as {
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
