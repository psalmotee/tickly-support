import crypto from "crypto";

/**
 * Hash a password using PBKDF2
 * PBKDF2 provides better security than simple hashing
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored hash
 */
export function verifyPassword(
  password: string,
  passwordHash: string,
): boolean {
  try {
    const parts = passwordHash.split(":");
    if (parts.length !== 2) return false;

    const [salt, storedHash] = parts;
    const hash = crypto
      .pbkdf2Sync(password, salt, 100000, 64, "sha512")
      .toString("hex");

    return hash === storedHash;
  } catch {
    return false;
  }
}

/**
 * Generate a JWT token payload
 * This is a simple JWT implementation - in production, use a proper library like jsonwebtoken
 */
export function generateJwtToken(user: {
  id: string;
  email: string;
  role: "admin" | "user";
}): string {
  const header = Base64.stringify({
    alg: "HS256",
    typ: "JWT",
  });

  const now = Math.floor(Date.now() / 1000);
  const payload = Base64.stringify({
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: now,
    exp: now + 7 * 24 * 60 * 60, // 7 days
  });

  const secret = process.env.JWT_SECRET || "default-secret-key";
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${header}.${payload}.${signature}`;
}

// Simple Base64 encoder compatible with JSON
const Base64 = {
  stringify(obj: unknown): string {
    const jsonString = JSON.stringify(obj);
    return Buffer.from(jsonString).toString("base64url");
  },
  parse(str: string): Record<string, unknown> {
    const jsonString = Buffer.from(str, "base64url").toString();
    return JSON.parse(jsonString);
  },
};
