import { Injectable } from '@nestjs/common'
import { getRequiredEnv } from '../../common/config/env'

type MailTransporter = {
  sendMail: (options: {
    from: string
    to: string
    subject: string
    text: string
    html: string
  }) => Promise<unknown>
}

@Injectable()
export class MailService {
  private transporter: MailTransporter | null = null

  private getTransporter(): MailTransporter {
    if (this.transporter) {
      return this.transporter
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodemailer = require('nodemailer') as {
      createTransport: (options: {
        host: string
        port: number
        secure: boolean
        auth: {
          user: string
          pass: string
        }
      }) => MailTransporter
    }

    const host = getRequiredEnv('EMAIL_SMTP_HOST')
    const port = Number(getRequiredEnv('EMAIL_SMTP_PORT'))
    const secure = getRequiredEnv('EMAIL_SMTP_SECURE') === 'true'
    const user = getRequiredEnv('EMAIL_SMTP_USER')
    const pass = getRequiredEnv('EMAIL_SMTP_PASS')

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      }
    })

    return this.transporter
  }

  async sendRegisterCode(email: string, code: string, expiresMinutes: number): Promise<void> {
    const from = getRequiredEnv('EMAIL_FROM')

    await this.getTransporter().sendMail({
      from,
      to: email,
      subject: 'Admin Pro 注册验证码',
      text: `您的注册验证码为 ${code}，${expiresMinutes} 分钟内有效。若非本人操作请忽略。`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #1f2937;">
          <h2 style="margin: 0 0 12px;">Admin Pro 注册验证码</h2>
          <p style="margin: 0 0 8px;">您的验证码为：</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 0 0 12px;">${code}</p>
          <p style="margin: 0;">验证码 ${expiresMinutes} 分钟内有效。若非本人操作请忽略本邮件。</p>
        </div>
      `
    })
  }
}
