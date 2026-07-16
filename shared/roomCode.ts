// Excludes visually ambiguous characters (0/O, 1/I/L) so codes are easy to read aloud/type on a phone.
const ROOM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const ROOM_CODE_LENGTH = 5;

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

export function normalizeRoomCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isValidRoomCode(input: string): boolean {
  const code = normalizeRoomCode(input);
  if (code.length !== ROOM_CODE_LENGTH) return false;
  return [...code].every((ch) => ROOM_CODE_ALPHABET.includes(ch));
}
