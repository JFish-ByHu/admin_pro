import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdatePermissionGroupDto {
  @IsOptional()
  @IsString({ message: 'name 必须是字符串' })
  @MaxLength(100, { message: 'name 最长 100 个字符' })
  name?: string

  @IsOptional()
  @IsBoolean({ message: 'isActive 必须是布尔值' })
  isActive?: boolean
}
