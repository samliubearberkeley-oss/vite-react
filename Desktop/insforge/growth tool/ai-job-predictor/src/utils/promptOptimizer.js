// 🚀 Prompt Optimization Utilities
// Advanced prompt compression and optimization techniques

class PromptOptimizer {
  constructor() {
    this.compressionRules = {
      // Remove redundant words
      redundant: [
        /\b(very|really|quite|extremely|incredibly)\s+/gi,
        /\b(a lot of|lots of|many|much)\s+/gi,
        /\b(in order to|so as to)\s+/gi,
        /\b(due to the fact that|because of the fact that)\s+/gi
      ],
      
      // Simplify complex phrases
      simplification: [
        [/in the event that/gi, 'if'],
        [/with regard to/gi, 'about'],
        [/in the case of/gi, 'if'],
        [/it is important to note that/gi, 'note:'],
        [/it should be noted that/gi, 'note:'],
        [/it is worth mentioning that/gi, 'note:']
      ],
      
      // Remove unnecessary phrases
      unnecessary: [
        /\b(please note that|it is worth noting that|it should be noted that)\s+/gi,
        /\b(as you can see|as shown|as demonstrated)\s+/gi,
        /\b(in other words|to put it another way|that is to say)\s+/gi
      ]
    };

    this.templateCache = new Map();
    this.compressionStats = {
      originalTokens: 0,
      compressedTokens: 0,
      compressionRatio: 0
    };
  }

  /**
   * Compress prompt while maintaining quality
   * @param {string} prompt - Original prompt
   * @param {Object} options - Compression options
   * @returns {string} - Compressed prompt
   */
  compressPrompt(prompt, options = {}) {
    const {
      maxTokens = 2000,
      preserveStructure = true,
      aggressive = false
    } = options;

    let compressed = prompt;

    // Apply compression rules
    if (aggressive) {
      compressed = this.aggressiveCompression(compressed);
    } else {
      compressed = this.moderateCompression(compressed);
    }

    // Estimate token count (rough approximation)
    const estimatedTokens = this.estimateTokens(compressed);
    
    if (estimatedTokens > maxTokens) {
      compressed = this.truncateToTokens(compressed, maxTokens);
    }

    // Update stats
    this.updateCompressionStats(prompt, compressed);

    return compressed;
  }

  /**
   * Moderate compression - balanced approach
   * @param {string} text - Text to compress
   * @returns {string} - Compressed text
   */
  moderateCompression(text) {
    let compressed = text;

    // Apply redundant word removal
    this.compressionRules.redundant.forEach(rule => {
      compressed = compressed.replace(rule, '');
    });

    // Apply simplification
    this.compressionRules.simplification.forEach(([pattern, replacement]) => {
      compressed = compressed.replace(pattern, replacement);
    });

    // Remove unnecessary phrases
    this.compressionRules.unnecessary.forEach(rule => {
      compressed = compressed.replace(rule, '');
    });

    // Clean up extra spaces
    compressed = compressed.replace(/\s+/g, ' ').trim();

    return compressed;
  }

  /**
   * Aggressive compression - maximum reduction
   * @param {string} text - Text to compress
   * @returns {string} - Aggressively compressed text
   */
  aggressiveCompression(text) {
    let compressed = text;

    // Remove articles and prepositions where possible
    compressed = compressed.replace(/\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by)\b/gi, '');
    
    // Remove filler words
    compressed = compressed.replace(/\b(that|which|who|whom|whose)\b/gi, '');
    
    // Simplify verb forms
    compressed = compressed.replace(/\b(is|are|was|were|be|been|being)\b/gi, '');
    
    // Remove common qualifiers
    compressed = compressed.replace(/\b(some|any|all|each|every|most|many|few|several)\b/gi, '');
    
    // Clean up
    compressed = this.moderateCompression(compressed);
    compressed = compressed.replace(/\s+/g, ' ').trim();

    return compressed;
  }

  /**
   * Create optimized system prompt
   * @param {string} taskType - Type of task
   * @param {Object} context - Task context
   * @returns {string} - Optimized system prompt
   */
  createSystemPrompt(taskType, context = {}) {
    const templates = {
      job_analysis: this.getJobAnalysisPrompt(context),
      meme_generation: this.getMemeGenerationPrompt(context),
      general: this.getGeneralPrompt(context)
    };

    const template = templates[taskType] || templates.general;
    return this.compressPrompt(template, { maxTokens: 1000 });
  }

  /**
   * Get job analysis prompt template
   * @param {Object} context - Context
   * @returns {string} - Prompt template
   */
  getJobAnalysisPrompt(context) {
    return `AI job replacement analyst. Analyze job automation risk.

CRITICAL RULES:
- Return ONLY JSON: {"riskScore": 0-100, "category": "high_risk|medium_risk|low_risk|ai_creator", "reasoning": "30-50 words", "timeframe": "months"}
- Be BRUTAL and CONCISE
- Focus on repetitive tasks and automation potential
- Default to HIGH RISK for knowledge work

SCORING:
- 90-100%: AI already replaces you
- 75-90%: AI is your boss now  
- 60-75%: AI rapidly learning
- 40-60%: AI watching
- 20-40%: Buying time
- 0-20%: Safe for now

REASONING: 30-50 words max. Be savage.`;
  }

  /**
   * Get meme generation prompt template
   * @param {Object} context - Context
   * @returns {string} - Prompt template
   */
  getMemeGenerationPrompt(context) {
    return `Meme text generator. Create SAVAGE, HILARIOUS captions.

FORMAT RULES:
- ALL CAPS
- Use " / " for multiple positions
- Keep segments SHORT (3-8 words)
- Balance length between segments
- Be BRUTAL and FUNNY

POSITIONS:
- Two Buttons: "LEFT TEXT / RIGHT TEXT"
- Top/Bottom: "TOP TEXT / BOTTOM TEXT"
- Drake Style: "REJECT / APPROVE"

TONE BY RISK:
- HIGH (75-100%): Savage roast
- MEDIUM (40-75%): Nervous humor  
- LOW (10-40%): Ironic flex

Return ONLY meme text. No explanations.`;
  }

  /**
   * Get general prompt template
   * @param {Object} context - Context
   * @returns {string} - Prompt template
   */
  getGeneralPrompt(context) {
    return `AI assistant. Provide helpful, accurate responses.

GUIDELINES:
- Be concise and clear
- Use simple language
- Provide actionable advice
- Stay on topic
- Be professional but friendly`;
  }

  /**
   * Estimate token count (rough approximation)
   * @param {string} text - Text to analyze
   * @returns {number} - Estimated token count
   */
  estimateTokens(text) {
    // Rough approximation: 1 token ≈ 4 characters for English
    return Math.ceil(text.length / 4);
  }

  /**
   * Truncate text to fit token limit
   * @param {string} text - Text to truncate
   * @param {number} maxTokens - Maximum tokens
   * @returns {string} - Truncated text
   */
  truncateToTokens(text, maxTokens) {
    const maxChars = maxTokens * 4;
    if (text.length <= maxChars) return text;
    
    // Truncate at word boundary
    const truncated = text.substring(0, maxChars);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  /**
   * Update compression statistics
   * @param {string} original - Original text
   * @param {string} compressed - Compressed text
   */
  updateCompressionStats(original, compressed) {
    const originalTokens = this.estimateTokens(original);
    const compressedTokens = this.estimateTokens(compressed);
    
    this.compressionStats.originalTokens += originalTokens;
    this.compressionStats.compressedTokens += compressedTokens;
    this.compressionStats.compressionRatio = 
      this.compressionStats.compressedTokens / this.compressionStats.originalTokens;
  }

  /**
   * Get compression statistics
   * @returns {Object} - Compression stats
   */
  getCompressionStats() {
    return {
      ...this.compressionStats,
      savings: this.compressionStats.originalTokens - this.compressionStats.compressedTokens,
      savingsPercentage: (1 - this.compressionStats.compressionRatio) * 100
    };
  }

  /**
   * Reset compression statistics
   */
  resetStats() {
    this.compressionStats = {
      originalTokens: 0,
      compressedTokens: 0,
      compressionRatio: 0
    };
  }
}

// Singleton prompt optimizer
export const promptOptimizer = new PromptOptimizer();
export default PromptOptimizer;
