/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { mistral } from '@ai-sdk/mistral';
import { openai } from '@ai-sdk/openai';
import { Injectable, Logger } from '@nestjs/common';
import { generateObject } from 'ai';
import { z } from 'zod';

const fieldSchema = z.object({
  label: z.string(),
  name: z.string(),
  type: z.enum([
    'text',
    'number',
    'email',
    'date',
    'textarea',
    'select',
    'radio',
    'checkbox',
    'file',
    'color',
    'url',
    'tel',
    'time',
    'week',
    'month',
    'range',
    'search',
    'datetime-local',
  ]),
  placeholder: z.string(),
  options: z.array(z.string()).optional(),
  description: z.string(),
  required: z.boolean(),
});

@Injectable()
export class FormGeneratorService {
  public readonly maxDuration = 30;

  private resolveAIProvider(): any {
    const PROVIDER = process.env.AI_PROVIDER || 'mistral';
    if (PROVIDER === 'mistral') {
      return mistral('mistral-small-latest', {
        safePrompt: true,
      });
    }

    return openai('gpt-4o-mini');
  }

  generateFormStream(input: string): any {
    try {
      const result = generateObject({
        model: this.resolveAIProvider(),
        mode: 'json',
        schema: z.array(fieldSchema),
        output: 'array',
        system: `
            Vous êtes un générateur de formulaires dynamiques pour une plateforme de services digitale en ligne.
            Générez **uniquement** un objet JSON { "fields": [...] } correspondant à la demande :
            "${input}"
            – Utilisez strictement les types HTML5 pertinents.
            – Pas de champs inutiles, redondants, button, hidden ou password.
            – Les champs doivent être UX-friendly et ordonnés du plus essentiel au plus accessoire.
            – Pas de doublons dans les noms de champs et les options.
        `.trim(),
        prompt: `Générez le JSON du formulaire pour "${input}".`,
        temperature: 0.2,
      });

      return result;
    } catch (err) {
      console.error('Error generating form:', err);
    }
  }
}
