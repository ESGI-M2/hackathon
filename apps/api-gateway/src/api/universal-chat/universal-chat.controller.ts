import { Body, Controller, Post } from '@nestjs/common';
import { generateText } from 'ai';
import { getAIModel } from '../../aiProvider';
import { mailTool } from '../../tools/mail.tool';
import { universalSchema } from '../schemas';

@Controller()
export class UniversalChatController {
  @Post('universal-chat')
  async universalChat(@Body() body: unknown) {
    const { input = '', prompt, globalPrompt = '', media } =
      universalSchema.parse(body);
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
}
