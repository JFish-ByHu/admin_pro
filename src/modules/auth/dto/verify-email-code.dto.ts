import { IsEmail, IsIn, IsNotEmpty, IsString, Length, Matches } from 'class-validator'

const EMAIL_CODE_SCENES = ['register', 'login', 'reset'] as const

export type EmailCodeScene = (typeof EMAIL_CODE_SCENES)[number]

export class VerifyEmailCodeDto {
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '请输入有效的邮箱格式' })
  email!: string

  @IsNotEmpty({ message: '验证码场景不能为空' })
  @IsIn(EMAIL_CODE_SCENES, { message: '验证码场景不支持' })
  scene!: EmailCodeScene

  @IsNotEmpty({ message: '验证码不能为空' })
  @Length(6, 6, { message: '验证码必须是6位数字' })
  @Matches(/^\d+$/, { message: '验证码只能包含数字' })
  code!: string
}

export class ConsumeEmailVerifyTicketDto {
  @IsNotEmpty({ message: '邮箱验证票据不能为空' })
  @IsString()
  emailVerifyTicket!: string
}
