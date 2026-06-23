import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { OperationLog } from './entities/operation-log.entity'
import { QueryOperationLogDto } from './dto/query-operation-log.dto'
import { OperationLogListResponse, OperationLogItem } from './dto/operation-log-response.dto'
import { formatDateTime } from '../../common/utils/date-time.util'

interface WriteLogParams {
  module: string
  action: string
  userId: string | null
  username: string | null
  nickname: string | null
  target: string | null
  detail: string | null
  ip: string | null
  userAgent: string | null
  httpMethod: string
  url: string
  duration: number
  result: 'success' | 'fail'
  errorMessage: string | null
}

@Injectable()
export class LoggingService {
  constructor(
    @InjectRepository(OperationLog)
    private readonly logRepository: Repository<OperationLog>
  ) {}

  /** 异步写入日志（不阻塞主流程） */
  async writeLog(params: WriteLogParams): Promise<void> {
    const log = this.logRepository.create({
      userId: params.userId,
      username: params.username,
      nickname: params.nickname,
      module: params.module,
      action: params.action,
      target: params.target,
      detail: params.detail,
      ip: params.ip,
      userAgent: params.userAgent,
      httpMethod: params.httpMethod,
      url: params.url,
      duration: params.duration,
      result: params.result,
      errorMessage: params.errorMessage
    })

    await this.logRepository.save(log)
  }

  /** 分页查询日志列表 */
  async list(query: QueryOperationLogDto): Promise<OperationLogListResponse> {
    const { keyword, module, action, result, startDate, endDate, page = 1, pageSize = 20 } = query

    const qb = this.logRepository.createQueryBuilder('log')

    if (keyword) {
      qb.andWhere(
        '(log.username LIKE :kw OR log.nickname LIKE :kw OR log.target LIKE :kw OR log.module LIKE :kw)',
        { kw: `%${keyword}%` }
      )
    }

    if (module) {
      qb.andWhere('log.module = :module', { module })
    }

    if (action) {
      qb.andWhere('log.action = :action', { action })
    }

    if (result) {
      qb.andWhere('log.result = :result', { result })
    }

    if (startDate) {
      qb.andWhere('log.createTime >= :startDate', { startDate: new Date(startDate) })
    }

    if (endDate) {
      const endDateTime = new Date(endDate)
      endDateTime.setHours(23, 59, 59, 999)
      qb.andWhere('log.createTime <= :endDate', { endDate: endDateTime })
    }

    qb.orderBy('log.createTime', 'DESC')

    const total = await qb.getCount()
    const data = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany()

    return {
      list: data.map(item => this.toLogItem(item)),
      total,
      page,
      pageSize
    }
  }

  /** 查询单条日志详情 */
  async detail(id: string): Promise<OperationLogItem | null> {
    const log = await this.logRepository.findOne({ where: { id } })
    return log ? this.toLogItem(log) : null
  }

  private toLogItem(log: OperationLog): OperationLogItem {
    return {
      id: log.id,
      userId: log.userId,
      username: log.username,
      nickname: log.nickname,
      module: log.module,
      action: log.action,
      target: log.target,
      detail: log.detail,
      ip: log.ip,
      userAgent: log.userAgent,
      httpMethod: log.httpMethod,
      url: log.url,
      duration: log.duration,
      result: log.result,
      errorMessage: log.errorMessage,
      createTime: formatDateTime(log.createTime)
    }
  }
}
