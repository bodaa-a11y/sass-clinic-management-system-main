import { NextRequest, NextResponse } from 'next/server';

// Rate limiting storage interface - allows pluggable backends
interface RateLimitStorage {
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void>;
  delete(key: string): Promise<void>;
  cleanup?(): Promise<void>;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

// In-memory implementation (default, for development)
class InMemoryStorage implements RateLimitStorage {
  private store = new Map<string, RateLimitEntry>();

  async get(key: string): Promise<RateLimitEntry | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    // Check if entry has expired
    if (Date.now() > entry.resetTime) {
      this.store.delete(key);
      return null;
    }
    return entry;
  }

  async set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void> {
    this.store.set(key, entry);
    
    // Schedule cleanup
    setTimeout(() => {
      const current = this.store.get(key);
      if (current === entry) {
        this.store.delete(key);
      }
    }, ttlMs);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Redis storage implementation (for production)
// Example: const redis = new Redis(process.env.REDIS_URL);
class RedisStorage implements RateLimitStorage {
  constructor(private redis: any) {}

  async get(key: string): Promise<RateLimitEntry | null> {
    const data = await this.redis.get(`rate_limit:${key}`);
    if (!data) return null;
    
    const entry: RateLimitEntry = JSON.parse(data);
    if (Date.now() > entry.resetTime) {
      await this.delete(key);
      return null;
    }
    return entry;
  }

  async set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void> {
    await this.redis.setex(
      `rate_limit:${key}`,
      Math.ceil(ttlMs / 1000),
      JSON.stringify(entry)
    );
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(`rate_limit:${key}`);
  }
}

// Configuration
interface RateLimitConfig {
  storage?: RateLimitStorage;
  maxRequests?: number;
  windowMs?: number;
  keyPrefix?: string;
}

// Default configuration
const DEFAULT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '50');
const DEFAULT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'); // 1 minute

// Current storage backend
let currentStorage: RateLimitStorage = new InMemoryStorage();

// Configure the rate limiter
export function configureRateLimit(config: RateLimitConfig): void {
  if (config.storage) {
    currentStorage = config.storage;
  }
}

// Get client IP from request
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) return realIP;
  if (cfConnectingIP) return cfConnectingIP;
  
  return 'unknown';
}

// Main rate limiting function
export async function rateLimit(
  identifier: string,
  maxRequests: number = DEFAULT_MAX_REQUESTS,
  windowMs: number = DEFAULT_WINDOW_MS
): Promise<RateLimitResult> {
  const now = Date.now();
  const entry = await currentStorage.get(identifier);

  if (!entry || now > entry.resetTime) {
    // New window
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs,
    };
    await currentStorage.set(identifier, newEntry, windowMs);
    return { 
      success: true, 
      remaining: maxRequests - 1, 
      resetTime: newEntry.resetTime,
      limit: maxRequests 
    };
  }

  if (entry.count >= maxRequests) {
    return { 
      success: false, 
      remaining: 0, 
      resetTime: entry.resetTime,
      limit: maxRequests 
    };
  }

  entry.count++;
  await currentStorage.set(identifier, entry, windowMs);
  return { 
    success: true, 
    remaining: maxRequests - entry.count, 
    resetTime: entry.resetTime,
    limit: maxRequests 
  };
}

// Middleware helper
export async function rateLimitMiddleware(
  request: NextRequest,
  identifier: string,
  maxRequests?: number,
  windowMs?: number
): Promise<NextResponse | null> {
  const result = await rateLimit(identifier, maxRequests, windowMs);

  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.resetTime),
          'Retry-After': String(Math.ceil((result.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  return null;
}

// Cleanup job (run periodically in production)
export async function cleanupRateLimits(): Promise<void> {
  if (currentStorage.cleanup) {
    await currentStorage.cleanup();
  }
}

// Export storage classes for external use
export { InMemoryStorage, RedisStorage, type RateLimitStorage, type RateLimitEntry, type RateLimitResult };
