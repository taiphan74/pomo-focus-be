export function parseDurationToMs(input: string | number | undefined, fallbackMs = 0): number {
  if (input == null) return fallbackMs;
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  const s = String(input).trim().toLowerCase();
  // plain integer string -> treat as milliseconds
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);

  // pattern: number + unit
  const m = s.match(/^([0-9]*\.?[0-9]+)\s*(ms|s|m|h|d|w|y)$/);
  if (!m) return fallbackMs;

  const val = parseFloat(m[1]);
  const unit = m[2];
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    y: 365 * 24 * 60 * 60 * 1000,
  };

  return Math.round(val * (multipliers[unit] ?? 0));
}
