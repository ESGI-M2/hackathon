import { tool } from 'ai'
import { z } from 'zod'
import nodemailer from 'nodemailer'

export const mailTool = tool({
  description: 'send email',
  parameters: z.object({
    to: z.string().email().describe('recipient address'),
    subject: z.string().describe('email subject'),
    text: z.string().describe('email content')
  }),
  async execute({ to, subject, text }) {
    const transport = nodemailer.createTransport({
      host: process.env.MAIL_HOST ?? 'mailpit',
      port: Number(process.env.MAIL_PORT ?? 1025)
    })
    await transport.sendMail({ from: 'bot@example.com', to, subject, text })
    return 'sent'
  }
})
