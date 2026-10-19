export function parsePositiveInt(value: string | null): number | undefined {
  if (value === null || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return parsed > 0 ? parsed : undefined;
}

export function parseEnum<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T | undefined {
  return allowed.find((item) => item === value);
}

/** Returns a copy of `params` with the given keys set (or removed for undefined/null). */
export function withParams(
  params: URLSearchParams,
  patch: Record<string, string | number | boolean | null | undefined>,
): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === null || value === '') next.delete(key);
    else next.set(key, String(value));
  }
  return next;
}
