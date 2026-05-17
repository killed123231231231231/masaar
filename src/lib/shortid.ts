import { customAlphabet } from "nanoid";

// Url-safe, no ambiguous characters (no 0/O, 1/l/I).
const alphabet = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
export const SHORT_ID_LENGTH = 7;

export const generateShortId = customAlphabet(alphabet, SHORT_ID_LENGTH);

// The customizer generates the shortId client-side so the previewed/
// downloaded QR matches what gets saved. The server must not trust an
// arbitrary client string, so validate it against the same alphabet
// before persisting (the alphabet is alphanumeric — safe in a char class).
const shortIdPattern = new RegExp(`^[${alphabet}]{${SHORT_ID_LENGTH}}$`);

export function isValidShortId(value: unknown): value is string {
  return typeof value === "string" && shortIdPattern.test(value);
}
