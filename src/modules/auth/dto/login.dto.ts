import { IsString, IsNotEmpty, Length, Matches } from 'class-validator'

export class LoginDto {
  @IsNotEmpty({ message: '账号不能为空' })
  @IsString({ message: '请输入有效的用户名或邮箱' })
  username: string // 这里对应前端传过来的 username（其实前端同时允许填用户名或邮箱）

  @IsNotEmpty({ message: '密码不能为空' })
  @Length(6, 20, { message: '密码长度必须在6-20个字符之间' })
  @Matches(/^[^\s]+$/, { message: '密码不允许包含空格' })
  password: string

  @IsNotEmpty({ message: '验证码不能为空' })
  @Length(6, 6, { message: '验证码必须是6位数字' })
  otp: string

  @IsNotEmpty({ message: '验证码标识不能为空' })
  @IsString()
  captchaId: string

  @IsNotEmpty({ message: '加密标识不能为空' })
  @IsString()
  keyId: string
}
