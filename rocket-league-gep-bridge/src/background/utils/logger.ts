export const logger = {
  info: (...args: unknown[]) => console.log('[RL-BRIDGE]', ...args),
  warn: (...args: unknown[]) => console.warn('[RL-BRIDGE]', ...args),
  error: (...args: unknown[]) => console.error('[RL-BRIDGE]', ...args)
};
