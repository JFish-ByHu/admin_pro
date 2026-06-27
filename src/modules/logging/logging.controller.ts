import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { RequirePermissions } from '../../core/decorators/permissions.decorator'
import { PermissionsGuard } from '../../core/guards/permissions.guard'
import { success } from '../../core/response/api-response'
import type { ApiSuccessBody } from '../../core/response/api-response'
import { LoggingService } from './logging.service'
import { QueryOperationLogDto } from './dto/query-operation-log.dto'
import { OperationLogListResponse, OperationLogItem } from './dto/operation-log-response.dto'

@Controller('logs')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  @Get('list')
  @RequirePermissions('system:log:list')
  async list(
    @Query() query: QueryOperationLogDto
  ): Promise<ApiSuccessBody<OperationLogListResponse>> {
    const data = await this.loggingService.list(query)
    return success(data, 'success')
  }

  @Get('detail/:id')
  @RequirePermissions('system:log:detail')
  async detail(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<ApiSuccessBody<OperationLogItem | null>> {
    const data = await this.loggingService.detail(id)
    return success(data, 'success')
  }
}
