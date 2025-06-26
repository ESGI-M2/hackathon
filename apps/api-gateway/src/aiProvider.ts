import { openai } from '@ai-sdk/openai';
import { mistral } from '@ai-sdk/mistral';

const PROVIDER = process.env.AI_PROVIDER || 'mistral';

export function getAIModel() {
  if (PROVIDER === 'mistral') {
    console.log('Using Mistral AI provider');
    return mistral('mistral-medium-latest', { safePrompt: true });
  }
  console.log('Using OpenAI provider');
  return openai('gpt-4o-mini');
}
