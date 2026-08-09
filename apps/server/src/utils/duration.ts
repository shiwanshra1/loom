const UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 60 * 60 * 24,
};

/** Parses simple durations like "15m" or "30d" into seconds. */
export function parseDurationToSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) {
    throw new Error(`Unsupported duration format: ${value}`);
  }
  const [, amount, unit] = match;
  const unitSeconds = UNIT_SECONDS[unit as keyof typeof UNIT_SECONDS];
  if (unitSeconds === undefined) {
    throw new Error(`Unsupported duration unit: ${unit}`);
  }
  return Number(amount) * unitSeconds;
}
