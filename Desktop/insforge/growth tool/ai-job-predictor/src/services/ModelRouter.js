// 🚀 Intelligent Model Routing System
// Dynamic model selection based on task complexity and performance requirements

class ModelRouter {
  constructor() {
    this.models = {
      // Fast models for simple tasks
      fast: {
        'openai/gpt-4o-mini': {
          cost: 0.15,
          speed: 100,
          quality: 80,
          maxTokens: 4000,
          useCases: ['simple_analysis', 'quick_responses']
        },
      },
      
      // Balanced models for medium complexity
      balanced: {
        'openai/gpt-4o': {
          cost: 2.0,
          speed: 60,
          quality: 95,
          maxTokens: 8000,
          useCases: ['complex_analysis', 'detailed_reasoning']
        },
      },
      
      // Specialized models
      specialized: {
        'google/gemini-2.5-flash': {
          cost: 0.75,
          speed: 80,
          quality: 90,
          maxTokens: 10000,
          useCases: ['image_generation', 'multimodal_tasks']
        }
      }
    };

    this.routingRules = {
      // Job analysis routing
      jobAnalysis: (complexity, urgency) => {
        if (complexity < 0.3 && urgency < 0.5) {
          return 'openai/gpt-4o-mini';
        } else if (complexity < 0.7) {
          return 'openai/gpt-4o';
        } else {
          return 'openai/gpt-4o';
        }
      },
      
      // Meme generation routing
      memeGeneration: (complexity, hasImage) => {
        if (hasImage) {
          return 'google/gemini-2.5-flash';
        } else {
          return 'openai/gpt-4o-mini';
        }
      }
    };

    this.performanceHistory = new Map();
    this.costTracking = new Map();
  }

  /**
   * Route request to optimal model
   * @param {string} taskType - Type of task
   * @param {Object} context - Request context
   * @returns {string} - Selected model
   */
  routeModel(taskType, context = {}) {
    const { complexity = 0.5, urgency = 0.5, hasImage = false, budget = 1.0 } = context;
    
    let selectedModel;

    switch (taskType) {
      case 'job_analysis':
        selectedModel = this.routingRules.jobAnalysis(complexity, urgency);
        break;
      case 'meme_generation':
        selectedModel = this.routingRules.memeGeneration(complexity, hasImage);
        break;
      default:
        selectedModel = 'openai/gpt-4o-mini'; // Default fallback
    }

    // Apply budget constraints
    if (budget < 0.5 && selectedModel === 'openai/gpt-4o') {
      selectedModel = 'openai/gpt-4o-mini';
    }

    return selectedModel;
  }

  /**
   * Analyze task complexity
   * @param {string} jobTitle - Job title to analyze
   * @returns {number} - Complexity score (0-1)
   */
  analyzeComplexity(jobTitle) {
    const complexityFactors = {
      // High complexity indicators
      technical: ['engineer', 'developer', 'scientist', 'architect', 'specialist'],
      management: ['manager', 'director', 'executive', 'lead', 'head'],
      creative: ['designer', 'writer', 'artist', 'creative', 'content'],
      
      // Medium complexity indicators
      analytical: ['analyst', 'researcher', 'consultant', 'advisor'],
      operational: ['coordinator', 'supervisor', 'administrator'],
      
      // Low complexity indicators
      routine: ['assistant', 'clerk', 'receptionist', 'cashier', 'operator']
    };

    const title = jobTitle.toLowerCase();
    let complexity = 0.5; // Default

    // Check for high complexity
    if (complexityFactors.technical.some(term => title.includes(term))) {
      complexity = 0.8;
    } else if (complexityFactors.management.some(term => title.includes(term))) {
      complexity = 0.7;
    } else if (complexityFactors.creative.some(term => title.includes(term))) {
      complexity = 0.6;
    } else if (complexityFactors.analytical.some(term => title.includes(term))) {
      complexity = 0.5;
    } else if (complexityFactors.operational.some(term => title.includes(term))) {
      complexity = 0.4;
    } else if (complexityFactors.routine.some(term => title.includes(term))) {
      complexity = 0.3;
    }

    return complexity;
  }

  /**
   * Get model configuration
   * @param {string} modelName - Model name
   * @returns {Object} - Model configuration
   */
  getModelConfig(modelName) {
    for (const category of Object.values(this.models)) {
      if (category[modelName]) {
        return category[modelName];
      }
    }
    return null;
  }

  /**
   * Track model performance
   * @param {string} modelName - Model name
   * @param {Object} metrics - Performance metrics
   */
  trackPerformance(modelName, metrics) {
    if (!this.performanceHistory.has(modelName)) {
      this.performanceHistory.set(modelName, []);
    }

    const history = this.performanceHistory.get(modelName);
    history.push({
      timestamp: Date.now(),
      ...metrics
    });

    // Keep only last 100 entries
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
  }

  /**
   * Get model performance stats
   * @param {string} modelName - Model name
   * @returns {Object} - Performance statistics
   */
  getPerformanceStats(modelName) {
    const history = this.performanceHistory.get(modelName) || [];
    
    if (history.length === 0) {
      return { avgResponseTime: 0, successRate: 0, totalRequests: 0 };
    }

    const totalRequests = history.length;
    const successfulRequests = history.filter(h => h.success).length;
    const avgResponseTime = history.reduce((sum, h) => sum + h.responseTime, 0) / totalRequests;

    return {
      avgResponseTime,
      successRate: successfulRequests / totalRequests,
      totalRequests,
      lastUsed: history[history.length - 1]?.timestamp
    };
  }

  /**
   * Optimize routing based on performance history
   * @param {string} taskType - Task type
   * @param {Object} context - Request context
   * @returns {string} - Optimized model selection
   */
  optimizeRouting(taskType, context) {
    const baseModel = this.routeModel(taskType, context);
    const stats = this.getPerformanceStats(baseModel);

    // If model has poor performance, try alternative
    if (stats.successRate < 0.8 && stats.totalRequests > 10) {
      const alternatives = this.getAlternatives(baseModel);
      for (const altModel of alternatives) {
        const altStats = this.getPerformanceStats(altModel);
        if (altStats.successRate > stats.successRate) {
          return altModel;
        }
      }
    }

    return baseModel;
  }

  /**
   * Get alternative models for a given model
   * @param {string} modelName - Original model
   * @returns {Array} - Alternative models
   */
  getAlternatives(modelName) {
    const alternatives = {
      'openai/gpt-4o': ['openai/gpt-4o-mini', 'google/gemini-2.5-flash'],
      'openai/gpt-4o-mini': ['openai/gpt-4o', 'google/gemini-2.5-flash'],
      'google/gemini-2.5-flash': ['openai/gpt-4o-mini', 'openai/gpt-4o']
    };

    return alternatives[modelName] || [];
  }
}

// Singleton model router
export const modelRouter = new ModelRouter();
export default ModelRouter;
