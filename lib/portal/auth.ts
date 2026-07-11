import { SignJWT, jwtVerify } from 'jose';
import { hash, compare } from 'bcryptjs';
import { db } from '@/db';
import { patientPortalAccounts, patients, patientSessions } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export interface PatientAuthPayload {
  patientId: string;
  patientAccountId: string;
  role: 'patient';
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 10);
}

/**
 * Compare a password with a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await compare(password, hash);
}

/**
 * Generate a JWT token for patient
 */
export async function signPatientToken(payload: PatientAuthPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Token expires in 7 days
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify a patient JWT token
 */
export async function verifyPatientToken(token: string): Promise<PatientAuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as PatientAuthPayload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Register a new patient portal account
 */
export async function registerPatientAccount(data: {
  patientId: string;
  email: string;
  password: string;
}) {
  // Check if patient exists
  const patient = await db
    .select()
    .from(patients)
    .where(eq(patients.id, data.patientId))
    .limit(1);

  if (patient.length === 0) {
    throw new Error('Patient not found');
  }

  // Check if email already exists
  const existingAccount = await db
    .select()
    .from(patientPortalAccounts)
    .where(eq(patientPortalAccounts.email, data.email))
    .limit(1);

  if (existingAccount.length > 0) {
    throw new Error('Email already registered');
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Create patient portal account
  const [newAccount] = await db
    .insert(patientPortalAccounts)
    .values({
      patientId: data.patientId,
      email: data.email,
      passwordHash,
    })
    .returning();

  return newAccount;
}

/**
 * Login a patient
 */
export async function loginPatient(email: string, password: string) {
  // Find patient account by email
  const [account] = await db
    .select({
      id: patientPortalAccounts.id,
      patientId: patientPortalAccounts.patientId,
      email: patientPortalAccounts.email,
      passwordHash: patientPortalAccounts.passwordHash,
      isActive: patientPortalAccounts.isActive,
      emailVerified: patientPortalAccounts.emailVerified,
    })
    .from(patientPortalAccounts)
    .where(
      and(
        eq(patientPortalAccounts.email, email),
        isNull(patientPortalAccounts.deletedAt)
      )
    )
    .limit(1);

  if (!account) {
    throw new Error('Invalid email or password');
  }

  if (!account.isActive) {
    throw new Error('Account is deactivated');
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password, account.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  await db
    .update(patientPortalAccounts)
    .set({ lastLoginAt: new Date() })
    .where(eq(patientPortalAccounts.id, account.id));

  // Generate JWT token
  const token = await signPatientToken({
    patientId: account.patientId,
    patientAccountId: account.id,
    role: 'patient',
  });

  // Create session
  await db.insert(patientSessions).values({
    patientAccountId: account.id,
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  return {
    token,
    patient: {
      id: account.patientId,
      accountId: account.id,
      email: account.email,
      emailVerified: account.emailVerified,
    },
  };
}

/**
 * Logout a patient (invalidate session)
 */
export async function logoutPatient(token: string) {
  await db
    .delete(patientSessions)
    .where(eq(patientSessions.token, token));
}

/**
 * Verify patient email
 */
export async function verifyPatientEmail(patientAccountId: string) {
  await db
    .update(patientPortalAccounts)
    .set({ emailVerified: true })
    .where(eq(patientPortalAccounts.id, patientAccountId));
}

/**
 * Get patient account by ID
 */
export async function getPatientAccountById(patientAccountId: string) {
  const [account] = await db
    .select()
    .from(patientPortalAccounts)
    .where(eq(patientPortalAccounts.id, patientAccountId))
    .limit(1);

  return account || null;
}

/**
 * Get patient account by email
 */
export async function getPatientAccountByEmail(email: string) {
  const [account] = await db
    .select()
    .from(patientPortalAccounts)
    .where(
      and(
        eq(patientPortalAccounts.email, email),
        isNull(patientPortalAccounts.deletedAt)
      )
    )
    .limit(1);

  return account || null;
}
