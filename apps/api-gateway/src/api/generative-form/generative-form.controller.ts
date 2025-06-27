import { Body, Controller, Post } from '@nestjs/common';
import { generateObject } from 'ai';
import { getAIModel } from '../../aiProvider';
import { formSchema } from '../schemas';

@Controller()
export class GenerativeFormController {
  @Post('generative-form')
  async generativeForm(@Body() body: unknown) {
    const { input } = body as { input?: string };
    const { object } = await generateObject({
      model: getAIModel(),
      mode: 'json',
      schema: formSchema,
      prompt: `Générez le JSON du formulaire pour "${input}".`,
      system:
        `Vous êtes un générateur de formulaires dynamiques pour une plateforme de services digitale en ligne.\nGénérez **uniquement** un objet JSON correspondant à la demande :\n"${input}"\n– Utilisez strictement les types HTML5 pertinents.\n– Pas de champs inutiles, redondants, button, hidden ou password.\n– Les champs doivent être UX-friendly et ordonnés du plus essentiel au plus accessoire.\n- Pas de doublons dans les noms de champs et les options.`.trim(),
      temperature: 0.2,
    });
    return object;
  }
}
