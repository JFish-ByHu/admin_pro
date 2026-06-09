declare module 'nodemailer' {
  interface TransportOptions {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }

  interface MailOptions {
    from: string
    to: string
    subject: string
    text: string
    html: string
  }

  interface MailTransporter {
    sendMail: (options: MailOptions) => Promise<unknown>
  }

  const nodemailer: {
    createTransport: (options: TransportOptions) => MailTransporter
  }

  export = nodemailer
}
