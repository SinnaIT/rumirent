/**
 * Server-side in-memory cache for commission rules
 * TTL: 2 hours
 * Invalidates automatically on new lead creation
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class CommissionRulesCache {
  private cache: Map<string, CacheEntry<any>>;
  private readonly TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cache = new Map();
    this.startCleanupJob();
  }

  /**
   * Generate cache key for broker's monthly commission data
   */
  private generateKey(brokerId: string, yearMonth: string, comisionId?: string): string {
    if (comisionId) {
      return `broker:${brokerId}:month:${yearMonth}:commission:${comisionId}`;
    }
    return `broker:${brokerId}:month:${yearMonth}:all`;
  }

  /**
   * Get cached data if not expired
   */
  get<T>(brokerId: string, yearMonth: string, comisionId?: string): T | null {
    const key = this.generateKey(brokerId, yearMonth, comisionId);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache data with TTL
   */
  set<T>(brokerId: string, yearMonth: string, data: T, comisionId?: string): void {
    const key = this.generateKey(brokerId, yearMonth, comisionId);
    const expiresAt = Date.now() + this.TTL_MS;

    this.cache.set(key, {
      data,
      expiresAt,
    });
  }

  /**
   * Invalidate all cache entries for a specific broker and month
   * Called when a new lead is created
   */
  invalidateBrokerMonth(brokerId: string, yearMonth: string): void {
    // Delete all entries matching this broker and month
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(`broker:${brokerId}:month:${yearMonth}`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Invalidate specific commission for a broker and month
   */
  invalidateSpecificCommission(brokerId: string, yearMonth: string, comisionId: string): void {
    const specificKey = this.generateKey(brokerId, yearMonth, comisionId);
    const allKey = this.generateKey(brokerId, yearMonth);

    this.cache.delete(specificKey);
    this.cache.delete(allKey); // Also invalidate "all commissions" cache
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Start background job to clean expired entries
   */
  private startCleanupJob(): void {
    // Run cleanup every 30 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => this.cache.delete(key));

      if (keysToDelete.length > 0) {
        console.log(`[CommissionRulesCache] Cleaned up ${keysToDelete.length} expired entries`);
      }
    }, 30 * 60 * 1000);
  }

  /**
   * Stop cleanup job (for graceful shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }

  /**
   * Get cache statistics (for debugging)
   */
  getStats(): { totalEntries: number; expiredEntries: number } {
    const now = Date.now();
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries,
    };
  }
}

// Singleton instance
export const commissionRulesCache = new CommissionRulesCache();

// Helper function to format year-month string
export function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
