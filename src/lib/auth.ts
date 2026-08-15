import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { Role } from "./types";

const DEV_FALLBACK = "lumire-dev-secret-change-me";
const rawSecret = process.env.JWT_SECRET || "";

if (process.env.NODE_ENV === "production") {
  if (!rawSecret || rawSecret === DEV_FALLBACK || rawSecret.length < 32) {
    throw new Error(
      "JWT_SECRET باید در پروداکشن تنظیم شود و حداقل ۳۲ کاراکتر تصادفی باشد."
    );
  }
}

const JWT_SECRET = rawSecret || DEV_FALLBACK;
const COOKIE_NAME = "lumire_session";
const JWT_ALGORITHMS: jwt.Algorithm[] = ["HS256"];

export interface SessionPayload {
  userId: string;
  role: Role;
  name: string;
  email: string;
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function createSessionToken(payload: SessionPayload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "8h",
    algorithm: "HS256",
  });
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = createSessionToken(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: JWT_ALGORITHMS,
    }) as SessionPayload;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
