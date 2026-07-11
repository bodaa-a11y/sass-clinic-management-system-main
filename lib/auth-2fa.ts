// Two-Factor Authentication (2FA) System
// Simple TOTP-based 2FA implementation

export interface TwoFactorConfig {
  enabled: boolean
  secret?: string
  backupCodes?: string[]
}

export interface TwoFactorVerifyResult {
  success: boolean
  error?: string
}

// Generate a random secret for TOTP
export function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let secret = ''
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return secret
}

// Generate backup codes
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    codes.push(code)
  }
  return codes
}

// Simple TOTP verification (mock implementation)
// In production, use libraries like 'otplib' or 'speakeasy'
export function verifyTOTP(token: string, secret: string): boolean {
  // Mock verification - replace with actual TOTP library
  // Example with 'otplib':
  // const otplib = require('otplib')
  // otplib.authenticator.check(token, secret)
  
  // For demo purposes, accept any 6-digit code
  return /^\d{6}$/.test(token)
}

// Generate QR code URL for authenticator apps
export function generateQRCodeURL(
  secret: string,
  email: string,
  appName: string = 'Clinic Management System'
): string {
  // Replace with actual QR code generation library
  // Example with 'qrcode':
  // const QRCode = require('qrcode')
  // return QRCode.toDataURL(`otpauth://totp/${appName}:${email}?secret=${secret}&issuer=${appName}`)
  
  return `otpauth://totp/${appName}:${email}?secret=${secret}&issuer=${appName}`
}

export class TwoFactorAuthService {
  private config: TwoFactorConfig

  constructor(config: TwoFactorConfig = { enabled: false }) {
    this.config = config
  }

  enable(email: string): { secret: string; qrCodeURL: string; backupCodes: string[] } {
    const secret = generateTOTPSecret()
    const backupCodes = generateBackupCodes()
    const qrCodeURL = generateQRCodeURL(secret, email)

    this.config = {
      enabled: true,
      secret,
      backupCodes,
    }

    return { secret, qrCodeURL, backupCodes }
  }

  disable(): void {
    this.config = { enabled: false }
  }

  verify(token: string): TwoFactorVerifyResult {
    if (!this.config.enabled || !this.config.secret) {
      return { success: false, error: '2FA is not enabled' }
    }

    if (verifyTOTP(token, this.config.secret)) {
      return { success: true }
    }

    return { success: false, error: 'Invalid token' }
  }

  verifyBackupCode(code: string): TwoFactorVerifyResult {
    if (!this.config.enabled || !this.config.backupCodes) {
      return { success: false, error: '2FA is not enabled' }
    }

    const index = this.config.backupCodes.indexOf(code.toUpperCase())
    if (index !== -1) {
      // Remove used backup code
      this.config.backupCodes.splice(index, 1)
      return { success: true }
    }

    return { success: false, error: 'Invalid backup code' }
  }

  getConfig(): TwoFactorConfig {
    return { ...this.config }
  }

  isEnabled(): boolean {
    return this.config.enabled
  }
}

// Singleton instance
let twoFactorService: TwoFactorAuthService | null = null

export function getTwoFactorService(config?: TwoFactorConfig): TwoFactorAuthService {
  if (!twoFactorService) {
    twoFactorService = new TwoFactorAuthService(config)
  }
  return twoFactorService
}

// Store 2FA config in localStorage (for demo purposes)
export function storeTwoFactorConfig(userId: string, config: TwoFactorConfig): void {
  if (typeof window !== 'undefined') {
    const key = `2fa-${userId}`
    localStorage.setItem(key, JSON.stringify(config))
  }
}

export function getStoredTwoFactorConfig(userId: string): TwoFactorConfig | null {
  if (typeof window !== 'undefined') {
    const key = `2fa-${userId}`
    const stored = localStorage.getItem(key)
    if (stored) {
      return JSON.parse(stored)
    }
  }
  return null
}
