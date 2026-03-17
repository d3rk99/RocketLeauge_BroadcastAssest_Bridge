export const getNodeRequire = (): ((id: string) => any) | undefined => {
  try {
    const fn = Function('return typeof require !== "undefined" ? require : undefined;');
    const req = fn();
    return typeof req === 'function' ? req : undefined;
  } catch {
    return undefined;
  }
};
