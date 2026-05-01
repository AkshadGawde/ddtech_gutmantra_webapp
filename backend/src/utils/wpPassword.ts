import { PasswordHash } from "wordpress-hash-node";

export function verifyWPPassword(
  plainPassword: string,
  wpHash: string
): boolean {
  const hasher = new PasswordHash();
  return hasher.checkPassword(plainPassword, wpHash);
}