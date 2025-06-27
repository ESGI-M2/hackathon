import { z } from 'zod';

export const stepSchema = z.object({
  prompt: z.string(),
  dependencies: z.array(z.number()),
  idx: z.number().optional(),
});

export const chatSchema = z.object({
  title: z.string(),
  description: z.string(),
  globalPrompt: z.string().optional(),
  steps: z.array(stepSchema),
});

export const universalSchema = z.object({
  input: z.string().optional(),
  prompt: z.string(),
  globalPrompt: z.string().optional(),
  media: z.string().optional(),
});

export const fieldSchema = z.object({
  label: z.string(),
  name: z.string(),
  type: z.string(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
});

export const formSchema = z.object({ fields: z.array(fieldSchema) });
export const recordSchema = z.record(z.string(), z.string());

export const extractionServiceSchema = z.object({
  title: z.string(),
  schema: z.array(fieldSchema),
  chatSteps: z.array(stepSchema).optional(),
  chatGlobalPrompt: z.string().optional(),
});
