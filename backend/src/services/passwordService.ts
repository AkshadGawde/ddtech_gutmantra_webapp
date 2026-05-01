import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Verify WordPress phpass password hash
 * Ported from WordPress wp-password-hash algorithm
 */
function verifyPhpass(password: string, hash: string): boolean {
  if (hash.length !== 34) return false;

  const hashPrefix = hash.substring(0, 4); // $P$ or $H$
  if (hashPrefix !== "$P$1" && hashPrefix !== "$H$1") return false;

  const iteration_count_encode = hash[3];
  const itoa64 = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const iteration_count = itoa64.indexOf(iteration_count_encode);

  if (iteration_count < 4 || iteration_count > 31) return false;

  const iterations = 1 << iteration_count;
  const salt = hash.substring(4, 12);

  const md5_hash = crypto
    .createHash("md5")
    .update(salt + password)
    .digest();

  let result = md5_hash;
  for (let i = 0; i < iterations; i++) {
    result = crypto
      .createHash("md5")
      .update(result + password)
      .digest();
  }

  const itoa64_map: { [key: number]: string } = {};
  for (let i = 0; i < 64; i++) {
    itoa64_map[i] = itoa64[i];
  }

  function _hash_encode64(input: Buffer, count: number): string {
    let output = "";
    let i = 0;
    const itoa64 = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    do {
      let value = input[i++];
      output += itoa64[value & 0x3f];

      if (i < count) {
        value |= input[i] << 8;
      }

      output += itoa64[(value >> 6) & 0x3f];

      if (i++ >= count) break;

      if (i < count) {
        value |= input[i] << 16;
      }

      output += itoa64[(value >> 12) & 0x3f];

      if (i++ >= count) break;

      output += itoa64[(value >> 18) & 0x3f];
    } while (i < count);

    return output;
  }

  const hash_result = hashPrefix + itoa64[iteration_count] + salt + _hash_encode64(result, 16);

  return hash_result === hash;
}

/**
 * Main password verification function
 * Supports bcrypt and WordPress phpass hashes
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }

  try {
    // bcrypt hashes start with $2a, $2b, $2x, $2y
    if (hash.startsWith("$2a") || hash.startsWith("$2b") || hash.startsWith("$2x") || hash.startsWith("$2y")) {
      return await bcrypt.compare(password, hash);
    }

    // WordPress phpass hashes start with $P$ or $H$
    if (hash.startsWith("$P$") || hash.startsWith("$H$")) {
      return verifyPhpass(password, hash);
    }

    // Plain text (fallback, should not happen in production)
    return password === hash;
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string, rounds: number = 10): Promise<string> {
  return bcrypt.hash(password, rounds);
}

/**
 * Check if hash is phpass format
 */
export function isPhpassHash(hash: string): boolean {
  return hash.startsWith("$P$") || hash.startsWith("$H$");
}

/**
 * Check if hash is bcrypt format
 */
export function isBcryptHash(hash: string): boolean {
  return hash.startsWith("$2a") || hash.startsWith("$2b") || hash.startsWith("$2x") || hash.startsWith("$2y");
}
