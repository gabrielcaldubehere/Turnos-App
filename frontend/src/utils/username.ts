export const normalizeUsername = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");

export const isValidUsername = (value: string): boolean =>
  /^[a-z0-9_-]{3,64}$/.test(normalizeUsername(value));
