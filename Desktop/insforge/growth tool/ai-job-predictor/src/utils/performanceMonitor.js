// 🚀 Performance Monitoring System
// Comprehensive performance tracking and analytics

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      // Request metrics
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      
      // AI-specific metrics
      aiRequests: 0,
      aiResponseTime: 0,
      aiTokensUsed: 0,
      aiCost: 0,
      
      // Cache metrics
      cacheHits: 0,
      cacheMisses: 0,
      
      // User experience metrics
      userSessions: 0,
      avgSessionDuration: 0,
      bounceRate: 0,
      
      // Error metrics
      errors: 0,
      errorRate: 0,
      errorTypes: new Map()
    };

    this.observers = new Set();
    this.isMonitoring = false;
    
    // Performance entries
    this.entries = [];
    this.maxEntries = 1000;
    
    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Monitor page load performance
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        this.recordPageLoad();
      });
      
      // Monitor navigation timing
      if (performance.getEntriesByType) {
        this.recordNavigationTiming();
      }
      
      // Monitor resource loading
      if (performance.getEntriesByType) {
        this.recordResourceTiming();
      }
    }
  }

  /**
   * Record custom metric
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {Object} metadata - Additional metadata
   */
  recordMetric(name, value, metadata = {}) {
    const entry = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };
    
    this.entries.push(entry);
    
    // Keep only recent entries
    if (this.entries.length > this.maxEntries) {
      this.entries.splice(0, this.entries.length - this.maxEntries);
    }
    
    // Update aggregated metrics
    this.updateAggregatedMetrics(name, value);
    
    // Notify observers
    this.notifyObservers({ type: 'metric', name, value, metadata });
  }

  /**
   * Record AI request performance
   * @param {Object} requestData - Request data
   * @param {Object} responseData - Response data
   */
  recordAIRequest(requestData, responseData) {
    const startTime = requestData.startTime || Date.now();
    const endTime = responseData.endTime || Date.now();
    const responseTime = endTime - startTime;
    
    this.metrics.aiRequests++;
    this.metrics.aiResponseTime = 
      (this.metrics.aiResponseTime * (this.metrics.aiRequests - 1) + responseTime) / 
      this.metrics.aiRequests;
    
    if (responseData.tokens) {
      this.metrics.aiTokensUsed += responseData.tokens;
    }
    
    if (responseData.cost) {
      this.metrics.aiCost += responseData.cost;
    }
    
    this.recordMetric('ai_request', responseTime, {
      model: requestData.model,
      tokens: responseData.tokens,
      cost: responseData.cost,
      success: responseData.success
    });
  }

  /**
   * Record cache performance
   * @param {string} operation - Cache operation (hit/miss)
   * @param {string} key - Cache key
   * @param {number} responseTime - Response time
   */
  recordCacheOperation(operation, key, responseTime) {
    if (operation === 'hit') {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
    
    this.recordMetric('cache_operation', responseTime, {
      operation,
      key: key.substring(0, 20) + '...', // Truncate key for privacy
      responseTime
    });
  }

  /**
   * Record user session
   * @param {Object} sessionData - Session data
   */
  recordUserSession(sessionData) {
    this.metrics.userSessions++;
    
    if (sessionData.duration) {
      this.metrics.avgSessionDuration = 
        (this.metrics.avgSessionDuration * (this.metrics.userSessions - 1) + sessionData.duration) / 
        this.metrics.userSessions;
    }
    
    this.recordMetric('user_session', sessionData.duration || 0, {
      pageViews: sessionData.pageViews,
      interactions: sessionData.interactions,
      device: sessionData.device
    });
  }

  /**
   * Record error
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   */
  recordError(error, context = {}) {
    this.metrics.errors++;
    this.metrics.errorRate = this.metrics.errors / this.metrics.totalRequests;
    
    const errorType = error.name || 'UnknownError';
    const currentCount = this.metrics.errorTypes.get(errorType) || 0;
    this.metrics.errorTypes.set(errorType, currentCount + 1);
    
    this.recordMetric('error', 1, {
      type: errorType,
      message: error.message,
      stack: error.stack?.substring(0, 200), // Truncate stack
      context
    });
    
    // Notify observers of critical errors
    if (this.metrics.errorRate > 0.1) { // 10% error rate
      this.notifyObservers({
        type: 'high_error_rate',
        errorRate: this.metrics.errorRate,
        totalErrors: this.metrics.errors
      });
    }
  }

  /**
   * Record page load performance
   */
  recordPageLoad() {
    if (typeof performance === 'undefined') return;
    
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.loadEventStart);
      this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
      this.recordMetric('first_paint', navigation.loadEventEnd - navigation.fetchStart);
    }
  }

  /**
   * Record navigation timing
   */
  recordNavigationTiming() {
    if (typeof performance === 'undefined') return;
    
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      this.recordMetric('dns_lookup', navigation.domainLookupEnd - navigation.domainLookupStart);
      this.recordMetric('tcp_connection', navigation.connectEnd - navigation.connectStart);
      this.recordMetric('request_response', navigation.responseEnd - navigation.requestStart);
      this.recordMetric('dom_processing', navigation.domComplete - navigation.domLoading);
    }
  }

  /**
   * Record resource timing
   */
  recordResourceTiming() {
    if (typeof performance === 'undefined') return;
    
    const resources = performance.getEntriesByType('resource');
    resources.forEach(resource => {
      this.recordMetric('resource_load', resource.duration, {
        name: resource.name,
        type: resource.initiatorType,
        size: resource.transferSize
      });
    });
  }

  /**
   * Update aggregated metrics
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   */
  updateAggregatedMetrics(name, value) {
    switch (name) {
      case 'request':
        this.metrics.totalRequests++;
        this.metrics.avgResponseTime = 
          (this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) + value) / 
          this.metrics.totalRequests;
        break;
      case 'success':
        this.metrics.successfulRequests++;
        break;
      case 'error':
        this.metrics.failedRequests++;
        break;
    }
  }

  /**
   * Add performance observer
   * @param {Function} callback - Observer callback
   */
  addObserver(callback) {
    this.observers.add(callback);
  }

  /**
   * Remove performance observer
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
        console.error('Performance observer error:', error);
      }
    });
  }

  /**
   * Get performance metrics
   * @returns {Object} - Performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      successRate: this.metrics.successfulRequests / this.metrics.totalRequests || 0,
      avgTokensPerRequest: this.metrics.aiTokensUsed / this.metrics.aiRequests || 0,
      avgCostPerRequest: this.metrics.aiCost / this.metrics.aiRequests || 0
    };
  }

  /**
   * Get performance report
   * @returns {Object} - Detailed performance report
   */
  getReport() {
    const metrics = this.getMetrics();
    const recentEntries = this.entries.slice(-100); // Last 100 entries
    
    return {
      summary: metrics,
      recentActivity: recentEntries,
      recommendations: this.generateRecommendations(metrics),
      timestamp: Date.now()
    };
  }

  /**
   * Generate performance recommendations
   * @param {Object} metrics - Performance metrics
   * @returns {Array} - Performance recommendations
   */
  generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.errorRate > 0.05) {
      recommendations.push({
        type: 'error_rate',
        priority: 'high',
        message: 'High error rate detected. Check error logs and improve error handling.',
        value: metrics.errorRate
      });
    }
    
    if (metrics.avgResponseTime > 5000) {
      recommendations.push({
        type: 'response_time',
        priority: 'medium',
        message: 'Slow response times detected. Consider caching and optimization.',
        value: metrics.avgResponseTime
      });
    }
    
    if (metrics.cacheHitRate < 0.3) {
      recommendations.push({
        type: 'cache_efficiency',
        priority: 'medium',
        message: 'Low cache hit rate. Review caching strategy.',
        value: metrics.cacheHitRate
      });
    }
    
    if (metrics.aiCost > 100) {
      recommendations.push({
        type: 'cost_optimization',
        priority: 'low',
        message: 'High AI costs. Consider model optimization and caching.',
        value: metrics.aiCost
      });
    }
    
    return recommendations;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      aiRequests: 0,
      aiResponseTime: 0,
      aiTokensUsed: 0,
      aiCost: 0,
      cacheHits: 0,
      cacheMisses: 0,
      userSessions: 0,
      avgSessionDuration: 0,
      bounceRate: 0,
      errors: 0,
      errorRate: 0,
      errorTypes: new Map()
    };
    
    this.entries = [];
  }
}

// Singleton performance monitor
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState(performanceMonitor.getMetrics());
  
  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics());
    };
    
    performanceMonitor.addObserver(updateMetrics);
    
    const interval = setInterval(updateMetrics, 5000);
    
    return () => {
      performanceMonitor.removeObserver(updateMetrics);
      clearInterval(interval);
    };
  }, []);
  
  return metrics;
}

export default PerformanceMonitor;
