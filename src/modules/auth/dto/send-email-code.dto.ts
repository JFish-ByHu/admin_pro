import { IsEmail, IsIn, IsNotEmpty } from 'class-validator'

const EMAIL_CODE_SCENES = ['register'] as const

export type EmailCodeScene = (typeof EMAIL_CODE_SCENES)[number]

export class SendEmailCodeDto {
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '请输入有效的邮箱格式' })
  email!: string

  @IsNotEmpty({ message: '验证码场景不能为空' })
  @IsIn(EMAIL_CODE_SCENES, { message: '验证码场景不支持' })
  scene!: EmailCodeScene
}
