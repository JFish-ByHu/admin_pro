import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  IsIn,
  IsBoolean,
  IsUrl
} from 'class-validator'

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  @MaxLength(100, { message: '邮箱不能超过 100 位' })
  email?: string

  @IsOptional()
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码不能少于 6 位' })
  @MaxLength(100, { message: '密码不能超过 100 位' })
  password?: string

  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @MaxLength(50, { message: '昵称不能超过 50 位' })
  nickname?: string

  @IsOptional()
  @IsUrl({}, { message: '头像 URL 格式不正确' })
  @MaxLength(255, { message: '头像 URL 不能超过 255 位' })
  avatarUrl?: string

  @IsOptional()
  @IsIn(['super', 'admin', 'operator', 'user'], { message: '角色值不合法' })
  role?: string

  @IsOptional()
  @IsBoolean({ message: 'isActive 必须是布尔值' })
  isActive?: boolean
}
