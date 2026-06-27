import { getRequiredEnv } from '../../config/env'

const UPLOAD_PUBLIC_BASE_URL = getRequiredEnv('UPLOAD_PUBLIC_BASE_URL').replace(/\/+$/, '')
const UPLOAD_PUBLIC_BASE_URL_WITH_SLASH = `${UPLOAD_PUBLIC_BASE_URL}/`

export const resolvePublicAssetUrl = (assetUrl: string | null): string | null => {
  if (!assetUrl) {
    return null
  }

  const normalized = assetUrl.trim()

  if (!normalized) {
    return null
  }

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized
  }

  try {
    return new URL(normalized, UPLOAD_PUBLIC_BASE_URL_WITH_SLASH).toString()
  } catch {
    if (normalized.startsWith('/')) {
      return `${UPLOAD_PUBLIC_BASE_URL}${normalized}`
    }

    return `${UPLOAD_PUBLIC_BASE_URL}/${normalized}`
  }
}
