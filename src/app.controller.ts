import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'
import { success } from './common/response/api-response'
import type { ApiSuccessBody } from './common/response/api-response'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): ApiSuccessBody<string> {
    return success(this.appService.getHello())
  }
}
