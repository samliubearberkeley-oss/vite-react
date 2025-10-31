// 🚀 KV Cache Management System
// Optimized Key-Value caching for LLM inference with reuse and compression

class KVCacheManager {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.maxMemory = options.maxMemory || 50 * 1024 * 1024; // 50MB
    this.compressionEnabled = options.compression || true;
    this.ttl = options.ttl || 30 * 60 * 1000; // 30 minutes
    
    // Cache storage
    this.cache = new Map();
    this.accessTimes = new Map();
    this.memoryUsage = 0;
    
    // Performance tracking
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      compressions: 0,
      totalRequests: 0
    };
    
    // Cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }

  /**
   * Generate cache key for prompt
   * @param {string} prompt - Input prompt
   * @param {Object} context - Additional context
   * @returns {string} - Cache key
   */
  generateKey(prompt, context = {}) {
    const keyData = {
      prompt: prompt.trim().toLowerCase(),
      model: context.model || 'default',
      temperature: context.temperature || 0.7,
      maxTokens: context.maxTokens || 1000
    };
    
    // Create hash from key data
    const keyString = JSON.stringify(keyData);
    return this.hashString(keyString);
  }

  /**
   * Get cached KV data
   * @param {string} key - Cache key
   * @returns {Object|null} - Cached KV data or null
   */
  get(key) {
    this.stats.totalRequests++;
    
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return null;
    }

    const cached = this.cache.get(key);
    
    // Check TTL
    if (Date.now() - cached.timestamp > this.ttl) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access time
    this.accessTimes.set(key, Date.now());
    this.stats.hits++;
    
    return this.decompressKV(cached.data);
  }

  /**
   * Set KV data in cache
   * @param {string} key - Cache key
   * @param {Object} kvData - KV data to cache
   * @param {Object} metadata - Additional metadata
   */
  set(key, kvData, metadata = {}) {
    // Check memory limit
    if (this.memoryUsage > this.maxMemory) {
      this.evictLRU();
    }

    // Check size limit
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const compressedData = this.compressKV(kvData);
    const size = this.estimateSize(compressedData);
    
    this.cache.set(key, {
      data: compressedData,
      timestamp: Date.now(),
      metadata,
      size
    });
    
    this.accessTimes.set(key, Date.now());
    this.memoryUsage += size;
  }

  /**
   * Delete cached data
   * @param {string} key - Cache key
   */
  delete(key) {
    const cached = this.cache.get(key);
    if (cached) {
      this.memoryUsage -= cached.size;
    }
    
    this.cache.delete(key);
    this.accessTimes.delete(key);
  }

  /**
   * Evict least recently used item
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, time] of this.accessTimes) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Compress KV data
   * @param {Object} kvData - KV data to compress
   * @returns {string} - Compressed data
   */
  compressKV(kvData) {
    if (!this.compressionEnabled) {
      return JSON.stringify(kvData);
    }

    try {
      const jsonString = JSON.stringify(kvData);
      
      // Simple compression - in production, use a real compression library
      const compressed = btoa(jsonString);
      this.stats.compressions++;
      
      return compressed;
    } catch (error) {
      console.warn('KV compression failed:', error);
      return JSON.stringify(kvData);
    }
  }

  /**
   * Decompress KV data
   * @param {string} compressedData - Compressed data
   * @returns {Object} - Decompressed KV data
   */
  decompressKV(compressedData) {
    if (!this.compressionEnabled) {
      return JSON.parse(compressedData);
    }

    try {
      const jsonString = atob(compressedData);
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('KV decompression failed:', error);
      return JSON.parse(compressedData);
    }
  }

  /**
   * Find similar cached prompts
   * @param {string} prompt - Input prompt
   * @param {number} similarityThreshold - Similarity threshold (0-1)
   * @returns {Array} - Similar cached entries
   */
  findSimilar(prompt, similarityThreshold = 0.8) {
    const similar = [];
    const promptWords = this.tokenize(prompt.toLowerCase());
    
    for (const [key, cached] of this.cache) {
      const similarity = this.calculateSimilarity(promptWords, cached.metadata?.words || []);
      
      if (similarity >= similarityThreshold) {
        similar.push({
          key,
          similarity,
          data: this.decompressKV(cached.data),
          timestamp: cached.timestamp
        });
      }
    }
    
    return similar.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Calculate text similarity
   * @param {Array} words1 - First word array
   * @param {Array} words2 - Second word array
   * @returns {number} - Similarity score (0-1)
   */
  calculateSimilarity(words1, words2) {
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Tokenize text into words
   * @param {string} text - Text to tokenize
   * @returns {Array} - Array of words
   */
  tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, cached] of this.cache) {
      if (now - cached.timestamp > this.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));
  }

  /**
   * Estimate data size
   * @param {any} data - Data to estimate
   * @returns {number} - Estimated size in bytes
   */
  estimateSize(data) {
    return JSON.stringify(data).length * 2; // Rough estimate
  }

  /**
   * Hash string to create cache key
   * @param {string} str - String to hash
   * @returns {string} - Hash string
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      size: this.cache.size,
      maxSize: this.maxSize,
      memoryUsage: this.memoryUsage,
      maxMemory: this.maxMemory,
      memoryUtilization: this.memoryUsage / this.maxMemory
    };
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.accessTimes.clear();
    this.memoryUsage = 0;
  }

  /**
   * Destroy cache manager
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

// Singleton KV cache manager
export const kvCacheManager = new KVCacheManager({
  maxSize: 500,
  maxMemory: 25 * 1024 * 1024, // 25MB
  compression: true,
  ttl: 30 * 60 * 1000 // 30 minutes
});

export default KVCacheManager;
