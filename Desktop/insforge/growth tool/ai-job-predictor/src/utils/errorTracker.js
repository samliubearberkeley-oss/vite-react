// 🚀 Advanced Error Tracking System
// Comprehensive error monitoring with context and recovery

class ErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 1000;
    this.errorTypes = new Map();
    this.recoveryStrategies = new Map();
    
    // Error severity levels
    this.severityLevels = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4
    };
    
    // Initialize recovery strategies
    this.initializeRecoveryStrategies();
    
    // Set up global error handlers
    this.setupGlobalErrorHandlers();
  }

  /**
   * Track error with context
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   * @param {string} severity - Error severity
   */
  trackError(error, context = {}, severity = 'MEDIUM') {
    const errorEntry = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      name: error.name,
      severity: this.severityLevels[severity] || this.severityLevels.MEDIUM,
      context: {
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        ...context
      },
      resolved: false
    };
    
    // Add to errors array
    this.errors.push(errorEntry);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.splice(0, this.errors.length - this.maxErrors);
    }
    
    // Update error type statistics
    this.updateErrorTypeStats(error.name);
    
    // Attempt automatic recovery
    this.attemptRecovery(error, context);
    
    // Log error
    this.logError(errorEntry);
    
    return errorEntry.id;
  }

  /**
   * Track AI-specific errors
   * @param {Error} error - Error object
   * @param {Object} aiContext - AI context
   */
  trackAIError(error, aiContext = {}) {
    const context = {
      type: 'ai_error',
      model: aiContext.model,
      prompt: aiContext.prompt?.substring(0, 100), // Truncate for privacy
      tokens: aiContext.tokens,
      cost: aiContext.cost,
      ...aiContext
    };
    
    return this.trackError(error, context, 'HIGH');
  }

  /**
   * Track network errors
   * @param {Error} error - Error object
   * @param {Object} networkContext - Network context
   */
  trackNetworkError(error, networkContext = {}) {
    const context = {
      type: 'network_error',
      url: networkContext.url,
      method: networkContext.method,
      status: networkContext.status,
      responseTime: networkContext.responseTime,
      ...networkContext
    };
    
    return this.trackError(error, context, 'MEDIUM');
  }

  /**
   * Track user interaction errors
   * @param {Error} error - Error object
   * @param {Object} interactionContext - Interaction context
   */
  trackUserError(error, interactionContext = {}) {
    const context = {
      type: 'user_error',
      action: interactionContext.action,
      element: interactionContext.element,
      input: interactionContext.input?.substring(0, 50), // Truncate for privacy
      ...interactionContext
    };
    
    return this.trackError(error, context, 'LOW');
  }

  /**
   * Initialize recovery strategies
   */
  initializeRecoveryStrategies() {
    // AI error recovery
    this.recoveryStrategies.set('ai_error', {
      retry: (error, context) => {
        if (context.retryCount < 3) {
          console.log('🔄 Retrying AI request...');
          return { action: 'retry', delay: 1000 * (context.retryCount + 1) };
        }
        return { action: 'fallback', fallback: 'cached_response' };
      },
      fallback: (error, context) => {
        console.log('🔄 Using fallback response...');
        return { action: 'fallback', fallback: 'default_response' };
      }
    });
    
    // Network error recovery
    this.recoveryStrategies.set('network_error', {
      retry: (error, context) => {
        if (context.retryCount < 2) {
          console.log('🔄 Retrying network request...');
          return { action: 'retry', delay: 2000 };
        }
        return { action: 'fallback', fallback: 'offline_mode' };
      },
      fallback: (error, context) => {
        console.log('🔄 Switching to offline mode...');
        return { action: 'fallback', fallback: 'cached_data' };
      }
    });
    
    // Cache error recovery
    this.recoveryStrategies.set('cache_error', {
      retry: (error, context) => {
        console.log('🔄 Clearing cache and retrying...');
        return { action: 'clear_cache' };
      },
      fallback: (error, context) => {
        console.log('🔄 Using direct API call...');
        return { action: 'bypass_cache' };
      }
    });
  }

  /**
   * Attempt automatic recovery
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   */
  attemptRecovery(error, context) {
    const errorType = context.type || 'general';
    const strategy = this.recoveryStrategies.get(errorType);
    
    if (!strategy) return;
    
    try {
      const recovery = strategy.retry ? strategy.retry(error, context) : strategy.fallback(error, context);
      
      if (recovery.action === 'retry') {
        setTimeout(() => {
          this.executeRecovery(recovery, error, context);
        }, recovery.delay || 1000);
      } else {
        this.executeRecovery(recovery, error, context);
      }
    } catch (recoveryError) {
      console.error('❌ Recovery attempt failed:', recoveryError);
    }
  }

  /**
   * Execute recovery action
   * @param {Object} recovery - Recovery action
   * @param {Error} error - Original error
   * @param {Object} context - Error context
   */
  executeRecovery(recovery, error, context) {
    switch (recovery.action) {
      case 'retry':
        // Retry logic would be implemented by the calling code
        console.log('🔄 Executing retry...');
        break;
      case 'fallback':
        this.executeFallback(recovery.fallback, error, context);
        break;
      case 'clear_cache':
        this.clearCaches();
        break;
      case 'bypass_cache':
        // Bypass cache logic would be implemented by the calling code
        console.log('🔄 Bypassing cache...');
        break;
    }
  }

  /**
   * Execute fallback strategy
   * @param {string} fallback - Fallback type
   * @param {Error} error - Original error
   * @param {Object} context - Error context
   */
  executeFallback(fallback, error, context) {
    switch (fallback) {
      case 'cached_response':
        console.log('🔄 Using cached response...');
        break;
      case 'default_response':
        console.log('🔄 Using default response...');
        break;
      case 'offline_mode':
        console.log('🔄 Switching to offline mode...');
        break;
      case 'cached_data':
        console.log('🔄 Using cached data...');
        break;
    }
  }

  /**
   * Clear all caches
   */
  clearCaches() {
    // Clear browser caches
    if (typeof caches !== 'undefined') {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }
    
    // Clear application caches
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  }

  /**
   * Update error type statistics
   * @param {string} errorType - Error type
   */
  updateErrorTypeStats(errorType) {
    const currentCount = this.errorTypes.get(errorType) || 0;
    this.errorTypes.set(errorType, currentCount + 1);
  }

  /**
   * Log error with appropriate level
   * @param {Object} errorEntry - Error entry
   */
  logError(errorEntry) {
    const logLevel = this.getLogLevel(errorEntry.severity);
    const message = `[${errorEntry.name}] ${errorEntry.message}`;
    
    switch (logLevel) {
      case 'error':
        console.error(message, errorEntry);
        break;
      case 'warn':
        console.warn(message, errorEntry);
        break;
      case 'info':
        console.info(message, errorEntry);
        break;
      default:
        console.log(message, errorEntry);
    }
  }

  /**
   * Get log level based on severity
   * @param {number} severity - Error severity
   * @returns {string} - Log level
   */
  getLogLevel(severity) {
    if (severity >= this.severityLevels.CRITICAL) return 'error';
    if (severity >= this.severityLevels.HIGH) return 'error';
    if (severity >= this.severityLevels.MEDIUM) return 'warn';
    return 'info';
  }

  /**
   * Set up global error handlers
   */
  setupGlobalErrorHandlers() {
    if (typeof window !== 'undefined') {
      // Unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.trackError(
          new Error(event.reason),
          { type: 'unhandled_promise_rejection' },
          'HIGH'
        );
      });
      
      // JavaScript errors
      window.addEventListener('error', (event) => {
        this.trackError(
          event.error,
          { 
            type: 'javascript_error',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          },
          'MEDIUM'
        );
      });
    }
  }

  /**
   * Generate unique error ID
   * @returns {string} - Error ID
   */
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   * @returns {Object} - Error statistics
   */
  getErrorStats() {
    const totalErrors = this.errors.length;
    const criticalErrors = this.errors.filter(e => e.severity >= this.severityLevels.CRITICAL).length;
    const highErrors = this.errors.filter(e => e.severity >= this.severityLevels.HIGH).length;
    const resolvedErrors = this.errors.filter(e => e.resolved).length;
    
    return {
      totalErrors,
      criticalErrors,
      highErrors,
      resolvedErrors,
      resolutionRate: totalErrors > 0 ? resolvedErrors / totalErrors : 0,
      errorTypes: Object.fromEntries(this.errorTypes),
      recentErrors: this.errors.slice(-10)
    };
  }

  /**
   * Get errors by severity
   * @param {string} severity - Severity level
   * @returns {Array} - Filtered errors
   */
  getErrorsBySeverity(severity) {
    const severityLevel = this.severityLevels[severity];
    return this.errors.filter(e => e.severity >= severityLevel);
  }

  /**
   * Mark error as resolved
   * @param {string} errorId - Error ID
   */
  resolveError(errorId) {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      error.resolvedAt = Date.now();
    }
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    this.errors = [];
    this.errorTypes.clear();
  }
}

// Singleton error tracker
export const errorTracker = new ErrorTracker();

// React hook for error tracking
export function useErrorTracking() {
  const [errorStats, setErrorStats] = useState(errorTracker.getErrorStats());
  
  useEffect(() => {
    const updateStats = () => {
      setErrorStats(errorTracker.getErrorStats());
    };
    
    const interval = setInterval(updateStats, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return errorStats;
}

export default ErrorTracker;
