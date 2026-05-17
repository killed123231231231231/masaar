import { customAlphabet } from "nanoid";

// Url-safe, no ambiguous characters (no 0/O, 1/l/I).
const alphabet = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";

export const generateShortId = customAlphabet(alphabet, 7);
