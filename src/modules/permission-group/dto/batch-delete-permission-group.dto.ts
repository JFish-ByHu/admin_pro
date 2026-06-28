import { IsArray, IsUUID } from 'class-validator'

export class BatchDeletePermissionGroupDto {
  @IsArray({ message: 'ids 必须是数组' })
  @IsUUID('all', { each: true, message: 'ids 中每一项必须是 UUID' })
  ids!: string[]
}
