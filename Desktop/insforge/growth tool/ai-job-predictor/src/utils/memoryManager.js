// 🚀 Memory Management Utilities
// Optimized memory usage with monitoring and cleanup

class MemoryManager {
  constructor() {
    this.memoryThreshold = 50 * 1024 * 1024; // 50MB threshold
    this.cleanupInterval = 30000; // 30 seconds
    this.observers = new Set();
    
    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Start memory monitoring
   */
  startMonitoring() {
    if (typeof performance !== 'undefined' && performance.memory) {
      setInterval(() => {
        this.checkMemoryUsage();
      }, this.cleanupInterval);
    }
  }

  /**
   * Check current memory usage
   */
  checkMemoryUsage() {
    if (typeof performance === 'undefined' || !performance.memory) {
      return;
    }

    const memoryInfo = performance.memory;
    const usedMemory = memoryInfo.usedJSHeapSize;
    const totalMemory = memoryInfo.totalJSHeapSize;
    const memoryUsage = (usedMemory / totalMemory) * 100;

    // Notify observers if memory usage is high
    if (memoryUsage > 80) {
      this.notifyObservers({
        type: 'high_memory_usage',
        usedMemory,
        totalMemory,
        memoryUsage
      });
    }

    // Force garbage collection if available
    if (memoryUsage > 90 && global.gc) {
      global.gc();
    }
  }

  /**
   * Add memory observer
   * @param {Function} callback - Observer callback
   */
  addObserver(callback) {
    this.observers.add(callback);
  }

  /**
   * Remove memory observer
   * @param {Function} callback - Observer callback
   */
  removeObserver(callback) {
    this.observers.delete(callback);
  }

  /**
   * Notify all observers
   * @param {Object} data - Notification data
   */
  notifyObservers(data) {
    this.observers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Memory observer error:', error);
      }
    });
  }

  /**
   * Get current memory stats
   * @returns {Object} - Memory statistics
   */
  getMemoryStats() {
    if (typeof performance === 'undefined' || !performance.memory) {
      return { available: false };
    }

    const memoryInfo = performance.memory;
    return {
      used: memoryInfo.usedJSHeapSize,
      total: memoryInfo.totalJSHeapSize,
      limit: memoryInfo.jsHeapSizeLimit,
      usage: (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100,
      available: true
    };
  }

  /**
   * Force memory cleanup
   */
  forceCleanup() {
    // Clear caches
    if (typeof window !== 'undefined' && window.caches) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Notify observers
    this.notifyObservers({
      type: 'cleanup_forced'
    });
  }
}

// Memory-optimized data structures
export class OptimizedArray {
  constructor(initialCapacity = 100) {
    this.data = new Array(initialCapacity);
    this.length = 0;
    this.capacity = initialCapacity;
  }

  push(item) {
    if (this.length >= this.capacity) {
      this.resize();
    }
    this.data[this.length] = item;
    this.length++;
  }

  pop() {
    if (this.length === 0) return undefined;
    this.length--;
    const item = this.data[this.length];
    this.data[this.length] = undefined; // Help GC
    return item;
  }

  get(index) {
    if (index < 0 || index >= this.length) return undefined;
    return this.data[index];
  }

  resize() {
    this.capacity *= 2;
    const newData = new Array(this.capacity);
    for (let i = 0; i < this.length; i++) {
      newData[i] = this.data[i];
    }
    this.data = newData;
  }

  clear() {
    this.data.fill(undefined);
    this.length = 0;
  }

  toArray() {
    return this.data.slice(0, this.length);
  }
}

// Memory-efficient object pool
export class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.size = 0;
    this.maxSize = initialSize * 2;

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
    this.size = initialSize;
  }

  acquire() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    
    if (this.size < this.maxSize) {
      this.size++;
      return this.createFn();
    }
    
    // Pool exhausted, create new object
    return this.createFn();
  }

  release(obj) {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }

  clear() {
    this.pool.length = 0;
    this.size = 0;
  }
}

// Memory-optimized image loader
export class OptimizedImageLoader {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 50;
    this.loadingPromises = new Map();
  }

  async loadImage(src) {
    // Return cached image if available
    if (this.cache.has(src)) {
      return this.cache.get(src);
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src);
    }

    // Start loading
    const loadingPromise = this._loadImage(src);
    this.loadingPromises.set(src, loadingPromise);

    try {
      const image = await loadingPromise;
      this.cache.set(src, image);
      this.loadingPromises.delete(src);
      
      // Cleanup cache if too large
      if (this.cache.size > this.maxCacheSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }

      return image;
    } catch (error) {
      this.loadingPromises.delete(src);
      throw error;
    }
  }

  _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  clearCache() {
    this.cache.clear();
    this.loadingPromises.clear();
  }
}

// Singleton memory manager
export const memoryManager = new MemoryManager();

// Memory monitoring hook for React
export function useMemoryMonitoring() {
  const [memoryStats, setMemoryStats] = useState(memoryManager.getMemoryStats());

  useEffect(() => {
    const updateStats = () => {
      setMemoryStats(memoryManager.getMemoryStats());
    };

    memoryManager.addObserver(updateStats);
    
    const interval = setInterval(updateStats, 5000);

    return () => {
      memoryManager.removeObserver(updateStats);
      clearInterval(interval);
    };
  }, []);

  return memoryStats;
}

export default MemoryManager;
