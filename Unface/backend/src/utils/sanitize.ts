import validator from 'validator';

export function sanitizeString(input: string, maxLength = 500): string {
  return validator.escape(validator.trim(input)).slice(0, maxLength);
}

export function sanitizeEmail(email: string): string {
  return validator.normalizeEmail(validator.trim(email)) || '';
}
