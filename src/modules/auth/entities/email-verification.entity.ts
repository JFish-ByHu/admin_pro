import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('email_verifications')
export class EmailVerification {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 128 })
  email!: string

  @Column({ type: 'varchar', length: 32 })
  scene!: string

  @Column({ type: 'varchar', length: 128 })
  codeHash!: string

  @Column({ type: 'datetime' })
  expiresAt!: Date

  @Column({ type: 'datetime', nullable: true })
  usedAt!: Date | null

  @Column({ type: 'int', default: 0 })
  attemptCount!: number

  @Column({ type: 'datetime', nullable: true })
  lastSentAt!: Date | null

  @Column({ type: 'int', default: 0 })
  sendCountDaily!: number

  @Column({ type: 'varchar', length: 10, nullable: true })
  sendCountDate!: string | null

  @Column({ type: 'varchar', length: 64, nullable: true })
  clientIp!: string | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent!: string | null

  @CreateDateColumn()
  createTime!: Date

  @UpdateDateColumn()
  updateTime!: Date
}
