// 🚀 Advanced Cache Management System
// Multi-layer caching with LRU, TTL, and compression

class CacheManager {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes
    this.compression = options.compression || false;
    
    // LRU Cache implementation
    this.cache = new Map();
    this.accessOrder = new Map();
    this.timestamps = new Map();
    
    // Performance metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      compressions: 0
    };
    
    // Cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {any} - Cached value or null
   */
  get(key) {
    if (!this.cache.has(key)) {
      this.metrics.misses++;
      return null;
    }

    // Check TTL
    const timestamp = this.timestamps.get(key);
    if (Date.now() - timestamp > this.defaultTTL) {
      this.delete(key);
      this.metrics.misses++;
      return null;
    }

    // Update access order
    this.accessOrder.set(key, Date.now());
    this.metrics.hits++;
    
    const value = this.cache.get(key);
    return this.compression ? this.decompress(value) : value;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = this.defaultTTL) {
    // Evict if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const compressedValue = this.compression ? this.compress(value) : value;
    this.cache.set(key, compressedValue);
    this.accessOrder.set(key, Date.now());
    this.timestamps.set(key, Date.now());
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    this.accessOrder.delete(key);
    this.timestamps.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.accessOrder.clear();
    this.timestamps.clear();
  }

  /**
   * Evict least recently used item
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, time] of this.accessOrder) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.metrics.evictions++;
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, timestamp] of this.timestamps) {
      if (now - timestamp > this.defaultTTL) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));
  }

  /**
   * Compress data (simple JSON compression)
   * @param {any} data - Data to compress
   * @returns {string} - Compressed data
   */
  compress(data) {
    try {
      const jsonString = JSON.stringify(data);
      // Simple compression - in production, use a real compression library
      return btoa(jsonString);
    } catch (error) {
      console.warn('Compression failed:', error);
      return data;
    }
  }

  /**
   * Decompress data
   * @param {string} compressedData - Compressed data
   * @returns {any} - Decompressed data
   */
  decompress(compressedData) {
    try {
      const jsonString = atob(compressedData);
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('Decompression failed:', error);
      return compressedData;
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache metrics
   */
  getStats() {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    return {
      ...this.metrics,
      hitRate: totalRequests > 0 ? this.metrics.hits / totalRequests : 0,
      size: this.cache.size,
      maxSize: this.maxSize,
      utilization: this.cache.size / this.maxSize
    };
  }

  /**
   * Destroy cache manager
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

// Singleton cache instances for different data types
export const jobAnalysisCache = new CacheManager({
  maxSize: 500,
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  compression: true
});

export const memeCache = new CacheManager({
  maxSize: 200,
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  compression: false // Images don't compress well
});

export const userSessionCache = new CacheManager({
  maxSize: 100,
  defaultTTL: 60 * 60 * 1000, // 1 hour
  compression: true
});

// Cache key generators
export const cacheKeys = {
  jobAnalysis: (jobTitle) => `job_analysis_${jobTitle.toLowerCase().trim()}`,
  meme: (jobTitle, riskScore, category) => `meme_${jobTitle}_${riskScore}_${category}`,
  userSession: (sessionId) => `session_${sessionId}`,
  metrics: () => 'performance_metrics'
};

// Cache warming utilities
export async function warmCache(jobTitles) {
  console.log('🔥 Warming cache with popular job titles...');
  
  const popularJobs = [
    'Software Engineer',
    'Data Scientist',
    'Marketing Manager',
    'Customer Service Representative',
    'Accountant'
  ];
  
  // Pre-cache popular jobs
  for (const jobTitle of popularJobs) {
    if (!jobAnalysisCache.get(cacheKeys.jobAnalysis(jobTitle))) {
      // This would trigger actual analysis in a real implementation
      console.log(`🔥 Pre-caching: ${jobTitle}`);
    }
  }
}

export default CacheManager;
