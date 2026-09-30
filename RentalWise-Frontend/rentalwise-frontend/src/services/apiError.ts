/**
 * Pulls a readable message out of whatever shape the API or Axios produced.
 *
 * The API returns at least four different error shapes - a bare string, `{ message }`,
 * an RFC 9110 problem document, and FluentValidation's `{ errors: { field: [...] } }` -
 * so this is the one place that knows about all of them.
 */
export function describeApiError(error: unknown, fallback: string): string {
  const response = (error as { response?: { status?: number; data?: unknown } })?.response;

  if (response?.status === 502) {
    return "The assistant is unavailable right now. Please try again in a moment.";
  }

  const data = response?.data;

  if (typeof data === "string" && data.trim()) return data;

  const asObject = data as
    | { message?: string; title?: string; errors?: Record<string, string[]> }
    | undefined;

  // FluentValidation failures arrive here; show the first one rather than a generic title.
  if (asObject?.errors) {
    const first = Object.values(asObject.errors).flat()[0];
    if (first) return first;
  }

  return asObject?.message ?? asObject?.title ?? fallback;
}
