import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: { 
  userId: string; 
  email: string; 
  role: string; 
  clinicId?: string | null;
  permissions?: Record<string, string[]>
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ 
  userId: string; 
  email: string; 
  role: string; 
  clinicId?: string | null;
  permissions?: Record<string, string[]>
}> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as { 
    userId: string; 
    email: string; 
    role: string; 
    clinicId?: string | null;
    permissions?: Record<string, string[]>
  };
}
