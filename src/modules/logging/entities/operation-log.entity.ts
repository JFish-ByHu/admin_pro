import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm'

@Entity('operation_logs')
export class OperationLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  /** 操作人 ID，未登录则为 null */
  @Column({ type: 'varchar', length: 36, nullable: true })
  userId!: string | null

  /** 操作人用户名 */
  @Column({ type: 'varchar', length: 100, nullable: true })
  username!: string | null

  /** 操作人昵称 */
  @Column({ type: 'varchar', length: 100, nullable: true })
  nickname!: string | null

  /** 操作模块，如「用户管理」「角色管理」「菜单管理」「权限管理」「认证」 */
  @Column({ type: 'varchar', length: 50 })
  module!: string

  /** 操作类型，如「新增」「修改」「删除」「批量删除」「授权」「登录」「登出」 */
  @Column({ type: 'varchar', length: 30 })
  action!: string

  /** 操作对象描述，如「角色「超级管理员」」「用户 rico.hu」 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  target!: string | null

  /** 请求体/参数快照（JSON），用于记录操作详情 */
  @Column({ type: 'text', nullable: true })
  detail!: string | null

  /** 请求来源 IP */
  @Column({ type: 'varchar', length: 50, nullable: true })
  ip!: string | null

  /** User-Agent */
  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent!: string | null

  /** 请求方法 GET / POST / PATCH / DELETE */
  @Column({ type: 'varchar', length: 10 })
  httpMethod!: string

  /** 请求路径 */
  @Column({ type: 'varchar', length: 300 })
  url!: string

  /** 请求耗时（毫秒） */
  @Column({ type: 'int', default: 0 })
  duration!: number

  /** 操作结果 */
  @Column({ type: 'varchar', length: 10, default: 'success' })
  result!: 'success' | 'fail'

  /** 失败时的错误信息 */
  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null

  @CreateDateColumn()
  createTime!: Date
}
