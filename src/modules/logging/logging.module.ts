import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OperationLog } from './entities/operation-log.entity'
import { LoggingService } from './logging.service'
import { LoggingController } from './logging.controller'
import { LoggingInterceptor } from './logging.interceptor'

@Module({
  imports: [TypeOrmModule.forFeature([OperationLog])],
  controllers: [LoggingController],
  providers: [
    LoggingService,
    LoggingInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useExisting: LoggingInterceptor
    }
  ],
  exports: [LoggingService, LoggingInterceptor]
})
export class LoggingModule {}
