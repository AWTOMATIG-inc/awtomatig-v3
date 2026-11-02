/**
 * A sliding-window limiter kept in memory: enough for one PM2 process on the VPS, and it resets on restart. `allow(key)` records a
 * use and returns false once `max` uses fall inside the window.
 */
export function createLimiter(windowMs: number, max: number) {
  const uses = new Map<string, number[]>();

  return {
    allow(key: string): boolean {
      const now = Date.now();
      // Drop idle keys now and then so the map cannot grow without bound
      if (uses.size > 2000) {
        for (const [k, times] of uses) if (times.every((t) => now - t >= windowMs)) uses.delete(k);
      }
      const recent = (uses.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= max) {
        uses.set(key, recent);
        return false;
      }
      recent.push(now);
      uses.set(key, recent);
      return true;
    },
  };
}
