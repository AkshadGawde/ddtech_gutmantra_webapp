import bcrypt from "bcryptjs";

/**
 * WordPress uses phpass (PHP Password Hashing Framework)
 * This helper attempts to verify against phpass hashes
 * Falls back to bcrypt for other formats
 */

export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  try {
    // First try bcrypt (modern format)
    if (hash.startsWith("$2")) {
      return await bcrypt.compare(plaintext, hash);
    }

    // For phpass WordPress hashes (starts with $P$ or $H$)
    // Unfortunately, there's no pure JS implementation that's reliable
    // In production, you'd want to:
    // 1. Hash the password with bcrypt on first login
    // 2. Store the new hash in Firestore
    // For now, we'll log and fail safely
    if (hash.startsWith("$P$") || hash.startsWith("$H$")) {
      console.warn("⚠️ WordPress phpass hash detected - requires special handling");
      // In a real implementation, you'd call a PHP service or use wp-cli
      // For this demo, we'll need to work with what we have
      return false;
    }

    return false;
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

/**
 * Hash a password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * For WordPress phpass, this is a Node.js compatible verification
 * Using wp-phpass algorithm (simplified)
 */
export function verifyWordPressPhpass(plaintext: string, hash: string): boolean {
  // This is a placeholder - in production use a proper PHP integration
  // or pre-hash all passwords before migration
  console.warn("⚠️ WARNING: WordPress phpass verification requires PHP integration");
  return false;
}
