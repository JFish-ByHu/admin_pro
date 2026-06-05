import { IsString, IsNotEmpty, Length, Matches, IsEmail } from 'class-validator'

export class RegisterDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  @Matches(/^[a-zA-Z0-9]+$/, { message: '用户名仅允许字母和数字' })
  username!: string

  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '请输入有效的邮箱格式' })
  email!: string

  @IsNotEmpty({ message: '密码不能为空' })
  @Length(6, 20, { message: '密码长度必须在6-20个字符之间' })
  @Matches(/^[^\s]+$/, { message: '密码不允许包含空格' })
  password!: string

  @IsNotEmpty({ message: '验证码不能为空' })
  @Length(6, 6, { message: '验证码必须是6位数字' })
  @Matches(/^\d+$/, { message: '验证码只能包含数字' })
  otp!: string

  @IsNotEmpty({ message: '验证码标识不能为空' })
  @IsString()
  captchaId!: string

  @IsNotEmpty({ message: '加密标识不能为空' })
  @IsString()
  keyId!: string
}
