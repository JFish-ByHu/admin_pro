import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class EmailLoginDto {
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '请输入有效的邮箱格式' })
  email!: string

  @IsNotEmpty({ message: '邮箱验证票据不能为空' })
  @IsString()
  emailVerifyTicket!: string
}
