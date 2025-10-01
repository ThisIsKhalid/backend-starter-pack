import { redisClient } from "../../lib/redisClient";

// Common TTL values (in seconds)
export const TTL = {
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
} as const;

export class Cache {
  // Get data from cache
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // Set data in cache with TTL
  static async set(
    key: string,
    value: any,
    ttl: number = TTL.HOUR
  ): Promise<void> {
    try {
      await redisClient.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error("Cache set failed:", error);
    }
  }

  // Delete one or more cache keys
  static async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    try {
      await redisClient.del(...keys);
    } catch (error) {
      console.error("Cache delete failed:", error);
    }
  }

  // Cache-aside pattern: get from cache or fetch and cache
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = TTL.HOUR
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const data = await fetcher();
    await this.set(key, data, ttl);
    return data;
  }

  // Check if key exists
  static async exists(key: string): Promise<boolean> {
    try {
      return (await redisClient.exists(key)) === 1;
    } catch {
      return false;
    }
  }

  // Increment counter with optional TTL
  static async incr(key: string, ttl?: number): Promise<number> {
    try {
      const result = await redisClient.incr(key);
      if (ttl && result === 1) {
        await redisClient.expire(key, ttl);
      }
      return result;
    } catch {
      return 0;
    }
  }

  // Clear all cache (use with caution)
  static async clear(): Promise<void> {
    try {
      await redisClient.flushall();
    } catch (error) {
      console.error("Cache clear failed:", error);
    }
  }
}
