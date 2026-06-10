import { IsEmail, IsNotEmpty } from 'class-validator'

export class CheckResetEmailDto {
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '请输入有效的邮箱格式' })
  email!: string
}
