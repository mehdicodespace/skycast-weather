export async function getJson(url: URL, signal?: AbortSignal): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(url, {
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(15000)])
        : AbortSignal.timeout(15000),
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new Error('Couldn’t reach the weather service. Check your connection and try again.', {
      cause: error,
    })
  }
  if (!response.ok) {
    throw new Error(
      response.status === 429
        ? 'The weather service is busy. Please try again in a minute.'
        : 'The weather service could not complete that request. Please try again.',
    )
  }
  return response.json()
}
