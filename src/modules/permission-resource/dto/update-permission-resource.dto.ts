import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min
} from 'class-validator'

export class UpdatePermissionResourceDto {
  @IsOptional()
  @IsUUID('4', { message: 'parentId 必须是合法的 UUID' })
  parentId?: string | null

  @IsOptional()
  @IsString({ message: 'name 必须是字符串' })
  @MaxLength(100, { message: 'name 最长 100 个字符' })
  name?: string

  @IsOptional()
  @IsString({ message: 'permissionCode 必须是字符串' })
  @MaxLength(100, { message: 'permissionCode 最长 100 个字符' })
  permissionCode?: string

  @IsOptional()
  @IsIn(['api', 'button'], { message: 'type 只能是 api 或 button' })
  type?: 'api' | 'button'

  @IsOptional()
  @IsString({ message: 'apiPath 必须是字符串' })
  @MaxLength(255, { message: 'apiPath 最长 255 个字符' })
  apiPath?: string

  @IsOptional()
  @IsString({ message: 'httpMethod 必须是字符串' })
  @MaxLength(12, { message: 'httpMethod 最长 12 个字符' })
  httpMethod?: string

  @IsOptional()
  @IsInt({ message: 'sort 必须是整数' })
  @Min(0, { message: 'sort 不能小于 0' })
  sort?: number

  @IsOptional()
  @IsBoolean({ message: 'isActive 必须是布尔值' })
  isActive?: boolean
}
