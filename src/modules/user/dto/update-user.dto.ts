import { IsString, IsEmail, IsOptional, MinLength, MaxLength, IsBoolean } from 'class-validator'
import { Transform } from 'class-transformer'

export class UpdateUserDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail({}, { message: '邮箱格式不正确' })
  @MaxLength(100, { message: '邮箱不能超过 100 位' })
  email?: string

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码不能少于 6 位' })
  @MaxLength(100, { message: '密码不能超过 100 位' })
  password?: string

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: '昵称必须是字符串' })
  @MaxLength(50, { message: '昵称不能超过 50 位' })
  nickname?: string

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: '头像路径格式不正确' })
  @MaxLength(255, { message: '头像 URL 不能超过 255 位' })
  avatarUrl?: string

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'boolean') {
      return value
    }

    if (typeof value === 'string') {
      if (value === 'true') {
        return true
      }

      if (value === 'false') {
        return false
      }
    }

    return value
  })
  @IsBoolean({ message: 'isActive 必须是布尔值' })
  isActive?: boolean
}
