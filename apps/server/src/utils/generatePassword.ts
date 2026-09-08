import { randomInt } from 'node:crypto';

const DIGITS = '0123456789';

// crypto.randomInt, not Math.random — this generates the temp password every
// admin-provisioned account (single-create or CSV-bulk) logs in with, so it
// needs to be cryptographically unpredictable, not just "looks random."
export function generateTempPassword(length = 8): string {
  let password = '';
  for (let i = 0; i < length; i += 1) {
    password += DIGITS[randomInt(DIGITS.length)];
  }
  return password;
}
