const DEFAULT_TIMEOUT_MS = 8_000

/**
 * Bounded fetch for Supabase — fails fast instead of hanging ~10s+ on blocked networks.
 */
export function supabaseFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  const signal = init?.signal
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeout)
      controller.abort()
    } else {
      signal.addEventListener("abort", () => controller.abort(), { once: true })
    }
  }

  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timeout)
  })
}

export function isSupabaseFetchFailure(error: unknown) {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  const cause = String(error.cause ?? "").toLowerCase()
  return (
    message.includes("fetch failed") ||
    message.includes("aborted") ||
    message.includes("timeout") ||
    cause.includes("timeout") ||
    cause.includes("abort") ||
    cause.includes("connect")
  )
}
