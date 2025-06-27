import { tool } from 'ai';
import { z } from 'zod';
import * as nodemailer from 'nodemailer';

export const mailTool = tool({
  description: 'send email without file attachment',
  parameters: z.object({
    to: z.string().email().describe('recipient address'),
    subject: z.string().describe('email subject'),
    text: z.string().describe('email content'),
  }),
  async execute({ to, subject, text }) {
    const transport = nodemailer.createTransport({
      host: process.env.MAIL_HOST ?? 'localhost',
      port: Number(process.env.MAIL_PORT ?? 1025),
    });
    await transport.sendMail({ from: 'bot@example.com', to, subject, text });
    return 'sent';
  },
});
