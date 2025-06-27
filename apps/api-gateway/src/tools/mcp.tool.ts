import { tool } from 'ai'
import { z } from 'zod'
import * as nodemailer from 'nodemailer'

const makeCsv = (records: Record<string, string>[]): string => {
  const keys = Object.keys(records[0] ?? {})
  const lines = records.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','))
  return [keys.join(','), ...lines].join('\n')
}

export const mcpTool = tool({
  description: 'send email with csv',
  parameters: z.object({
    to: z.string().email().describe('recipient address'),
    subject: z.string().describe('email subject'),
    text: z.string().describe('email content'),
    records: z.array(z.record(z.string())).describe('csv data'),
  }),
  async execute({ to, subject, text, records }) {
    const transport = nodemailer.createTransport({
      host: process.env.MAIL_HOST ?? 'localhost',
      port: Number(process.env.MAIL_PORT ?? 1025),
    })
    await transport.sendMail({
      from: 'bot@example.com',
      to,
      subject,
      text,
      attachments: [{ filename: 'data.csv', content: makeCsv(records) }],
    })
    return 'sent'
  },
})
