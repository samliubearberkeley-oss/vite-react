// 🚀 Optimized AI Service Layer
// Centralized AI operations with caching, error handling, and performance monitoring

import { createClient } from '@insforge/sdk';
import { INSFORGE_CONFIG } from '../config/insforge';

class AIService {
  constructor() {
    this.client = createClient({ 
      baseUrl: INSFORGE_CONFIG.baseUrl
    });
    
    // Performance monitoring
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      errors: 0,
      avgResponseTime: 0
    };
    
    // Simple in-memory cache (for production, use Redis)
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Analyze job risk with caching and performance monitoring
   * @param {string} jobTitle - Job title to analyze
   * @returns {Promise<Object>} - Analysis result
   */
  async analyzeJobRisk(jobTitle) {
    const startTime = performance.now();
    this.metrics.totalRequests++;

    try {
      // Check cache first
      const cacheKey = `job_analysis_${jobTitle.toLowerCase()}`;
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        this.metrics.cacheHits++;
        console.log('✅ Cache hit for job analysis:', jobTitle);
        return cached;
      }

      // Call AI analysis
      const { data, error } = await this.client.functions.invoke('ai-analysis', {
        body: { jobTitle }
      });

      if (error) {
        throw new Error(`AI analysis failed: ${error.message}`);
      }

      const result = {
        ...data.data,
        cached: false,
        responseTime: performance.now() - startTime
      };

      // Cache the result
      this.setCache(cacheKey, result);
      
      // Update metrics
      this.updateMetrics(performance.now() - startTime);
      
      return result;

    } catch (error) {
      this.metrics.errors++;
      console.error('❌ AI analysis error:', error);
      throw error;
    }
  }

  /**
   * Generate meme with optimized pipeline
   * @param {Object} analysisResult - Job analysis result
   * @returns {Promise<Object>} - Meme generation result
   */
  async generateMeme(analysisResult) {
    const startTime = performance.now();

    try {
      // Use Edge Function for meme generation
      const { data, error } = await this.client.functions.invoke('meme-generator', {
        body: {
          jobTitle: analysisResult.title,
          riskScore: analysisResult.riskScore,
          category: analysisResult.category,
          reasoning: analysisResult.reasoning
        }
      });

      if (error) {
        throw new Error(`Meme generation failed: ${error.message}`);
      }

      return {
        ...data.data,
        responseTime: performance.now() - startTime
      };

    } catch (error) {
      console.error('❌ Meme generation error:', error);
      throw error;
    }
  }

  /**
   * Batch process multiple job analyses
   * @param {string[]} jobTitles - Array of job titles
   * @returns {Promise<Object[]>} - Array of analysis results
   */
  async batchAnalyzeJobs(jobTitles) {
    const startTime = performance.now();
    
    try {
      // Process in parallel with concurrency limit
      const concurrencyLimit = 3;
      const results = [];
      
      for (let i = 0; i < jobTitles.length; i += concurrencyLimit) {
        const batch = jobTitles.slice(i, i + concurrencyLimit);
        const batchPromises = batch.map(jobTitle => this.analyzeJobRisk(jobTitle));
        
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults.map(result => 
          result.status === 'fulfilled' ? result.value : { error: result.reason }
        ));
      }

      console.log(`✅ Batch analysis completed: ${results.length} jobs in ${performance.now() - startTime}ms`);
      return results;

    } catch (error) {
      console.error('❌ Batch analysis error:', error);
      throw error;
    }
  }

  // Cache management
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Performance monitoring
  updateMetrics(responseTime) {
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
      this.metrics.totalRequests;
  }

  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.cacheHits / this.metrics.totalRequests,
      errorRate: this.metrics.errors / this.metrics.totalRequests
    };
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
export const aiService = new AIService();
export default AIService;
