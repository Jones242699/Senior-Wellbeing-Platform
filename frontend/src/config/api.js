export const DEFAULT_API_BASE = 'https://k2algu70g6.execute-api.ap-southeast-2.amazonaws.com'

export function pickValidApiBase(...candidates) {
  for (const raw of candidates) {
    const value = typeof raw === 'string' ? raw.trim() : ''
    if (!value) continue
    if (/xxxx|example|your-api/i.test(value)) continue
    const normalized = value.replace(/\/$/, '')
    try {
      const parsed = new URL(normalized)
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return normalized
    } catch {
      // Skip malformed URLs and continue trying the next candidate.
    }
  }
  return DEFAULT_API_BASE
}

export function getApiBase(...serviceSpecificCandidates) {
  return pickValidApiBase(...serviceSpecificCandidates, import.meta.env.VITE_API_BASE, DEFAULT_API_BASE)
}

export function buildApiUrl(path, base) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return new URL(normalizedPath, `${base.replace(/\/$/, '')}/`)
}
