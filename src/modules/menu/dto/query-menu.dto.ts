import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class QueryMenuDto {
  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsIn(['directory', 'menu'], { message: 'type 只能是 directory 或 menu' })
  type?: 'directory' | 'menu'

  @IsOptional()
  @IsIn(['enabled', 'disabled'], { message: 'status 只能是 enabled 或 disabled' })
  status?: 'enabled' | 'disabled'

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === '') {
      return undefined
    }

    if (typeof value === 'boolean') {
      return value
    }

    if (typeof value === 'string') {
      return value === 'true'
    }

    return Boolean(value)
  })
  @IsBoolean({ message: 'all 必须是布尔值' })
  all?: boolean

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === undefined || value === '' ? undefined : value
  )
  @Type(() => Number)
  @IsNumber({}, { message: 'page 必须是数字' })
  @Min(1, { message: 'page 最小为 1' })
  page?: number

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === undefined || value === '' ? undefined : value
  )
  @Type(() => Number)
  @IsNumber({}, { message: 'pageSize 必须是数字' })
  @Min(1, { message: 'pageSize 最小为 1' })
  pageSize?: number
}
