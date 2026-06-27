import * as bcrypt from 'bcryptjs'

const PASSWORD_SALT_ROUNDS = 10

export class PasswordUtil {
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, PASSWORD_SALT_ROUNDS)
  }

  static async compare(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash)
  }
}
