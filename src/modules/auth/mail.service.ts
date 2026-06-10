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

  async sendEmailCode(
    email: string,
    code: string,
    scene: 'register' | 'login' | 'reset',
    expiresMinutes: number
  ): Promise<void> {
    const from = getRequiredEnv('EMAIL_FROM')
    const sceneTextMap = {
      register: {
        subject: 'Admin Pro 注册验证码',
        title: '用户注册验证码',
        desc: '您正在进行账号注册，请使用以下验证码完成验证：'
      },
      login: {
        subject: 'Admin Pro 登录验证码',
        title: '用户登录验证码',
        desc: '您正在进行邮箱登录，请使用以下验证码完成验证：'
      },
      reset: {
        subject: 'Admin Pro 重置密码验证码',
        title: '重置密码验证码',
        desc: '您正在进行密码重置，请使用以下验证码完成验证：'
      }
    } as const
    const sceneMeta = sceneTextMap[scene]

    await this.getTransporter().sendMail({
      from,
      to: email,
      subject: sceneMeta.subject,
      text: `您的验证码为 ${code}，${expiresMinutes} 分钟内有效。若非本人操作请忽略。`,
      html: `
        <div style="background:linear-gradient(135deg,#1677ff,#4096ff);padding:28px 32px;color:#fff;">
          <h1 style="margin:0;font-size:24px;font-weight:600;">Admin Pro</h1>
          <p style="margin:8px 0 0;opacity:.9;font-size:14px;">${sceneMeta.title}</p>
        </div>

        <div style="padding:36px 32px;">
          <p style="margin:0 0 16px;color:#374151;font-size:16px;">
            ${sceneMeta.desc}
          </p>

          <div
            style="background:#f8fafc;border:1px dashed #1677ff;border-radius:10px;padding:20px;text-align:center;margin:24px 0;"
          >
            <div style="font-size:36px;font-weight:700;letter-spacing:10px;color:#1677ff;">${code}</div>
          </div>

          <div
            style="background:#fff7e6;border-left:4px solid #faad14;padding:12px 16px;margin-bottom:20px;border-radius:4px;"
          >
            <span style="color:#d48806;font-size:14px;">
              验证码将在 ${expiresMinutes} 分钟后失效
            </span>
          </div>

          <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.8;">
            若本次操作并非您本人发起，请忽略此邮件，您的账户不会受到影响。
          </p>
        </div>

        <!-- Footer -->
        <div
          style="border-top:1px solid #f0f0f0;padding:20px 32px;background:#fafafa;color:#9ca3af;font-size:12px;text-align:center;line-height:1.8;"
        >
          此邮件由系统自动发送，请勿直接回复。<br />
          © Admin Pro
        </div>
      `
    })
  }
}
