import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const parseEnvValue = (value: string): string => {
  const trimmedValue = value.trim()

  if (
    (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
    (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))
  ) {
    return trimmedValue.slice(1, -1)
  }

  return trimmedValue
}

const loadEnvFiles = () => {
  const mode = process.env.NODE_ENV || 'development'
  const envFiles = ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]
  const mergedEnv: Record<string, string> = {}

  envFiles.forEach(fileName => {
    const filePath = resolve(process.cwd(), fileName)

    if (!existsSync(filePath)) {
      return
    }

    const fileContent = readFileSync(filePath, 'utf-8')

    fileContent.split(/\r?\n/).forEach(line => {
      const trimmedLine = line.trim()

      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return
      }

      const separatorIndex = trimmedLine.indexOf('=')
      if (separatorIndex === -1) {
        return
      }

      const key = trimmedLine.slice(0, separatorIndex).trim()
      const value = trimmedLine.slice(separatorIndex + 1)

      if (!key) {
        return
      }

      mergedEnv[key] = parseEnvValue(value)
    })
  })

  Object.entries(mergedEnv).forEach(([key, value]) => {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  })
}

loadEnvFiles()

export const getRequiredEnv = (name: string): string => {
  const value = process.env[name]

  if (!value) {
    throw new Error(`缺少必需的环境变量: ${name}`)
  }

  return value
}
